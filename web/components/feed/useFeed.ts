"use client";

import { useEffect, useState } from "react";
import { Activity, getActivities, getStories, Story } from "@/lib/api";
import { useApp } from "@/components/shell/AppProvider";

export type FeedItem =
  | { kind: "story"; data: Story }
  | { kind: "activity"; data: Activity };

type FeedState = { items: FeedItem[]; error: string | null; loaded: boolean };

// Load stories and/or activities, mixed into one list, newest first.
// If one source fails, still show the other and explain what went wrong.
async function loadFeed(withStories: boolean, withActivities: boolean): Promise<FeedState> {
  const [stories, activities] = await Promise.allSettled([
    withStories ? getStories() : Promise.resolve([]),
    withActivities ? getActivities() : Promise.resolve([]),
  ]);
  const items: FeedItem[] = [];
  if (stories.status === "fulfilled") items.push(...stories.value.map((data) => ({ kind: "story" as const, data })));
  if (activities.status === "fulfilled")
    items.push(...activities.value.map((data) => ({ kind: "activity" as const, data })));
  items.sort((a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime());

  const failed = [stories, activities].find((r) => r.status === "rejected");
  const error = failed ? (failed.reason instanceof Error ? failed.reason.message : "We couldn't load the feed.") : null;
  return { items, error, loaded: true };
}

export function useFeed({ stories = true, activities = true } = {}) {
  const { feedVersion } = useApp();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<FeedState>({ items: [], error: null, loaded: false });

  // Reload whenever something new is posted (feedVersion) or the person taps "Try again".
  useEffect(() => {
    let cancelled = false;
    loadFeed(stories, activities).then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [stories, activities, feedVersion, attempt]);

  function retry() {
    setState((s) => ({ ...s, loaded: false, error: null }));
    setAttempt((a) => a + 1);
  }

  return { ...state, retry };
}
