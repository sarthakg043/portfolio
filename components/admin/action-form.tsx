"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { ConfirmDialog, type Confirmation } from "@/components/admin/confirm-dialog";
import type { AdminActionResult } from "@/lib/admin/action-result";

const confirmations: Record<string, Confirmation> = {
  delete: { title: "Delete permanently?", description: "This cannot be undone. The item and its saved history will be permanently removed.", label: "Delete permanently" },
  trash: { title: "Move article to trash?", description: "The article will no longer be public. You can restore it from trash.", label: "Move to trash" },
  publish: { title: "Publish article?", description: "This article will become visible to everyone on your blog.", label: "Publish" },
  unpublish: { title: "Unpublish article?", description: "The article will become a private draft and leave the public blog.", label: "Unpublish" },
};

export function AdminActionForm({ action, children, className, confirmation, successMessage = "Changes saved." }: {
  action: (data: FormData) => Promise<AdminActionResult | void>;
  children: React.ReactNode;
  className?: string;
  confirmation?: Confirmation;
  successMessage?: string;
}) {
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);
  const [result, setResult] = useState<AdminActionResult | null>(null);
  const [queued, setQueued] = useState<{ data: FormData; confirmation: Confirmation } | null>(null);

  function submit(data: FormData) {
    if (busy.current) return;
    busy.current = true;
    setResult(null);
    startTransition(async () => {
      try {
        setResult(await action(data) ?? { ok: true });
      } catch {
        setResult({ ok: false, error: "The request could not be completed. Check your connection and try again. Your entered values have been kept." });
      } finally {
        busy.current = false;
      }
    });
  }

  return <>
    <form className={className} aria-busy={pending} onSubmit={(event) => {
      event.preventDefault();
      if (busy.current || queued) return;
      const submitter = (event.nativeEvent as SubmitEvent).submitter;
      const data = new FormData(event.currentTarget, submitter);
      const prompt = confirmation ?? confirmations[String(data.get("intent"))];
      if (prompt) setQueued({ data, confirmation: prompt });
      else submit(data);
    }}>
      <fieldset disabled={pending} className="contents">{children}</fieldset>
      {pending ? <p role="status" className="flex items-center gap-2 text-sm text-neutral-500"><Loader2 className="size-4 animate-spin" /> Working…</p> : null}
      {result ? <p role={result.ok ? "status" : "alert"} className={`text-sm ${result.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>{result.ok ? successMessage : result.error}</p> : null}
    </form>
    <ConfirmDialog open={Boolean(queued)} onOpenChange={(open) => { if (!open) setQueued(null); }} confirmation={queued?.confirmation ?? { title: "Confirm action", description: "Continue?" }} onConfirm={() => { if (queued) submit(queued.data); setQueued(null); }} />
  </>;
}
