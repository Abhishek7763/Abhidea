import { NextRequest, NextResponse } from "next/server";

import { refreshStudioSession } from "@/features/studio-auth";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/studio") || value.startsWith("//")) return "/studio";
  if (value.startsWith("/studio/login") || value.startsWith("/studio/session")) return "/studio";
  return value;
}

export async function GET(request: NextRequest) {
  const nextPath = safeNextPath(request.nextUrl.searchParams.get("next"));
  const session = await refreshStudioSession();

  if (!session) {
    return NextResponse.redirect(new URL("/studio/login?error=session-expired", request.url), 303);
  }

  return NextResponse.redirect(new URL(nextPath, request.url), 303);
}
