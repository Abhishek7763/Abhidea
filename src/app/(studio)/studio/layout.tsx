import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Studio",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export const dynamic = "force-dynamic";

const navItems = [
  { href: "/studio", label: "Dashboard" },
  { href: "/studio/content", label: "Content" },
  { href: "/studio/media", label: "Media" },
  { href: "/studio/settings", label: "Settings" },
] as const;

type StudioLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function StudioLayout({ children }: StudioLayoutProps) {
  return (
    <div className="studio-shell">
      <div className="studio-frame">
        <aside className="studio-sidebar" aria-label="Studio navigation">
          <Link className="studio-brand" href="/studio">
            <strong>ABHIDEA Studio</strong>
            <span>Creator workspace</span>
          </Link>
          <nav className="studio-nav">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} aria-current={item.href === "/studio" ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="studio-main">{children}</div>
      </div>

      <nav className="studio-mobile-nav" aria-label="Studio mobile navigation">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} aria-current={item.href === "/studio" ? "page" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
