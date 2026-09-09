"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error", { name: error.name, digest: error.digest });
  }, [error]);

  return (
    <section className="page-shell text-center">
      <h1 className="text-3xl font-black">Something went wrong</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-stone-500">
        If this keeps happening, try a private/incognito window (browser extensions can break the page).
      </p>
      <button className="button button-primary mt-6" onClick={reset} type="button">
        Retry
      </button>
    </section>
  );
}
