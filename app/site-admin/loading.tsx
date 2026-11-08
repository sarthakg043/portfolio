import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return <main className="min-h-screen bg-neutral-50 px-5 py-16 text-neutral-950 dark:bg-neutral-950 dark:text-white" aria-busy="true">
    <div className="mx-auto max-w-7xl space-y-8">
      <p role="status" className="flex items-center gap-3 text-sm font-medium"><Loader2 className="size-5 animate-spin" /> Loading your workspace…</p>
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <div className="h-10 w-56 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
        <div className="grid gap-5 sm:grid-cols-3">{[0, 1, 2].map((key) => <div key={key} className="h-36 rounded-3xl bg-neutral-200 dark:bg-neutral-800" />)}</div>
        <div className="h-72 rounded-3xl bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  </main>;
}
