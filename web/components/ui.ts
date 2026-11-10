// Shared styles so every form looks and feels the same.

export const labelClass = "block text-base font-semibold text-text";

export const hintClass = "font-normal text-muted";

export const inputClass =
  "block w-full min-h-12 rounded-xl border border-line bg-surface px-4 py-3 text-base text-text " +
  "placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20 " +
  "aria-[invalid=true]:border-danger-text";

export const fieldErrorClass = "text-sm font-medium text-danger-text";

export const primaryButtonClass =
  "w-full min-h-14 rounded-2xl bg-brand px-6 text-lg font-bold text-on-brand shadow-sm transition " +
  "hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 " +
  "active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

export const cardClass = "rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-6";
