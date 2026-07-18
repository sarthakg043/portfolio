export type SiteKind = "portfolio" | "blog" | "admin";

const BLOG_HOSTS = new Set(["blog.spyboy.uk", "blog.localhost"]);
const ADMIN_HOSTS = new Set(["admin.spyboy.uk", "admin.localhost"]);

export function hostnameWithoutPort(host: string | null): string {
  return (host ?? "").split(":", 1)[0].toLowerCase();
}

export function getSiteKind(host: string | null): SiteKind {
  const hostname = hostnameWithoutPort(host);
  if (BLOG_HOSTS.has(hostname)) return "blog";
  if (ADMIN_HOSTS.has(hostname)) return "admin";
  return "portfolio";
}

export function getAdminBaseUrl(): string {
  return process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://admin.localhost:3000";
}
