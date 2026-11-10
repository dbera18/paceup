import { Story } from "@/lib/api";
import { formatDate } from "@/lib/format";
import Avatar from "@/components/ui/Avatar";
import PurposeTag from "@/components/ui/PurposeTag";
import { cardInteractive } from "@/components/ui/styles";

// The story is the hero: big serif text, with the tag above and the author quiet below.
export default function StoryCard({ story }: { story: Story }) {
  return (
    <article data-purpose={story.purpose} className={`${cardInteractive} relative overflow-hidden p-6 sm:p-9`}>
      {/* a soft wash of the purpose color in the corner */}
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-(--tag-bg) opacity-60 blur-2xl" />
      <div className="relative">
        <PurposeTag value={story.purpose} />
        <blockquote className="mt-5 font-serif text-[1.375rem] leading-[1.55] tracking-[-0.005em] text-text sm:text-[1.625rem]">
          <span aria-hidden className="-ml-1 mr-0.5 font-serif text-[1.15em] text-accent-text">“</span>
          <span className="whitespace-pre-line break-words">{story.body}</span>
          <span aria-hidden className="ml-0.5 text-[1.15em] text-accent-text">”</span>
        </blockquote>
        <footer className="mt-7 flex items-center gap-2.5 text-sm text-muted">
          <Avatar name={story.display_name} />
          <span className="font-medium text-text/80">{story.display_name || "Anonymous"}</span>
          <span aria-hidden>·</span>
          <time dateTime={story.created_at}>{formatDate(story.created_at)}</time>
        </footer>
      </div>
    </article>
  );
}
