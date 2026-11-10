import { ReactNode } from "react";
import { eyebrow as eyebrowClass } from "@/components/ui/styles";

export default function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="pb-8 pt-8 sm:pb-10 sm:pt-14">
      {eyebrow && <p className={eyebrowClass}>{eyebrow}</p>}
      <h1 className="mt-2 font-serif text-[2.25rem] font-medium leading-[1.1] tracking-[-0.02em] text-text sm:text-5xl">{title}</h1>
      {children && <div className="mt-3 max-w-xl text-[1.0625rem] leading-relaxed text-muted">{children}</div>}
    </header>
  );
}
