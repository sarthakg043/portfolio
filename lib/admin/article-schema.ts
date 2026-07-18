import { z } from "zod";
import type { TiptapNode } from "@/lib/blog/types";

const optionalUrl = z.union([z.literal(""), z.url().startsWith("https://")]).transform((value) => value || null);

export const articleEditorSchema = z.object({
  id: z.uuid().nullable(),
  title: z.string().trim().min(1, "Add a title").max(180),
  slug: z.string().trim().max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens"),
  subtitle: z.string().trim().max(260).nullable(),
  excerpt: z.string().trim().max(500).nullable(),
  content: z.custom<TiptapNode>((value) => Boolean(value && typeof value === "object" && (value as TiptapNode).type === "doc"), "Invalid article document"),
  contentText: z.string().max(500_000),
  coverAssetId: z.uuid().nullable(),
  featured: z.boolean(),
  seoTitle: z.string().trim().max(180).nullable(),
  seoDescription: z.string().trim().max(320).nullable(),
  canonicalUrl: optionalUrl,
  externalUrl: optionalUrl,
  tags: z.array(z.string().trim().min(1).max(50)).max(12),
  intent: z.enum(["draft", "publish", "autosave"]),
});

export type ArticleEditorInput = z.input<typeof articleEditorSchema>;

export function slugifyArticleTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);
}
