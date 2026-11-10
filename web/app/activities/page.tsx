import EmptyFeed from "@/components/feed/EmptyFeed";
import FeedList from "@/components/feed/FeedList";
import PageHeader from "@/components/shell/PageHeader";

export const metadata = { title: "Activities · PaceUp" };

export default function ActivitiesPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 sm:px-6">
      <PageHeader eyebrow="Activities" title="Every effort counts.">
        Runs, rides, swims and sessions from the community, newest first.
      </PageHeader>
      <FeedList
        stories={false}
        empty={
          <EmptyFeed
            emoji="👟"
            title="No activities yet"
            text="Log your first run, walk, ride, swim or gym session. Big or small, it all counts."
            action="Log an activity"
            kind="activity"
          />
        }
      />
    </main>
  );
}
