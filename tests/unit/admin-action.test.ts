import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  unstable_rethrow: (error: unknown) => {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
  },
}));

import { runAdminAction } from "@/lib/admin/run-action";

afterEach(() => vi.restoreAllMocks());

describe("admin action feedback", () => {
  it("reports successful actions", async () => {
    await expect(runAdminAction(async () => {})).resolves.toEqual({ ok: true });
  });

  it("returns the invalid field with its validation message", async () => {
    const result = await runAdminAction(async () => {
      z.object({ name: z.string().min(1, "Add a name") }).parse({ name: "" });
    });
    expect(result).toEqual({ ok: false, error: "name: Add a name" });
  });

  it("keeps unexpected server details out of client errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await runAdminAction(async () => {
      throw new Error("database host secret.internal rejected request");
    });
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("secret.internal");
  });

  it("preserves actionable asset usage errors", async () => {
    const message = "This asset is in use. Remove it from its article or portfolio entry first.";
    await expect(runAdminAction(async () => { throw new Error(message); })).resolves.toEqual({ ok: false, error: message });
  });

  it("preserves framework authentication redirects", async () => {
    const redirect = new Error("NEXT_REDIRECT");
    await expect(runAdminAction(async () => { throw redirect; })).rejects.toBe(redirect);
  });
});
