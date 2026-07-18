import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { TiptapNode } from "@/lib/blog/types";

export type AdminArticleListItem = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "scheduled" | "published" | "archived";
  featured: boolean;
  reading_time_minutes: number;
  published_at: string | null;
  updated_at: string;
  deleted_at: string | null;
};

export type AdminArticle = AdminArticleListItem & {
  subtitle: string | null;
  excerpt: string | null;
  content: TiptapNode;
  content_text: string;
  cover_asset_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  external_url: string | null;
  article_tags: Array<{ tags: { id: string; name: string; slug: string } | null }>;
};

export async function listAdminArticles(): Promise<AdminArticleListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("id, title, slug, status, featured, reading_time_minutes, published_at, updated_at, deleted_at")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Unable to load articles: ${error.message}`);
  return (data ?? []) as AdminArticleListItem[];
}

export async function getAdminArticle(id: string): Promise<AdminArticle | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(`
      id, title, slug, subtitle, excerpt, content, content_text, cover_asset_id,
      status, featured, seo_title, seo_description, canonical_url, external_url,
      reading_time_minutes, published_at, updated_at, deleted_at,
      article_tags(tags(id, name, slug))
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Unable to load article: ${error.message}`);
  return data as unknown as AdminArticle | null;
}

export async function listArticleEditorOptions() {
  const supabase = await createClient();
  const [{ data: tags, error: tagsError }, { data: assets, error: assetsError }] = await Promise.all([
    supabase.from("tags").select("id, name, slug").order("name"),
    supabase
      .from("assets")
      .select("id, display_name, storage_bucket, object_path, alt_text, visibility")
      .eq("kind", "image")
      .order("created_at", { ascending: false }),
  ]);

  if (tagsError) throw new Error(`Unable to load tags: ${tagsError.message}`);
  if (assetsError) throw new Error(`Unable to load media: ${assetsError.message}`);
  return { tags: tags ?? [], assets: assets ?? [] };
}

