import Link from "next/link";
import type { ReactNode } from "react";

import { publicNav } from "@/features/website/site-content";
import { MobileNavigation } from "./mobile-navigation";
import { ThemeToggle } from "./theme-toggle";

type PublicShellProps = Readonly<{
  children: ReactNode;
}>;

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="public-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header">
        <div className="container-page site-header-inner">
          <Link href="/" className="brand-lockup" aria-label="ABHIDEA home">
            <span className="brand-mark" aria-hidden="true">A</span>
            <span>
              <span className="brand-name">ABHIDEA</span>
              <span className="brand-tagline">Read • Learn • Think • Grow</span>
            </span>
          </Link>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {publicNav.map((item) => (
              <Link key={item.href} href={item.href} className="nav-link">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <ThemeToggle />
            <MobileNavigation />
          </div>
        </div>
      </header>

      <main id="main-content">{children}</main>

      <footer className="site-footer">
        <div className="container-page site-footer-grid">
          <div>
            <p className="brand-name">ABHIDEA</p>
            <p className="site-footer-copy">Read • Learn • Think • Grow</p>
          </div>

          <nav className="footer-nav" aria-label="Footer navigation">
            <Link href="/explore">Explore</Link>
            <Link href="/about">About</Link>
            <Link href="/search">Search</Link>
          </nav>

          <div className="site-footer-meta">
            <p>Built for thoughtful reading and useful learning.</p>
            <Link href="/studio" className="admin-login-link">Admin Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
