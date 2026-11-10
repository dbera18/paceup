"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusIcon } from "@/components/ui/Icons";
import { buttonClass } from "@/components/ui/styles";
import { useApp } from "./AppProvider";
import Logo from "./Logo";
import { NAV_ITEMS } from "./nav";

export default function TopBar() {
  const pathname = usePathname();
  const { openCreate } = useApp();

  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-6 px-4 sm:px-6">
        <Logo />

        {/* Desktop navigation (phones use the bottom bar instead) */}
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={
                      "rounded-full px-4 py-2 text-[0.9375rem] font-medium transition " +
                      (active ? "bg-surface-2 text-text" : "text-muted hover:bg-surface-2/70 hover:text-text")
                    }
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Desktop only: on phones the Create button lives in the bottom bar */}
        <div className="hidden md:block">
          <button type="button" onClick={() => openCreate()} className={buttonClass("accent", "md")}>
            <PlusIcon width={18} height={18} strokeWidth={2.2} />
            Create
          </button>
        </div>
      </div>
    </header>
  );
}
