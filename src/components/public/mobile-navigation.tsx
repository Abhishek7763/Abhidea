"use client";

import Link from "next/link";
import { useRef } from "react";

import { publicNav } from "@/features/website/site-content";

export function MobileNavigation() {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function closeMenu() {
    if (detailsRef.current) detailsRef.current.open = false;
  }

  return (
    <details className="mobile-nav" ref={detailsRef}>
      <summary aria-label="Open navigation menu">Menu</summary>
      <nav aria-label="Mobile navigation" className="mobile-nav-panel">
        {publicNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="mobile-nav-link"
            onClick={closeMenu}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </details>
  );
}
