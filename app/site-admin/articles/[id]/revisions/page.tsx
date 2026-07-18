import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { z } from "zod";
import { AdminShell } from "@/components/admin/admin-shell";
import { restoreArticleRevisionAction } from "@/app/site-admin/articles/actions";
import { getAdminArticle, listArticleRevisions } from "@/lib/admin/articles";
import { requireAdmin } from "@/lib/auth";
import { formatArticleDate } from "@/lib/blog/format";
import { getAdminPath } from "@/lib/site-host";

export const dynamic = "force-dynamic";

export default async function RevisionsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const parsed = z.uuid().safeParse((await params).id);
  if (!parsed.success) notFound();
  const [article, revisions] = await Promise.all([getAdminArticle(parsed.data), listArticleRevisions(parsed.data)]);
  if (!article) notFound();

  return (
    <AdminShell email={user.email ?? "Administrator"}>
      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <Link href={getAdminPath(`/articles/${article.id}`)} className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950 dark:hover:text-white"><ArrowLeft className="size-4" /> Back to editor</Link>
        <p className="admin-eyebrow mt-10">Recovery</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Revision history</h1><p className="mt-2 text-neutral-600 dark:text-neutral-400">{article.title}</p>
        <div className="mt-8 overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          {revisions.length ? revisions.map((revision) => (
            <article key={revision.id} className="flex items-center gap-5 border-b border-neutral-200 p-5 last:border-0 dark:border-neutral-800">
              <div className="min-w-0 flex-1"><p className="font-semibold">{revision.title}</p><p className="mt-1 text-sm text-neutral-500">{revision.revision_reason} · {formatArticleDate(revision.created_at)} · {revision.content_text.trim() ? revision.content_text.trim().split(/\s+/).length : 0} words</p></div>
              <form action={restoreArticleRevisionAction}><input type="hidden" name="articleId" value={article.id} /><input type="hidden" name="revisionId" value={revision.id} /><button className="admin-secondary-button"><RotateCcw className="size-4" /> Restore</button></form>
            </article>
          )) : <p className="p-8 text-center text-neutral-500">No saved revisions yet.</p>}
        </div>
      </main>
    </AdminShell>
  );
}
