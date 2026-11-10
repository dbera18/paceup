import { HomeIcon, PulseIcon, ReelsIcon, UserIcon } from "@/components/ui/Icons";

export const NAV_ITEMS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/reels", label: "Reels", Icon: ReelsIcon },
  { href: "/activities", label: "Activities", Icon: PulseIcon },
  { href: "/profile", label: "Profile", Icon: UserIcon },
] as const;
