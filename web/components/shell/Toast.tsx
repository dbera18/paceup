"use client";

import { CheckIcon } from "@/components/ui/Icons";
import { useApp } from "./AppProvider";

export default function Toast() {
  const { toast } = useApp();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 md:bottom-10"
    >
      {toast && (
        <p className="flex items-center gap-2.5 rounded-full bg-ink py-3 pl-3 pr-5 text-[0.9375rem] font-semibold text-on-ink shadow-xl motion-safe:animate-toast-in">
          <span className="flex size-7 items-center justify-center rounded-full bg-accent text-on-accent">
            <CheckIcon width={16} height={16} strokeWidth={2.6} />
          </span>
          {toast}
        </p>
      )}
    </div>
  );
}
