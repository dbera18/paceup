import { purposeLabel, Story } from "@/lib/api";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function StoryList({ stories }: { stories: Story[] }) {
  if (stories.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
        No stories yet. Be the first to share why you move.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {stories.map((story) => (
        <li key={story.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            {purposeLabel(story.purpose)}
          </span>
          <p className="mt-3 whitespace-pre-line break-words text-stone-800">{story.body}</p>
          <p className="mt-3 text-sm text-stone-500">
            — {story.display_name || "Anonymous"}
            {formatDate(story.created_at) && <> · {formatDate(story.created_at)}</>}
          </p>
        </li>
      ))}
    </ul>
  );
}
