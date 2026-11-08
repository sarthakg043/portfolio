"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { httpsUrlSchema } from "@/lib/admin/url-schema";

export function UrlDialog({ kind, initialValue, onClose, onSubmit }: {
  kind: "link" | "image";
  initialValue: string;
  onClose: () => void;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 text-neutral-950 shadow-xl dark:bg-neutral-900 dark:text-white">
        <Dialog.Title className="text-xl font-semibold">{kind === "link" ? "Edit link" : "Insert image"}</Dialog.Title>
        <Dialog.Description className="mt-2 text-sm text-neutral-500">{kind === "link" ? "Enter an HTTPS address, or leave it blank to remove the link." : "Enter the HTTPS address of a publicly accessible image."}</Dialog.Description>
        <form className="mt-5 space-y-5" onSubmit={(event) => {
          event.preventDefault();
          if (kind === "link" && !value.trim()) { onSubmit(""); return; }
          const parsed = httpsUrlSchema.safeParse(value);
          if (!parsed.success) { setError("Enter a valid URL starting with https://."); return; }
          onSubmit(parsed.data);
        }}>
          <label className="admin-field"><span>HTTPS URL</span><input value={value} onChange={(event) => { setValue(event.target.value); setError(null); }} aria-invalid={Boolean(error)} aria-describedby={error ? "url-dialog-error" : undefined} placeholder="https://" /></label>
          {error ? <p id="url-dialog-error" role="alert" className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-3"><Dialog.Close type="button" className="admin-secondary-button">Cancel</Dialog.Close><button className="admin-primary-button">{kind === "link" ? "Apply link" : "Insert image"}</button></div>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
