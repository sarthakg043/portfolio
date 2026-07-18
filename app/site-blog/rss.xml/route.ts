import { getLatestPublishedArticles } from "@/lib/blog/queries";
import { getBlogArticleUrl, getBlogBaseUrl } from "@/lib/blog/url";

function escapeXml(value: string): string {
  return value.replace(/[<>&'\"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '\"': "&quot;",
  })[character] ?? character);
}

export async function GET() {
  const articles = await getLatestPublishedArticles(50);
  const baseUrl = getBlogBaseUrl();
  const items = articles.map((article) => `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(getBlogArticleUrl(article.slug))}</link>
      <guid isPermaLink="true">${escapeXml(getBlogArticleUrl(article.slug))}</guid>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(article.excerpt ?? article.subtitle ?? "")}</description>
      ${article.tags.map((tag) => `<category>${escapeXml(tag.name)}</category>`).join("")}
    </item>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Sarthak Gupta — Blog</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Notes on frontend engineering, backend systems, cybersecurity, and building practical software.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=900, stale-while-revalidate=86400",
    },
  });
}

