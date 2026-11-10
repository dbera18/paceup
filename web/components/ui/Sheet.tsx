"use client";

import { ReactNode, useEffect, useRef } from "react";
import { CloseIcon } from "./Icons";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  leading?: ReactNode; // e.g. a back button
};

/*
  A bottom sheet on phones, a centered panel on larger screens.
  Built on the native <dialog> element, which gives us keyboard focus
  trapping, the Escape key, and screen-reader support for free.
*/
export default function Sheet({ open, onClose, title, children, leading }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="sheet-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // tap outside the sheet closes it
      }}
      className={
        "fixed inset-x-0 bottom-0 top-auto m-0 max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-[2rem] bg-surface p-0 text-text shadow-2xl " +
        "backdrop:bg-overlay backdrop:backdrop-blur-[2px] open:motion-safe:animate-sheet-up open:backdrop:motion-safe:animate-fade-in " +
        "sm:inset-0 sm:m-auto sm:max-h-[88dvh] sm:max-w-lg sm:rounded-[2rem]"
      }
    >
      <div className="flex max-h-[inherit] flex-col">
        <div aria-hidden className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-line sm:hidden" />
        <header className="flex shrink-0 items-center gap-2 px-5 pb-2 pt-3 sm:px-7 sm:pt-6">
          <div className="w-10">{leading}</div>
          <h2 id="sheet-title" className="flex-1 text-center font-serif text-xl font-medium tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-10 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-text active:scale-95"
          >
            <CloseIcon width={22} height={22} />
          </button>
        </header>
        <div className="overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 sm:px-7 sm:pb-7">
          {children}
        </div>
      </div>
    </dialog>
  );
}
