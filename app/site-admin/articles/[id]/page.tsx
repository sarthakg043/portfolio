import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, History } from "lucide-react";
import { z } from "zod";
import { AdminShell } from "@/components/admin/admin-shell";
import { ArticleEditor } from "@/components/admin/article-editor";
import { getAdminArticle, listArticleEditorOptions } from "@/lib/admin/articles";
import { requireAdmin } from "@/lib/auth";
import { getBlogArticleUrl } from "@/lib/blog/url";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const parsed = z.uuid().safeParse((await params).id);
  if (!parsed.success) notFound();
  const [article, { assets }] = await Promise.all([getAdminArticle(parsed.data), listArticleEditorOptions()]);
  if (!article || article.deleted_at) notFound();

  return (
    <AdminShell email={user.email ?? "Administrator"}>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/articles" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950 dark:hover:text-white"><ArrowLeft className="size-4" /> Articles</Link>
          <div className="flex items-center gap-4">
            <Link href={`/articles/${article.id}/revisions`} className="inline-flex items-center gap-2 text-sm font-medium"><History className="size-4" /> Revisions</Link>
            {article.status === "published" ? <a href={getBlogArticleUrl(article.slug)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium">View published <ExternalLink className="size-4" /></a> : null}
          </div>
        </div>
        <ArticleEditor article={article} assets={assets} />
      </main>
    </AdminShell>
  );
}
