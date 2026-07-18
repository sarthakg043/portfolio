import { ExternalLink, File, ImageIcon, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { MediaUploader } from "@/components/admin/media-uploader";
import { deleteAssetAction, updateAssetAction } from "@/app/site-admin/media/actions";
import { assetPublicUrl, listAdminAssets } from "@/lib/admin/media";
import { requireAdmin } from "@/lib/auth";
import { formatArticleDate, formatBytes } from "@/lib/blog/format";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const user = await requireAdmin();
  const assets = await listAdminAssets();
  return (
    <AdminShell email={user.email ?? "Administrator"}>
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div><p className="admin-eyebrow">Storage library</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Media</h1><p className="mt-2 text-neutral-600 dark:text-neutral-400">Images, downloadable files, resumes, and private draft assets.</p></div>
        <div className="mt-8"><MediaUploader userId={user.id} /></div>
        {assets.length ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => {
              const publicUrl = assetPublicUrl(asset);
              return (
                <article key={asset.id} className="overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="flex aspect-[16/9] items-center justify-center bg-neutral-100 dark:bg-neutral-950">
                    {asset.kind === "image" && publicUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={publicUrl} alt={asset.alt_text ?? ""} className="size-full object-cover" />
                    ) : asset.kind === "image" ? (
                      <ImageIcon className="size-8 text-neutral-400" />
                    ) : (
                      <File className="size-8 text-neutral-400" />
                    )}
                  </div>
                  <form action={updateAssetAction} className="space-y-4 p-5">
                    <input type="hidden" name="id" value={asset.id} />
                    <label className="admin-field"><span>Display name</span><input name="displayName" defaultValue={asset.display_name} required /></label>
                    {asset.kind === "image" ? <label className="admin-field"><span>Alt text</span><textarea name="altText" defaultValue={asset.alt_text ?? ""} rows={2} /></label> : <input type="hidden" name="altText" value="" />}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500"><span>{asset.visibility}</span><span>·</span><span>{formatBytes(asset.byte_size)}</span><span>·</span><span>{formatArticleDate(asset.created_at)}</span></div>
                    <div className="flex items-center justify-between gap-2">
                      <button className="admin-secondary-button" type="submit">Save metadata</button>
                      <div className="flex gap-2">
                        {publicUrl ? <a href={publicUrl} target="_blank" rel="noreferrer" className="admin-icon-button" aria-label="Open public file"><ExternalLink className="size-4" /></a> : null}
                      </div>
                    </div>
                  </form>
                  <form action={deleteAssetAction} className="border-t border-neutral-200 p-4 dark:border-neutral-800">
                    <input type="hidden" name="id" value={asset.id} />
                    <button className="inline-flex items-center gap-2 text-xs font-semibold text-red-600"><Trash2 className="size-3.5" /> Delete if unused</button>
                  </form>
                </article>
              );
            })}
          </div>
        ) : <div className="mt-8 rounded-3xl border border-neutral-200 bg-white px-6 py-16 text-center dark:border-neutral-800 dark:bg-neutral-900"><p className="font-serif text-2xl">No media uploaded yet.</p></div>}
      </main>
    </AdminShell>
  );
}
