"use client";

import { useCallback, useEffect, useState } from "react";
import { getStories, Story } from "@/lib/api";
import StoryForm from "./StoryForm";
import StoryList from "./StoryList";

export default function StoryWall() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ask the backend for stories (it already sends them newest first),
  // then update the page with either the stories or a friendly error.
  const loadStories = useCallback(() => {
    return getStories()
      .then((data) => {
        setStories(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "We couldn't load stories.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Load the stories once, when the page first opens in the browser.
  useEffect(() => {
    getStories()
      .then((data) => setStories(data))
      .catch((err) => setError(err instanceof Error ? err.message : "We couldn't load stories."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-10">
      <StoryForm onPosted={loadStories} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">Story wall</h2>
        {loading ? (
          <p className="text-stone-500">Loading stories…</p>
        ) : error ? (
          <div role="alert" className="rounded-2xl bg-red-50 p-5 text-red-700">
            <p>{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                void loadStories();
              }}
              className="mt-3 text-sm font-medium underline underline-offset-2 hover:text-red-900"
            >
              Try again
            </button>
          </div>
        ) : (
          <StoryList stories={stories} />
        )}
      </section>
    </div>
  );
}
