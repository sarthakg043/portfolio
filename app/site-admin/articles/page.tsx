import Link from "next/link";
import { Copy, Edit3, FilePlus2, RotateCcw, Send, Trash2, Undo2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { articleLifecycleAction } from "@/app/site-admin/articles/actions";
import { listAdminArticles } from "@/lib/admin/articles";
import { requireAdmin } from "@/lib/auth";
import { formatArticleDate } from "@/lib/blog/format";

const filters = ["all", "draft", "published", "archived", "trash"] as const;

export const dynamic = "force-dynamic";

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireAdmin();
  const requested = (await searchParams).status;
  const active = filters.includes(requested as (typeof filters)[number]) ? requested as (typeof filters)[number] : "all";
  const articles = await listAdminArticles();
  const visible = articles.filter((article) => {
    if (active === "trash") return Boolean(article.deleted_at);
    if (article.deleted_at) return false;
    if (active === "all") return true;
    return article.status === active;
  });

  return (
    <AdminShell email={user.email ?? "Administrator"}>
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="admin-eyebrow">Editorial workspace</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Articles</h1><p className="mt-2 text-neutral-600 dark:text-neutral-400">Draft, publish, archive, restore, and revise every story.</p></div>
          <Link href="/articles/new" className="admin-primary-button w-fit"><FilePlus2 className="size-4" /> New story</Link>
        </div>

        <nav className="scrollbar-hidden mt-8 flex gap-2 overflow-x-auto" aria-label="Article status filters">
          {filters.map((filter) => (
            <Link key={filter} href={filter === "all" ? "/articles" : `/articles?status=${filter}`} className={`blog-filter-pill capitalize ${active === filter ? "blog-filter-pill-active" : ""}`}>
              {filter}
            </Link>
          ))}
        </nav>

        <div className="mt-8 overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          {visible.length ? visible.map((article) => (
            <article key={article.id} className="flex flex-col gap-5 border-b border-neutral-200 p-5 last:border-0 sm:flex-row sm:items-center dark:border-neutral-800">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500"><span>{article.deleted_at ? "Trash" : article.status}</span>{article.featured ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Featured</span> : null}</div>
                <h2 className="mt-2 truncate text-lg font-semibold">{article.title}</h2>
                <p className="mt-1 text-sm text-neutral-500">Updated {formatArticleDate(article.updated_at)} · {article.reading_time_minutes} min</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!article.deleted_at ? <Link href={`/articles/${article.id}`} className="admin-secondary-button"><Edit3 className="size-4" /> Edit</Link> : null}
                <form action={articleLifecycleAction}><input type="hidden" name="id" value={article.id} /><button name="intent" value="duplicate" className="admin-icon-button" title="Duplicate"><Copy className="size-4" /></button></form>
                {article.deleted_at ? (
                  <><form action={articleLifecycleAction}><input type="hidden" name="id" value={article.id} /><button name="intent" value="restore" className="admin-icon-button" title="Restore"><RotateCcw className="size-4" /></button></form><form action={articleLifecycleAction}><input type="hidden" name="id" value={article.id} /><button name="intent" value="delete" className="admin-icon-button text-red-600" title="Delete permanently"><Trash2 className="size-4" /></button></form></>
                ) : (
                  <><form action={articleLifecycleAction}><input type="hidden" name="id" value={article.id} /><button name="intent" value={article.status === "published" ? "unpublish" : "publish"} className="admin-icon-button" title={article.status === "published" ? "Unpublish" : "Publish"}>{article.status === "published" ? <Undo2 className="size-4" /> : <Send className="size-4" />}</button></form><form action={articleLifecycleAction}><input type="hidden" name="id" value={article.id} /><button name="intent" value="trash" className="admin-icon-button text-red-600" title="Move to trash"><Trash2 className="size-4" /></button></form></>
                )}
              </div>
            </article>
          )) : <div className="px-6 py-16 text-center"><p className="font-serif text-2xl">No {active === "all" ? "articles" : active + " articles"} yet.</p><Link href="/articles/new" className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400">Write the first story</Link></div>}
        </div>
      </main>
    </AdminShell>
  );
}

