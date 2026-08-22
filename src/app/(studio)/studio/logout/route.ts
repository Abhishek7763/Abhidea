import { NextRequest, NextResponse } from "next/server";

import { signOutStudioMember } from "@/features/studio-auth";

export async function POST(request: NextRequest) {
  await signOutStudioMember();
  return NextResponse.redirect(new URL("/studio/login", request.url), 303);
}
