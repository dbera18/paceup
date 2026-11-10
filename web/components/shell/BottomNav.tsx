"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusIcon } from "@/components/ui/Icons";
import { useApp } from "./AppProvider";
import { NAV_ITEMS } from "./nav";

function Item({ item, pathname }: { item: (typeof NAV_ITEMS)[number]; pathname: string }) {
  const active = pathname === item.href;
  return (
    <li className="flex-1">
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={
          "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[0.6875rem] font-semibold transition active:scale-95 " +
          (active ? "text-text" : "text-muted hover:text-text")
        }
      >
        <item.Icon width={24} height={24} strokeWidth={active ? 2.2 : 1.8} />
        {item.label}
        <span aria-hidden className={"h-1 w-1 rounded-full transition " + (active ? "bg-accent" : "bg-transparent")} />
      </Link>
    </li>
  );
}


// Phone navigation: Home, Reels, Create, Activities, Profile.
export default function BottomNav() {
  const pathname = usePathname();
  const { openCreate } = useApp();
  const [home, reels, activities, profile] = NAV_ITEMS;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-center px-2 pt-1">
        <Item item={home} pathname={pathname} />
        <Item item={reels} pathname={pathname} />
        <li className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={() => openCreate()}
            aria-label="Create"
            className="-mt-5 flex size-14 items-center justify-center rounded-full bg-accent text-on-accent shadow-lg shadow-accent/30 ring-4 ring-bg transition hover:bg-accent-hover active:scale-90"
          >
            <PlusIcon width={26} height={26} strokeWidth={2.4} />
          </button>
        </li>
        <Item item={activities} pathname={pathname} />
        <Item item={profile} pathname={pathname} />
      </ul>
    </nav>
  );
}
