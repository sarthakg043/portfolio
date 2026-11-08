"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";

export default function AdminError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  const [pending, startTransition] = useTransition();
  return <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-5 text-neutral-950 dark:bg-neutral-950 dark:text-white">
    <section className="admin-panel w-full max-w-lg" role="alert">
      <h1 className="text-2xl font-semibold">Unable to load this page</h1>
      <p className="text-neutral-600 dark:text-neutral-400">Check your connection and try again. If your session has expired, reload the page to sign in.</p>
      {error.digest ? <p className="text-xs text-neutral-500">Reference: {error.digest}</p> : null}
      <div className="flex gap-3"><button disabled={pending} onClick={() => startTransition(() => unstable_retry())} className="admin-primary-button">{pending ? <Loader2 className="size-4 animate-spin" /> : null}{pending ? "Retrying…" : "Try again"}</button><button onClick={() => window.location.reload()} className="admin-secondary-button">Reload page</button></div>
    </section>
  </main>;
}
