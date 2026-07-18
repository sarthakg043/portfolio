import "server-only";

import { createClient } from "@/lib/supabase/server";

export type AdminAsset = {
  id: string;
  owner_id: string;
  kind: "image" | "download" | "resume" | "avatar" | "other";
  visibility: "private" | "public";
  storage_bucket: string;
  object_path: string;
  original_name: string;
  display_name: string;
  mime_type: string;
  byte_size: number;
  alt_text: string | null;
  created_at: string;
};

export async function listAdminAssets(): Promise<AdminAsset[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("assets").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load media: ${error.message}`);
  return (data ?? []) as AdminAsset[];
}

export function assetPublicUrl(asset: Pick<AdminAsset, "storage_bucket" | "object_path" | "visibility">): string | null {
  if (asset.visibility !== "public" || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const path = asset.object_path.split("/").map(encodeURIComponent).join("/");
  return new URL(`/storage/v1/object/public/${encodeURIComponent(asset.storage_bucket)}/${path}`, process.env.NEXT_PUBLIC_SUPABASE_URL).toString();
}

