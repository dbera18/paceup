"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getActivities, getStories } from "@/lib/api";
import { DistanceUnit } from "@/lib/format";
import ActivityForm from "./ActivityForm";
import Feed, { FeedItem } from "./Feed";
import StoryForm from "./StoryForm";
import { cardClass } from "./ui";

type Tab = "activity" | "story";

type WallData = { items: FeedItem[]; error: string | null };

// Load stories and activities together, then mix them into one list, newest first.
// If one of them fails, still show the other and explain what went wrong.
async function loadWall(): Promise<WallData> {
  const [stories, activities] = await Promise.allSettled([getStories(), getActivities()]);
  const items: FeedItem[] = [];
  if (stories.status === "fulfilled") items.push(...stories.value.map((data) => ({ kind: "story" as const, data })));
  if (activities.status === "fulfilled")
    items.push(...activities.value.map((data) => ({ kind: "activity" as const, data })));
  items.sort((a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime());

  const failed = [stories, activities].find((r) => r.status === "rejected");
  const error = failed ? (failed.reason instanceof Error ? failed.reason.message : "We couldn't load the wall.") : null;
  return { items, error };
}

export default function StoryWall() {
  const [tab, setTab] = useState<Tab>("activity");
  const [unit, setUnit] = useState<DistanceUnit>("km");
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyWall = useCallback((data: WallData) => {
    setItems(data.items);
    setError(data.error);
    setLoading(false);
  }, []);

  const refresh = useCallback(() => loadWall().then(applyWall), [applyWall]);

  // Load everything once, when the page first opens in the browser.
  useEffect(() => {
    loadWall().then(applyWall);
  }, [applyWall]);

  // Stop the success-message timer if the page goes away.
  useEffect(() => () => {
    if (successTimer.current) clearTimeout(successTimer.current);
  }, []);

  function handlePosted(message: string) {
    setSuccess(message);
    if (successTimer.current) clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccess(null), 4000);
    void refresh();
  }

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "activity", label: "Log an activity", emoji: "🏃" },
    { id: "story", label: "Share your story", emoji: "✍️" },
  ];

  return (
    <div className="space-y-10">
      <section className={cardClass}>
        <div role="tablist" aria-label="What would you like to do?" className="mb-7 grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={
                "min-h-14 rounded-xl px-2 text-base font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 " +
                (tab === t.id ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text")
              }
            >
              <span className="flex flex-col items-center gap-0.5 py-1.5 sm:flex-row sm:justify-center sm:gap-2 sm:py-0">
                <span aria-hidden className="text-xl leading-none">{t.emoji}</span>
                <span className="leading-tight">{t.label}</span>
              </span>
            </button>
          ))}
        </div>

        <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {tab === "activity" ? (
            <ActivityForm unit={unit} onUnitChange={setUnit} onPosted={handlePosted} />
          ) : (
            <StoryForm onPosted={handlePosted} />
          )}
        </div>

        <div aria-live="polite">
          {success && (
            <p className="mt-5 rounded-2xl bg-success-bg px-4 py-3 text-center text-lg font-bold text-success-text">
              {success}
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="wall-heading">
        <h2 id="wall-heading" className="px-1 text-2xl font-extrabold tracking-tight text-text">
          The wall
        </h2>

        {error && (
          <div role="alert" className="rounded-3xl bg-danger-bg p-5 text-base text-danger-text">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void refresh();
              }}
              className="mt-3 min-h-10 font-bold underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <p className="px-1 text-lg text-muted">Loading the wall…</p>
        ) : (
          (!error || items.length > 0) && <Feed items={items} unit={unit} />
        )}
      </section>
    </div>
  );
}
