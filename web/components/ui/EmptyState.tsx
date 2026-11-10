import { ReactNode } from "react";

type Props = {
  emoji: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
};

export default function EmptyState({ emoji, title, children, action }: Props) {
  return (
    <div className="flex flex-col items-center rounded-[1.75rem] border border-dashed border-line px-6 py-14 text-center motion-safe:animate-fade-in">
      <span aria-hidden className="flex size-20 items-center justify-center rounded-full bg-accent-soft text-4xl">
        {emoji}
      </span>
      <h2 className="mt-6 font-serif text-2xl font-medium tracking-tight text-text">{title}</h2>
      <div className="mt-2 max-w-sm text-base leading-relaxed text-muted">{children}</div>
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}
