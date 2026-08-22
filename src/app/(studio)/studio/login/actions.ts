"use server";

import { redirect } from "next/navigation";

import { signInStudioMember } from "@/features/studio-auth";

export async function signInStudio(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    redirect("/studio/login?error=missing-fields");
  }

  const result = await signInStudioMember(email.trim(), password);

  if (!result.ok) {
    redirect(`/studio/login?error=${result.reason}`);
  }

  redirect("/studio");
}
