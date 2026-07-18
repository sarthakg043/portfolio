export function getBlogBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BLOG_URL ?? "http://blog.localhost:3000";
}

export function getBlogArticleUrl(slug: string): string {
  return new URL(`/${encodeURIComponent(slug)}`, getBlogBaseUrl()).toString();
}

