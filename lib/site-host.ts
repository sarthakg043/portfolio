export type SiteKind = "portfolio" | "blog" | "admin";
export type DeploymentMode = "development" | "preview" | "production";

const BLOG_HOSTS = new Set(["blog.spyboy.uk", "blog.localhost"]);
const ADMIN_HOSTS = new Set(["admin.spyboy.uk", "admin.localhost"]);

const DEVELOPMENT_ORIGINS: Record<SiteKind, string> = {
  portfolio: "http://localhost:3000",
  blog: "http://blog.localhost:3000",
  admin: "http://admin.localhost:3000",
};

const PRODUCTION_ORIGINS: Record<SiteKind, string> = {
  portfolio: "https://spyboy.uk",
  blog: "https://blog.spyboy.uk",
  admin: "https://admin.spyboy.uk",
};

const PREVIEW_PREFIXES: Record<SiteKind, string> = {
  portfolio: "",
  blog: "/blog",
  admin: "/admin",
};

export function getDeploymentMode(): DeploymentMode {
  const value = process.env.NEXT_DEV_MODE ?? process.env.VERCEL_ENV ?? "development";
  if (value === "development" || value === "preview" || value === "production") {
    return value;
  }
  throw new Error("NEXT_DEV_MODE must be development, preview, or production.");
}

function withProtocol(hostOrUrl: string): string {
  return hostOrUrl.startsWith("http://") || hostOrUrl.startsWith("https://")
    ? hostOrUrl
    : `https://${hostOrUrl}`;
}

function getPreviewOrigin(): string {
  const vercelHost =
    process.env.VERCEL_BRANCH_URL ??
    process.env.VERCEL_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL;
  if (!vercelHost) {
    throw new Error(
      "NEXT_DEV_MODE=preview requires Vercel's VERCEL_BRANCH_URL or VERCEL_URL system environment variable."
    );
  }
  return new URL(withProtocol(vercelHost)).origin;
}

function normalizePath(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Site paths must begin with one forward slash.");
  }
  return path;
}

export function hostnameWithoutPort(host: string | null): string {
  return (host ?? "").split(":", 1)[0].toLowerCase();
}

export function getSitePathPrefix(site: SiteKind): string {
  return getDeploymentMode() === "preview" ? PREVIEW_PREFIXES[site] : "";
}

export function getSitePath(site: SiteKind, path = "/"): string {
  const normalized = normalizePath(path);
  const prefix = getSitePathPrefix(site);
  if (!prefix) return normalized;
  return normalized === "/" ? prefix : `${prefix}${normalized}`;
}

export function getSiteOrigin(site: SiteKind): string {
  const mode = getDeploymentMode();
  if (mode === "preview") return getPreviewOrigin();
  return mode === "production" ? PRODUCTION_ORIGINS[site] : DEVELOPMENT_ORIGINS[site];
}

export function getSiteUrl(site: SiteKind, path = "/"): string {
  return new URL(getSitePath(site, path), `${getSiteOrigin(site)}/`).toString();
}

export function getSiteKind(host: string | null, pathname = "/"): SiteKind {
  if (getDeploymentMode() === "preview") {
    if (pathname === PREVIEW_PREFIXES.blog || pathname.startsWith(`${PREVIEW_PREFIXES.blog}/`)) return "blog";
    if (pathname === PREVIEW_PREFIXES.admin || pathname.startsWith(`${PREVIEW_PREFIXES.admin}/`)) return "admin";
    return "portfolio";
  }

  const hostname = hostnameWithoutPort(host);
  if (BLOG_HOSTS.has(hostname)) return "blog";
  if (ADMIN_HOSTS.has(hostname)) return "admin";
  return "portfolio";
}

export function getPortfolioBaseUrl(): string {
  return getSiteUrl("portfolio");
}

export function getAdminBaseUrl(): string {
  return getSiteUrl("admin");
}

export function getAdminPath(path = "/"): string {
  return getSitePath("admin", path);
}

export function getAdminUrl(path = "/"): string {
  return getSiteUrl("admin", path);
}
