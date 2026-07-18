import type { MetadataRoute } from "next";
import { getPublishedArticleIndex } from "@/lib/blog/queries";
import { getBlogArticleUrl, getBlogBaseUrl } from "@/lib/blog/url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getPublishedArticleIndex();
  return [
    {
      url: getBlogBaseUrl(),
      lastModified: articles[0]?.updatedAt ?? new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...articles.map((article) => ({
      url: getBlogArticleUrl(article.slug),
      lastModified: article.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}

