"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { articleEditorSchema, slugifyArticleTitle, type ArticleEditorInput } from "@/lib/admin/article-schema";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ArticleActionResult = { ok: true; id: string } | { ok: false; error: string };

function nullable(value: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function readingTime(text: string): number {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 220));
}

async function syncTags(articleId: string, names: string[], userId: string) {
  const supabase = await createClient();
  const normalized = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  const tags = [];

  for (const name of normalized) {
    const slug = slugifyArticleTitle(name);
    if (!slug) continue;
    const { data: existing, error: readError } = await supabase
      .from("tags")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (readError) throw new Error(readError.message);

    if (existing) {
      tags.push(existing.id);
      continue;
    }

    const { data: created, error: createError } = await supabase
      .from("tags")
      .insert({ owner_id: userId, name, slug })
      .select("id")
      .single();
    if (createError) throw new Error(createError.message);
    tags.push(created.id);
  }

  const { error: deleteError } = await supabase.from("article_tags").delete().eq("article_id", articleId);
  if (deleteError) throw new Error(deleteError.message);
  if (tags.length) {
    const { error: insertError } = await supabase
      .from("article_tags")
      .insert(tags.map((tagId) => ({ article_id: articleId, tag_id: tagId })));
    if (insertError) throw new Error(insertError.message);
  }
}

function revalidateArticle(slug?: string) {
  revalidatePath("/site-admin/articles");
  revalidatePath("/site-blog");
  revalidatePath("/site-blog/sitemap.xml");
  revalidatePath("/site-blog/rss.xml");
  if (slug) revalidatePath(`/site-blog/${slug}`);
}

export async function saveArticleAction(input: ArticleEditorInput): Promise<ArticleActionResult> {
  try {
    const user = await requireAdmin();
    const parsed = articleEditorSchema.parse({
      ...input,
      subtitle: nullable(input.subtitle),
      excerpt: nullable(input.excerpt),
      seoTitle: nullable(input.seoTitle),
      seoDescription: nullable(input.seoDescription),
      canonicalUrl: input.canonicalUrl ?? "",
      externalUrl: input.externalUrl ?? "",
    });
    const supabase = await createClient();
    const now = new Date().toISOString();
    const payload = {
      author_id: user.id,
      title: parsed.title,
      slug: parsed.slug,
      subtitle: parsed.subtitle,
      excerpt: parsed.excerpt,
      content: parsed.content,
      content_text: parsed.contentText,
      cover_asset_id: parsed.coverAssetId,
      status: parsed.intent === "publish" ? "published" : "draft",
      featured: parsed.featured,
      seo_title: parsed.seoTitle,
      seo_description: parsed.seoDescription,
      canonical_url: parsed.canonicalUrl,
      external_url: parsed.externalUrl,
      reading_time_minutes: readingTime(parsed.contentText),
      published_at: parsed.intent === "publish" ? now : null,
      scheduled_at: null,
      deleted_at: null,
    };

    let articleId = parsed.id;
    if (articleId) {
      const { error } = await supabase.from("articles").update(payload).eq("id", articleId);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await supabase.from("articles").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      articleId = data.id;
    }

    if (!articleId) throw new Error("Article ID was not returned after saving.");
    await syncTags(articleId, parsed.tags, user.id);
    const { error: revisionError } = await supabase.from("article_revisions").insert({
      article_id: articleId,
      editor_id: user.id,
      title: parsed.title,
      content: parsed.content,
      content_text: parsed.contentText,
      revision_reason: parsed.intent === "publish" ? "publish" : "manual",
    });
    if (revisionError) throw new Error(revisionError.message);

    revalidateArticle(parsed.slug);
    return { ok: true, id: articleId };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to save article" };
  }
}

const lifecycleSchema = z.object({
  id: z.uuid(),
  intent: z.enum(["publish", "unpublish", "archive", "trash", "restore", "duplicate", "delete"]),
});

export async function articleLifecycleAction(formData: FormData) {
  const user = await requireAdmin();
  const parsed = lifecycleSchema.parse({ id: formData.get("id"), intent: formData.get("intent") });
  const supabase = await createClient();
  const { data: article, error: readError } = await supabase.from("articles").select("*").eq("id", parsed.id).single();
  if (readError) throw new Error(readError.message);

  if (parsed.intent === "duplicate") {
    const suffix = crypto.randomUUID().slice(0, 8);
    const { data: duplicate, error } = await supabase
      .from("articles")
      .insert({
        author_id: user.id,
        title: `${article.title} (copy)`,
        slug: `${article.slug}-copy-${suffix}`,
        subtitle: article.subtitle,
        excerpt: article.excerpt,
        content: article.content,
        content_text: article.content_text,
        cover_asset_id: article.cover_asset_id,
        status: "draft",
        featured: false,
        seo_title: article.seo_title,
        seo_description: article.seo_description,
        canonical_url: null,
        external_url: article.external_url,
        reading_time_minutes: article.reading_time_minutes,
        published_at: null,
        scheduled_at: null,
        deleted_at: null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const { data: links } = await supabase.from("article_tags").select("tag_id").eq("article_id", article.id);
    if (links?.length) await supabase.from("article_tags").insert(links.map((link) => ({ article_id: duplicate.id, tag_id: link.tag_id })));
    revalidateArticle();
    return;
  }

  if (parsed.intent === "delete") {
    if (!article.deleted_at) throw new Error("Move the article to trash before deleting it permanently.");
    const { error } = await supabase.from("articles").delete().eq("id", article.id);
    if (error) throw new Error(error.message);
    revalidateArticle(article.slug);
    return;
  }

  const updates = {
    publish: { status: "published", published_at: article.published_at ?? new Date().toISOString(), deleted_at: null },
    unpublish: { status: "draft", published_at: null },
    archive: { status: "archived" },
    trash: { status: "archived", deleted_at: new Date().toISOString() },
    restore: { status: "draft", deleted_at: null },
  }[parsed.intent];

  const { error } = await supabase.from("articles").update(updates).eq("id", article.id);
  if (error) throw new Error(error.message);
  revalidateArticle(article.slug);
}
