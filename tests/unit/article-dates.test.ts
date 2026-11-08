import { describe, expect, it } from "vitest";
import { firstPublicationDate } from "@/lib/admin/article-dates";
import { formatArticleDateTime } from "@/lib/blog/format";

describe("article dates", () => {
  const original = "2026-11-08T05:00:00Z";
  it("preserves the first publication across edits, drafts, and republishing", () => {
    for (const intent of ["publish", "draft", "autosave"] as const) {
      expect(firstPublicationDate(original, intent)).toBe(original);
    }
  });
  it("only creates a publication timestamp on first publish", () => {
    expect(firstPublicationDate(null, "publish")).toBe("now");
    expect(firstPublicationDate(null, "draft")).toBeNull();
    expect(firstPublicationDate(null, "autosave")).toBeNull();
  });
  it("formats date and time in the explicitly labelled India timezone", () => {
    expect(formatArticleDateTime(original)).toMatch(/8 Nov 2026.*10:30.*am.*IST/i);
  });
});
