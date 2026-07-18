import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAdminPath,
  getAdminUrl,
  getPortfolioBaseUrl,
  getSiteKind,
  getSiteUrl,
} from "@/lib/site-host";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("site host routing", () => {
  it("uses local subdomains in development", () => {
    vi.stubEnv("NEXT_DEV_MODE", "development");

    expect(getPortfolioBaseUrl()).toBe("http://localhost:3000/");
    expect(getSiteUrl("blog", "/rss.xml")).toBe(
      "http://blog.localhost:3000/rss.xml"
    );
    expect(getAdminUrl("/login")).toBe("http://admin.localhost:3000/login");
    expect(getSiteKind("blog.localhost:3000")).toBe("blog");
    expect(getSiteKind("admin.localhost:3000")).toBe("admin");
  });

  it("uses the production hostnames in production", () => {
    vi.stubEnv("NEXT_DEV_MODE", "production");

    expect(getPortfolioBaseUrl()).toBe("https://spyboy.uk/");
    expect(getSiteUrl("blog", "/articles")).toBe(
      "https://blog.spyboy.uk/articles"
    );
    expect(getAdminUrl("/")).toBe("https://admin.spyboy.uk/");
  });

  it("maps preview sites to stable path prefixes", () => {
    vi.stubEnv("NEXT_DEV_MODE", "preview");
    vi.stubEnv(
      "VERCEL_BRANCH_URL",
      "portfolio-git-feat-blog-spyboys-projects.vercel.app"
    );

    expect(getSiteUrl("portfolio", "/portfolio/frontend")).toBe(
      "https://portfolio-git-feat-blog-spyboys-projects.vercel.app/portfolio/frontend"
    );
    expect(getSiteUrl("blog", "/rss.xml")).toBe(
      "https://portfolio-git-feat-blog-spyboys-projects.vercel.app/blog/rss.xml"
    );
    expect(getAdminPath("/articles")).toBe("/admin/articles");
    expect(getSiteKind("ignored.example", "/blog/article")).toBe("blog");
    expect(getSiteKind("ignored.example", "/admin/login")).toBe("admin");
  });
});
