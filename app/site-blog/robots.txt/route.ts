import { getBlogUrl } from "@/lib/blog/url";

export function GET() {
  const sitemap = getBlogUrl("/sitemap.xml");
  const body = `User-agent: *\nAllow: /\nSitemap: ${sitemap}\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400",
    },
  });
}
