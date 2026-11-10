"use client";

import { useApp } from "@/components/shell/AppProvider";
import { card } from "@/components/ui/styles";

// "Why did you move today?" — a friendly prompt that opens the Create sheet.
export default function Composer() {
  const { openCreate } = useApp();
  return (
    <div className={`${card} mb-8 flex items-center gap-3 p-3 pl-5`}>
      <button
        type="button"
        onClick={() => openCreate("story")}
        className="min-h-12 min-w-0 flex-1 truncate rounded-full text-left font-serif text-[1.0625rem] text-muted transition hover:text-text sm:text-lg"
      >
        Why did you move today?
      </button>
      <button
        type="button"
        onClick={() => openCreate("activity")}
        className="min-h-11 shrink-0 rounded-full bg-surface-2 px-4 text-sm font-semibold text-text transition hover:bg-line active:scale-95"
      >
        <span aria-hidden className="mr-1">🏃</span> Log<span className="hidden sm:inline"> activity</span>
      </button>
    </div>
  );
}
