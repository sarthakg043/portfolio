// PostgreSQL resolves "now" within the write transaction, matching the
// updated_at trigger so a first publication is not mistaken for a later edit.
export function firstPublicationDate(previous: string | null, intent: "publish" | "draft" | "autosave"): string | null {
  return previous ?? (intent === "publish" ? "now" : null);
}
