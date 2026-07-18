import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ArticleEditor } from "@/components/admin/article-editor";
import { listArticleEditorOptions } from "@/lib/admin/articles";
import { requireAdmin } from "@/lib/auth";
import { getAdminPath, getSitePathPrefix } from "@/lib/site-host";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const user = await requireAdmin();
  const { assets } = await listArticleEditorOptions();
  return (
    <AdminShell email={user.email ?? "Administrator"}>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <Link href={getAdminPath("/articles")} className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950 dark:hover:text-white"><ArrowLeft className="size-4" /> Articles</Link>
        <ArticleEditor article={null} assets={assets} adminPathPrefix={getSitePathPrefix("admin")} />
      </main>
    </AdminShell>
  );
}
