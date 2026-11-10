import { Activity, findActivityType, findPurpose, Story } from "@/lib/api";
import { DistanceUnit, formatDate, formatDistance, formatDuration, formatPace } from "@/lib/format";
import { cardClass } from "./ui";

export type FeedItem =
  | { kind: "story"; data: Story }
  | { kind: "activity"; data: Activity };

function PurposeTag({ value }: { value: string | null }) {
  const purpose = findPurpose(value);
  if (!purpose) return null;
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${purpose.tag}`}>
      {purpose.label}
    </span>
  );
}

function Byline({ name, createdAt }: { name: string | null; createdAt: string }) {
  const date = formatDate(createdAt);
  return (
    <p className="text-sm text-muted">
      {name || "Anonymous"}
      {date && <> · {date}</>}
    </p>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-extrabold tabular-nums tracking-tight text-text sm:text-3xl">{value}</p>
      <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
    </div>
  );
}

function ActivityCard({ activity, unit }: { activity: Activity; unit: DistanceUnit }) {
  const type = findActivityType(activity.activity_type);
  const hasDistance = activity.distance_m !== null && activity.distance_m > 0;

  return (
    <article className={cardClass}>
      <header className="flex items-start gap-4">
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-3xl"
        >
          {type.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-text">{type.label}</h3>
          <Byline name={activity.display_name} createdAt={activity.created_at} />
        </div>
      </header>

      <div className="mt-5 flex flex-wrap gap-x-8 gap-y-4">
        {hasDistance && <Stat value={formatDistance(activity.distance_m!, unit)} label="Distance" />}
        <Stat value={formatDuration(activity.duration_s)} label="Time" />
        {hasDistance && activity.pace_s_per_km !== null && (
          <Stat value={formatPace(activity.pace_s_per_km, unit)} label="Pace" />
        )}
      </div>

      {(activity.avg_heart_rate !== null || activity.purpose) && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <PurposeTag value={activity.purpose} />
          {activity.avg_heart_rate !== null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1 text-sm font-semibold text-text">
              <span aria-hidden className="text-red-500">♥</span> {activity.avg_heart_rate} bpm
              <span className="sr-only">average heart rate</span>
            </span>
          )}
        </div>
      )}

      {activity.note && (
        <p className="mt-4 whitespace-pre-line break-words text-base leading-relaxed text-text">{activity.note}</p>
      )}
    </article>
  );
}

function StoryCard({ story }: { story: Story }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PurposeTag value={story.purpose} />
        <Byline name={story.display_name} createdAt={story.created_at} />
      </div>
      <p className="mt-4 whitespace-pre-line break-words text-lg leading-relaxed text-text">{story.body}</p>
    </article>
  );
}

export default function Feed({ items, unit }: { items: FeedItem[]; unit: DistanceUnit }) {
  if (items.length === 0) {
    return (
      <p className="rounded-3xl border-2 border-dashed border-line p-10 text-center text-lg text-muted">
        Nothing here yet. Log an activity or share why you move. 🧡
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={`${item.kind}-${item.data.id}`}>
          {item.kind === "activity" ? (
            <ActivityCard activity={item.data} unit={unit} />
          ) : (
            <StoryCard story={item.data} />
          )}
        </li>
      ))}
    </ul>
  );
}
