import { getSitePath, getSiteUrl } from "@/lib/site-host";

export function getBlogBaseUrl(): string {
  return getSiteUrl("blog");
}

export function getBlogPath(path = "/"): string {
  return getSitePath("blog", path);
}

export function getBlogUrl(path = "/"): string {
  return getSiteUrl("blog", path);
}

export function getBlogArticleUrl(slug: string): string {
  return getBlogUrl(`/${encodeURIComponent(slug)}`);
}
