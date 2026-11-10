// A small initial circle. Anonymous posts get a quiet footprint instead.
export default function Avatar({ name }: { name: string | null }) {
  const initial = name?.trim()[0]?.toUpperCase();
  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-muted"
    >
      {initial ?? "👣"}
    </span>
  );
}
