import Composer from "@/components/feed/Composer";
import EmptyFeed from "@/components/feed/EmptyFeed";
import FeedList from "@/components/feed/FeedList";
import PageHeader from "@/components/shell/PageHeader";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 sm:px-6">
      <PageHeader eyebrow="The PaceUp community" title="Every Step Has a Purpose.">
        Real stories behind every run, walk, ride and lift.
      </PageHeader>
      <Composer />
      <FeedList
        empty={
          <EmptyFeed
            emoji="🌅"
            title="Your community starts here"
            text="No one has shared yet. Tell us who or what you move for, and be the first light on the wall."
            action="Share the first story"
            kind="story"
          />
        }
      />
    </main>
  );
}
