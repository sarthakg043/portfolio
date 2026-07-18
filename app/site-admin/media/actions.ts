"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const bucketSchema = z.enum(["draft-media", "blog-media", "blog-downloads", "portfolio-assets"]);
const assetKindSchema = z.enum(["image", "download", "resume", "avatar", "other"]);

const registerSchema = z.object({
  kind: assetKindSchema,
  bucket: bucketSchema,
  objectPath: z.string().min(3).max(500),
  originalName: z.string().min(1).max(255),
  displayName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(150),
  byteSize: z.number().int().positive().max(50 * 1024 * 1024),
  altText: z.string().trim().max(500).nullable(),
});

export async function registerAssetAction(input: z.input<typeof registerSchema>) {
  try {
    const user = await requireAdmin();
    const parsed = registerSchema.parse(input);
    if (!parsed.objectPath.startsWith(`${user.id}/`)) throw new Error("Invalid storage object path.");
    if (parsed.bucket === "blog-media" && parsed.kind !== "image") throw new Error("Blog media accepts images only.");
    if (parsed.bucket === "blog-downloads" && parsed.kind !== "download") throw new Error("Blog downloads must use the download type.");

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("assets")
      .insert({
        owner_id: user.id,
        kind: parsed.kind,
        visibility: parsed.bucket === "draft-media" ? "private" : "public",
        storage_bucket: parsed.bucket,
        object_path: parsed.objectPath,
        original_name: parsed.originalName,
        display_name: parsed.displayName,
        mime_type: parsed.mimeType,
        byte_size: parsed.byteSize,
        alt_text: parsed.altText,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    revalidatePath("/site-admin/media");
    return { ok: true as const, id: data.id };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unable to register upload" };
  }
}

const updateSchema = z.object({ id: z.uuid(), displayName: z.string().trim().min(1).max(255), altText: z.string().trim().max(500).nullable() });

export async function updateAssetAction(formData: FormData) {
  await requireAdmin();
  const parsed = updateSchema.parse({ id: formData.get("id"), displayName: formData.get("displayName"), altText: formData.get("altText") || null });
  const supabase = await createClient();
  const { error } = await supabase.from("assets").update({ display_name: parsed.displayName, alt_text: parsed.altText }).eq("id", parsed.id);
  if (error) throw new Error(error.message);
  revalidatePath("/site-admin/media");
}

export async function deleteAssetAction(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { data: asset, error: readError } = await supabase.from("assets").select("id, storage_bucket, object_path").eq("id", id).single();
  if (readError) throw new Error(readError.message);

  const usageQueries = await Promise.all([
    supabase.from("article_assets").select("article_id", { count: "exact", head: true }).eq("asset_id", id),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("cover_asset_id", id),
    supabase.from("portfolio_profile").select("id", { count: "exact", head: true }).or(`avatar_asset_id.eq.${id},default_resume_asset_id.eq.${id}`),
    supabase.from("portfolio_domains").select("id", { count: "exact", head: true }).eq("resume_asset_id", id),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("image_asset_id", id),
  ]);
  if (usageQueries.some((result) => result.error)) throw new Error("Unable to verify asset usage.");
  if (usageQueries.some((result) => (result.count ?? 0) > 0)) throw new Error("This asset is in use. Remove it from its article or portfolio entry first.");

  const { error: storageError } = await supabase.storage.from(asset.storage_bucket).remove([asset.object_path]);
  if (storageError) throw new Error(storageError.message);
  const { error: metadataError } = await supabase.from("assets").delete().eq("id", id);
  if (metadataError) throw new Error(metadataError.message);
  revalidatePath("/site-admin/media");
}

