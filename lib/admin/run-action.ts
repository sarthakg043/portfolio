import "server-only";

import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import type { AdminActionResult } from "@/lib/admin/action-result";

export function adminActionError(error: unknown): string {
  unstable_rethrow(error);
  if (error instanceof ZodError) {
    return error.issues.map((issue) => `${issue.path.join(".") || "Input"}: ${issue.message}`).join("; ");
  }
  const message = error instanceof Error ? error.message : "";
  if (message.startsWith("This asset is in use.") || message.startsWith("Move the article to trash")) return message;
  if (/duplicate key|unique constraint/i.test(message)) return "This value is already in use. Choose a different slug or name and try again.";
  if (/row-level security|permission denied|JWT|session/i.test(message)) return "Your session no longer has access. Sign in again, then retry.";
  console.error("Admin operation failed", error);
  return "The operation could not be completed. Check your connection and try again. Your entered values have been kept.";
}

export async function runAdminAction(action: () => Promise<void>): Promise<AdminActionResult> {
  try {
    await action();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: adminActionError(error) };
  }
}
