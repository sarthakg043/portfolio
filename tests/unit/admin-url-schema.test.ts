import { describe, expect, it } from "vitest";
import { httpsUrlSchema, optionalHttpsUrlSchema } from "@/lib/admin/url-schema";

describe("administrator URL validation", () => {
  it("trims valid HTTPS URLs before returning them", () => {
    expect(httpsUrlSchema.parse("  https://example.com/path  ")).toBe(
      "https://example.com/path"
    );
    expect(optionalHttpsUrlSchema.parse("  https://example.com/article  ")).toBe(
      "https://example.com/article"
    );
  });

  it("normalizes blank optional URLs to null", () => {
    expect(optionalHttpsUrlSchema.parse("   ")).toBeNull();
  });

  it("rejects non-HTTPS URLs", () => {
    expect(httpsUrlSchema.safeParse("http://example.com").success).toBe(false);
    expect(optionalHttpsUrlSchema.safeParse("http://example.com").success).toBe(false);
  });
});
