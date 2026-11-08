"use client";

import { AlertDialog } from "radix-ui";

export type Confirmation = { title: string; description: string; label?: string };

export function ConfirmDialog({ open, onOpenChange, confirmation, onConfirm }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirmation: Confirmation;
  onConfirm: () => void;
}) {
  return <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
    <AlertDialog.Portal>
      <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-neutral-200 bg-white p-6 text-neutral-950 shadow-xl dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
        <AlertDialog.Title className="text-xl font-semibold">{confirmation.title}</AlertDialog.Title>
        <AlertDialog.Description className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400">{confirmation.description}</AlertDialog.Description>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <AlertDialog.Cancel className="admin-secondary-button">Cancel</AlertDialog.Cancel>
          <AlertDialog.Action className="admin-primary-button" onClick={onConfirm}>{confirmation.label ?? "Confirm"}</AlertDialog.Action>
        </div>
      </AlertDialog.Content>
    </AlertDialog.Portal>
  </AlertDialog.Root>;
}
