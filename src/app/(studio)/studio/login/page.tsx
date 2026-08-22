import type { Metadata } from "next";
import Link from "next/link";

import { signInStudio } from "./actions";

export const metadata: Metadata = {
  title: "Studio Sign In",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  "missing-fields": "Enter both your email and password.",
  "invalid-credentials": "The email or password is not valid.",
  "not-authorized": "This account does not have active ABHIDEA Studio access.",
  configuration: "Studio authentication is not configured for this environment yet.",
  "session-expired": "Your Studio session expired. Sign in again.",
};

type LoginPageProps = Readonly<{
  searchParams: Promise<{ error?: string }>;
}>;

export default async function StudioLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <main className="studio-login-shell">
      <section className="studio-login-card" aria-labelledby="studio-login-title">
        <Link className="studio-login-brand" href="/">
          <strong>ABHIDEA</strong>
          <span>Read • Learn • Think • Grow</span>
        </Link>

        <div className="studio-login-heading">
          <p>Private creator workspace</p>
          <h1 id="studio-login-title">Sign in to Studio</h1>
          <span>Only approved admin and creator accounts can enter.</span>
        </div>

        {errorMessage ? (
          <p className="studio-login-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <form className="studio-login-form" action={signInStudio}>
          <label htmlFor="studio-email">
            <span>Email</span>
            <input id="studio-email" name="email" type="email" autoComplete="email" inputMode="email" required />
          </label>

          <label htmlFor="studio-password">
            <span>Password</span>
            <input id="studio-password" name="password" type="password" autoComplete="current-password" required />
          </label>

          <button type="submit">Sign in securely</button>
        </form>

        <div className="studio-login-footnote">
          <span>No public registration.</span>
          <Link href="/">Return to ABHIDEA</Link>
        </div>
      </section>
    </main>
  );
}
