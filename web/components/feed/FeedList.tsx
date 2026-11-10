"use client";

import { ReactNode } from "react";
import { useApp } from "@/components/shell/AppProvider";
import Button from "@/components/ui/Button";
import { FeedSkeleton } from "@/components/ui/Skeleton";
import { card } from "@/components/ui/styles";
import ActivityCard from "./ActivityCard";
import StoryCard from "./StoryCard";
import { useFeed } from "./useFeed";

type Props = {
  stories?: boolean;
  activities?: boolean;
  empty: ReactNode; // what to show when there's nothing yet
};

export default function FeedList({ stories = true, activities = true, empty }: Props) {
  const { unit } = useApp();
  const { items, error, loaded, retry } = useFeed({ stories, activities });

  if (!loaded) return <FeedSkeleton />;

  return (
    <div className="space-y-5">
      {error && (
        <div role="alert" className={`${card} flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center`}>
          <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-full bg-danger-bg text-xl">
            🌧️
          </span>
          <p className="flex-1 text-[0.9375rem] leading-relaxed text-text">{error}</p>
          <Button variant="secondary" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {items.length === 0 && !error && empty}

      {items.length > 0 && (
        <ul className="space-y-5">
          {items.map((item, i) => (
            <li
              key={`${item.kind}-${item.data.id}`}
              className="motion-safe:animate-rise"
              style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}
            >
              {item.kind === "story" ? <StoryCard story={item.data} /> : <ActivityCard activity={item.data} unit={unit} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
