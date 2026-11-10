import { Activity, findActivityType } from "@/lib/api";
import { DistanceUnit, formatDate, formatDistance, formatDuration, formatPace } from "@/lib/format";
import { HeartIcon } from "@/components/ui/Icons";
import PurposeTag from "@/components/ui/PurposeTag";
import { cardInteractive } from "@/components/ui/styles";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="mt-1 text-[1.625rem] font-semibold leading-none tracking-tight tabular-nums text-text sm:text-3xl">{value}</dd>
    </div>
  );
}

export default function ActivityCard({ activity, unit }: { activity: Activity; unit: DistanceUnit }) {
  const type = findActivityType(activity.activity_type);
  const hasDistance = activity.distance_m !== null && activity.distance_m > 0;
  // "5.00 km" → value "5.00" + unit; keeps the number big and the unit small
  const [distValue, distUnit] = hasDistance ? formatDistance(activity.distance_m!, unit).split(" ") : [];
  const author = activity.display_name || "Anonymous";
  const when = activity.started_at ?? activity.created_at;

  return (
    <article className={`${cardInteractive} p-6 sm:p-8`}>
      <header className="flex items-center gap-3">
        <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-2xl">
          {type.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-text">
            {author} <span className="font-normal text-muted">{type.phrase}</span>
          </h3>
          <p className="text-sm text-muted">
            {/* Show when the workout happened if we know it, otherwise when it was shared */}
            <time dateTime={when}>{formatDate(when)}</time>
          </p>
        </div>
      </header>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:flex sm:flex-wrap sm:gap-x-10">
        {hasDistance && (
          <div className="min-w-0">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Distance</dt>
            <dd className="mt-1 text-[1.625rem] font-semibold leading-none tracking-tight tabular-nums text-text sm:text-3xl">
              {distValue}
              <span className="ml-1 text-base font-medium text-muted">{distUnit}</span>
            </dd>
          </div>
        )}
        <Stat value={formatDuration(activity.duration_s)} label="Time" />
        {hasDistance && activity.pace_s_per_km !== null && (
          <Stat value={formatPace(activity.pace_s_per_km, unit)} label="Pace" />
        )}
      </dl>

      {activity.note && (
        <p className="mt-6 whitespace-pre-line break-words font-serif text-lg leading-relaxed text-text">{activity.note}</p>
      )}

      {(activity.purpose || activity.avg_heart_rate !== null) && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <PurposeTag value={activity.purpose} />
          {activity.avg_heart_rate !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-[0.8125rem] font-semibold text-text">
              <HeartIcon width={14} height={14} className="text-accent-text" />
              {activity.avg_heart_rate} bpm
              <span className="sr-only">average heart rate</span>
            </span>
          )}
        </div>
      )}
    </article>
  );
}
