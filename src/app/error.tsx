"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.2em]">ABHIDEA</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-4 leading-7 opacity-75">
        The page could not be loaded. You can safely try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 w-fit rounded-full border px-5 py-2.5 text-sm font-medium"
      >
        Try again
      </button>
    </main>
  );
}
