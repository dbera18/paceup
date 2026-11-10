import { findPurpose } from "@/lib/api";

// A soft, colored pill. Its colors come from [data-purpose] in globals.css.
export default function PurposeTag({ value, size = "md" }: { value: string | null; size?: "sm" | "md" }) {
  const purpose = findPurpose(value);
  if (!purpose) return null;
  return (
    <span
      data-purpose={purpose.value}
      className={
        "inline-flex items-center gap-1.5 rounded-full bg-(--tag-bg) font-semibold text-(--tag-fg) " +
        (size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-[0.8125rem]")
      }
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-70" />
      {purpose.label}
    </span>
  );
}
