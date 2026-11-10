import { card } from "./styles";

function Bar({ className }: { className: string }) {
  return <div className={`rounded-full bg-surface-2 ${className}`} />;
}

// Grey placeholder cards shaped like real ones, shown while the feed loads.
export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading posts" className="space-y-5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`${card} p-6 sm:p-8 motion-safe:animate-pulse`}>
          <Bar className="h-6 w-32" />
          <div className="mt-6 space-y-3">
            <Bar className="h-4 w-full" />
            <Bar className="h-4 w-[92%]" />
            <Bar className="h-4 w-[70%]" />
          </div>
          <div className="mt-8 flex items-center gap-3">
            <div className="size-8 rounded-full bg-surface-2" />
            <Bar className="h-3 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}
