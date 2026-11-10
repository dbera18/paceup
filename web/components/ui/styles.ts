// Shared class names: the design system's building blocks for Tailwind.
// Colors come from the tokens in app/globals.css.

export const card =
  "rounded-[1.75rem] border border-line/70 bg-surface shadow-card";

export const cardInteractive =
  card + " transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-card-hover";

export const label = "block text-[0.9375rem] font-semibold text-text";

export const hint = "font-normal text-muted";

export const input =
  "block w-full min-h-12 rounded-2xl border border-line bg-surface-2/60 px-4 py-3 text-base text-text " +
  "placeholder:text-muted transition duration-200 " +
  "hover:border-muted/40 focus:border-accent focus:bg-surface focus:outline-none focus:ring-4 focus:ring-accent/15 " +
  "aria-[invalid=true]:border-danger-text";

export const fieldError = "text-sm font-medium text-danger-text";

export const eyebrow = "text-xs font-semibold uppercase tracking-[0.14em] text-muted";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold select-none " +
  "transition duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";

export const buttonVariants = {
  primary: "bg-ink text-on-ink hover:bg-ink-hover",
  accent: "bg-accent text-on-accent shadow-sm hover:bg-accent-hover",
  secondary: "bg-surface-2 text-text hover:bg-line",
  ghost: "text-muted hover:bg-surface-2 hover:text-text",
} as const;

export const buttonSizes = {
  sm: "min-h-9 px-4 text-sm",
  md: "min-h-11 px-5 text-[0.9375rem]",
  lg: "min-h-14 px-7 text-base",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra = "") {
  return `${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]} ${extra}`;
}
