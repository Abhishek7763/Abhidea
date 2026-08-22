import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { inspectStudioSession } from "@/features/studio-auth";
import { StudioNavigation } from "@/features/studio-navigation";

export const dynamic = "force-dynamic";

export default async function ProtectedStudioLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await inspectStudioSession();

  if (session.status === "refresh-required") {
    redirect("/studio/session/refresh?next=/studio");
  }

  if (session.status === "forbidden") {
    redirect("/studio/login?error=not-authorized");
  }

  if (session.status !== "active") {
    redirect("/studio/login");
  }

  return (
    <div className="studio-shell">
      <div className="studio-frame">
        <aside className="studio-sidebar">
          <Link className="studio-brand" href="/studio">
            <strong>ABHIDEA Studio</strong>
            <span>Creator workspace</span>
          </Link>

          <StudioNavigation />

          <div className="studio-account-card">
            <div>
              <strong>{session.email ?? "Studio member"}</strong>
              <span>{session.role}</span>
            </div>
            <form action="/studio/logout" method="post">
              <button type="submit">Sign out</button>
            </form>
          </div>
        </aside>

        <div className="studio-main">{children}</div>
      </div>

      <StudioNavigation mobile />
    </div>
  );
}
