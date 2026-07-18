import "server-only";

import { cache } from "react";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  BlogArticle,
  BlogArticleCard,
  BlogAsset,
  BlogFeed,
  BlogTag,
  BlogTagWithCount,
  TiptapNode,
} from "@/lib/blog/types";

const ARTICLE_CARD_SELECT = `
  id,
  title,
  slug,
  subtitle,
  excerpt,
  featured,
  seo_title,
  seo_description,
  canonical_url,
  external_url,
  reading_time_minutes,
  published_at,
  updated_at,
  cover:assets!articles_cover_asset_id_fkey(
    id,
    kind,
    storage_bucket,
    object_path,
    original_name,
    display_name,
    mime_type,
    byte_size,
    alt_text
  ),
  article_tags(tags(id, name, slug))
`;

const ARTICLE_DETAIL_SELECT = `
  ${ARTICLE_CARD_SELECT},
  content,
  content_text,
  article_assets(
    role,
    display_order,
    asset:assets(
      id,
      kind,
      storage_bucket,
      object_path,
      original_name,
      display_name,
      mime_type,
      byte_size,
      alt_text
    )
  )
`;

const cursorSchema = z.object({
  publishedAt: z.iso.datetime({ offset: true }),
  id: z.uuid(),
});

type RawAsset = {
  id: string;
  kind: BlogAsset["kind"];
  storage_bucket: string;
  object_path: string;
  original_name: string;
  display_name: string;
  mime_type: string;
  byte_size: number;
  alt_text: string | null;
};

type RawArticleTag = { tags: BlogTag | BlogTag[] | null };
type RawArticleAsset = {
  role: string;
  display_order: number;
  asset: RawAsset | RawAsset[] | null;
};

type RawArticle = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string | null;
  featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  external_url: string | null;
  reading_time_minutes: number;
  published_at: string;
  updated_at: string;
  cover: RawAsset | RawAsset[] | null;
  article_tags: RawArticleTag[] | null;
  content?: TiptapNode;
  content_text?: string;
  article_assets?: RawArticleAsset[] | null;
};

function blogError(context: string, error: { message: string }): Error {
  return new Error(`${context}: ${error.message}`);
}

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function publicAssetUrl(asset: RawAsset): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";

  const encodedPath = asset.object_path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return new URL(
    `/storage/v1/object/public/${encodeURIComponent(asset.storage_bucket)}/${encodedPath}`,
    base
  ).toString();
}

function mapAsset(raw: RawAsset | RawAsset[] | null | undefined): BlogAsset | null {
  const asset = first(raw);
  if (!asset) return null;

  return {
    id: asset.id,
    kind: asset.kind,
    storageBucket: asset.storage_bucket,
    objectPath: asset.object_path,
    displayName: asset.display_name,
    originalName: asset.original_name,
    mimeType: asset.mime_type,
    byteSize: Number(asset.byte_size),
    altText: asset.alt_text,
    publicUrl: publicAssetUrl(asset),
  };
}

function mapTags(rows: RawArticleTag[] | null | undefined): BlogTag[] {
  return (rows ?? [])
    .flatMap((row) => (Array.isArray(row.tags) ? row.tags : row.tags ? [row.tags] : []))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function mapCard(raw: RawArticle): BlogArticleCard {
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    subtitle: raw.subtitle,
    excerpt: raw.excerpt,
    featured: raw.featured,
    seoTitle: raw.seo_title,
    seoDescription: raw.seo_description,
    canonicalUrl: raw.canonical_url,
    externalUrl: raw.external_url,
    readingTimeMinutes: raw.reading_time_minutes,
    publishedAt: raw.published_at,
    updatedAt: raw.updated_at,
    cover: mapAsset(raw.cover),
    tags: mapTags(raw.article_tags),
  };
}

function mapArticle(raw: RawArticle): BlogArticle {
  const attachments = (raw.article_assets ?? [])
    .filter((row) => row.role === "attachment")
    .sort((a, b) => a.display_order - b.display_order)
    .map((row) => mapAsset(row.asset))
    .filter((asset): asset is BlogAsset => Boolean(asset));

  return {
    ...mapCard(raw),
    content: raw.content ?? { type: "doc", content: [] },
    contentText: raw.content_text ?? "",
    attachments,
  };
}

function encodeCursor(article: BlogArticleCard): string {
  return Buffer.from(
    JSON.stringify({ publishedAt: article.publishedAt, id: article.id })
  ).toString("base64url");
}

function decodeCursor(value: string | undefined): z.infer<typeof cursorSchema> | null {
  if (!value) return null;

  try {
    return cursorSchema.parse(JSON.parse(Buffer.from(value, "base64url").toString("utf8")));
  } catch {
    return null;
  }
}

export async function listPublishedArticles({
  search,
  tag,
  cursor,
  limit = 7,
}: {
  search?: string;
  tag?: string;
  cursor?: string;
  limit?: number;
} = {}): Promise<BlogFeed> {
  if (!hasSupabaseConfig()) return { articles: [], nextCursor: null };

  const supabase = createPublicClient();
  const safeLimit = Math.min(Math.max(limit, 1), 24);
  const parsedCursor = decodeCursor(cursor);
  let articleIds: string[] | null = null;

  if (tag) {
    const { data: tagRow, error: tagError } = await supabase
      .from("tags")
      .select("id")
      .eq("slug", tag)
      .maybeSingle();

    if (tagError) throw blogError("Unable to load tag", tagError);
    if (!tagRow) return { articles: [], nextCursor: null };

    const { data: links, error: linksError } = await supabase
      .from("article_tags")
      .select("article_id")
      .eq("tag_id", tagRow.id);

    if (linksError) throw blogError("Unable to load tagged articles", linksError);
    articleIds = (links ?? []).map((link) => link.article_id);
    if (articleIds.length === 0) return { articles: [], nextCursor: null };
  }

  let query = supabase
    .from("articles")
    .select(ARTICLE_CARD_SELECT)
    .eq("status", "published")
    .is("deleted_at", null)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(safeLimit + 1);

  if (articleIds) query = query.in("id", articleIds);
  if (search?.trim()) {
    query = query.textSearch("search_vector", search.trim(), {
      config: "english",
      type: "websearch",
    });
  }
  if (parsedCursor) {
    query = query.or(
      `published_at.lt.${parsedCursor.publishedAt},and(published_at.eq.${parsedCursor.publishedAt},id.lt.${parsedCursor.id})`
    );
  }

  const { data, error } = await query;
  if (error) throw blogError("Unable to load articles", error);

  const mapped = ((data ?? []) as unknown as RawArticle[]).map(mapCard);
  const hasMore = mapped.length > safeLimit;
  const articles = mapped.slice(0, safeLimit);

  return {
    articles,
    nextCursor: hasMore && articles.length ? encodeCursor(articles.at(-1)!) : null,
  };
}

export const getPublishedArticle = cache(async (slug: string): Promise<BlogArticle | null> => {
  if (!hasSupabaseConfig()) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_DETAIL_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .lte("published_at", new Date().toISOString())
    .maybeSingle();

  if (error) throw blogError("Unable to load article", error);
  return data ? mapArticle(data as unknown as RawArticle) : null;
});

export async function getRelatedArticles(
  article: BlogArticle,
  limit = 3
): Promise<BlogArticleCard[]> {
  const feed = await listPublishedArticles({ limit: Math.max(limit * 3, 8) });
  const tagIds = new Set(article.tags.map((tag) => tag.id));

  return feed.articles
    .filter((candidate) => candidate.id !== article.id)
    .sort((a, b) => {
      const aMatches = a.tags.filter((tag) => tagIds.has(tag.id)).length;
      const bMatches = b.tags.filter((tag) => tagIds.has(tag.id)).length;
      return bMatches - aMatches;
    })
    .slice(0, limit);
}

export const listPublishedTags = cache(async (): Promise<BlogTagWithCount[]> => {
  if (!hasSupabaseConfig()) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, slug, article_tags(article_id)")
    .order("name");

  if (error) throw blogError("Unable to load tags", error);

  return (data ?? [])
    .map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      articleCount: tag.article_tags?.length ?? 0,
    }))
    .filter((tag) => tag.articleCount > 0);
});

export async function getLatestPublishedArticles(limit = 3): Promise<BlogArticleCard[]> {
  return (await listPublishedArticles({ limit })).articles;
}

export async function getPublishedArticleIndex(): Promise<
  Array<Pick<BlogArticleCard, "slug" | "updatedAt" | "publishedAt">>
> {
  if (!hasSupabaseConfig()) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("articles")
    .select("slug, updated_at, published_at")
    .eq("status", "published")
    .is("deleted_at", null)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  if (error) throw blogError("Unable to load article index", error);

  return (data ?? []).map((article) => ({
    slug: article.slug,
    updatedAt: article.updated_at,
    publishedAt: article.published_at,
  }));
}
