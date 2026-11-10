"use client";

import { Purpose, PURPOSES } from "@/lib/api";

type Props = {
  value: Purpose | null;
  onChange: (value: Purpose | null) => void;
  legend: string;
  optional?: boolean; // when optional, tapping the selected chip again clears it
  error?: string;
};

// The 7 purposes as tappable colored chips (colors come from [data-purpose] in globals.css).
export default function PurposePicker({ value, onChange, legend, optional, error }: Props) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-[0.9375rem] font-semibold text-text">
        {legend} {optional && <span className="font-normal text-muted">(optional)</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {PURPOSES.map((p) => {
          const selected = value === p.value;
          return (
            <button
              key={p.value}
              type="button"
              data-purpose={p.value}
              aria-pressed={selected}
              onClick={() => onChange(selected && optional ? null : p.value)}
              className={
                "min-h-11 rounded-full border px-4 text-[0.9375rem] font-semibold transition duration-200 active:scale-95 " +
                (selected
                  ? "border-transparent bg-(--tag-bg) text-(--tag-fg) ring-2 ring-(--tag-fg)/40"
                  : "border-line bg-surface text-muted hover:border-(--tag-fg)/40 hover:text-text")
              }
            >
              {p.label}
            </button>
          );
        })}
      </div>
      {error && <p role="alert" className="text-sm font-medium text-danger-text">{error}</p>}
    </fieldset>
  );
}
