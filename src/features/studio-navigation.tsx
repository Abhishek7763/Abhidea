"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/studio", label: "Dashboard" },
  { href: "/studio/content", label: "Content" },
  { href: "/studio/media", label: "Media" },
  { href: "/studio/activity", label: "Activity" },
  { href: "/studio/settings", label: "Settings" },
] as const;

type StudioNavigationProps = Readonly<{
  mobile?: boolean;
}>;

export function StudioNavigation({ mobile = false }: StudioNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className={mobile ? "studio-mobile-nav" : "studio-nav"} aria-label={mobile ? "Studio mobile navigation" : "Studio navigation"}>
      {navItems.map((item) => {
        const isCurrent = item.href === "/studio" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} aria-current={isCurrent ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
