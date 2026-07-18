import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import { ArticleCard } from "@/components/blog/article-card";
import { listPublishedArticles, listPublishedTags } from "@/lib/blog/queries";
import { getBlogPath } from "@/lib/blog/url";
import { getPortfolioBaseUrl } from "@/lib/site-host";

type BlogSearchParams = {
  q?: string | string[];
  tag?: string | string[];
  cursor?: string | string[];
};

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export const dynamic = "force-dynamic";

export default async function BlogHomePage({
  searchParams,
}: {
  searchParams: Promise<BlogSearchParams>;
}) {
  const params = await searchParams;
  const search = firstParam(params.q).slice(0, 160);
  const tag = firstParam(params.tag).slice(0, 80);
  const cursor = firstParam(params.cursor).slice(0, 500);
  const filtered = Boolean(search || tag || cursor);
  const [{ articles, nextCursor }, tags] = await Promise.all([
    listPublishedArticles({ search, tag, cursor }),
    listPublishedTags(),
  ]);

  const featured = !filtered
    ? articles.find((article) => article.featured) ?? articles[0]
    : null;
  const remaining = featured
    ? articles.filter((article) => article.id !== featured.id)
    : articles;

  const nextParams = new URLSearchParams();
  if (search) nextParams.set("q", search);
  if (tag) nextParams.set("tag", tag);
  if (nextCursor) nextParams.set("cursor", nextCursor);

  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-400">
            Engineering notes
          </p>
          <h1 className="max-w-4xl font-serif text-5xl font-medium leading-[0.98] tracking-[-0.04em] sm:text-7xl">
            Ideas are better when they are written down.
          </h1>
        </div>
        <p className="max-w-md text-base leading-7 text-neutral-600 dark:text-neutral-400">
          Long-form writing about frontend craft, scalable systems,
          cybersecurity, and the lessons hidden inside real projects.
        </p>
      </section>

      <section className="border-y border-neutral-200 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/35">
        <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8">
          <form action={getBlogPath()} className="flex flex-col gap-3 sm:flex-row" role="search">
            <label className="relative flex-1">
              <span className="sr-only">Search articles</span>
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Search stories, ideas, or technologies…"
                className="h-12 w-full rounded-full border border-neutral-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-neutral-500 focus:ring-4 focus:ring-neutral-200/60 dark:border-neutral-700 dark:bg-neutral-950 dark:focus:border-neutral-500 dark:focus:ring-neutral-800"
              />
            </label>
            {tag ? <input type="hidden" name="tag" value={tag} /> : null}
            <button className="h-12 rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200">
              Search
            </button>
          </form>

          {tags.length ? (
            <nav className="mt-5 flex flex-wrap gap-2" aria-label="Article topics">
              <Link href={getBlogPath(search ? `/?q=${encodeURIComponent(search)}` : "/")} className={`blog-filter-pill ${!tag ? "blog-filter-pill-active" : ""}`}>
                All
              </Link>
              {tags.map((item) => {
                const href = new URLSearchParams();
                if (search) href.set("q", search);
                href.set("tag", item.slug);
                return (
                  <Link key={item.id} href={getBlogPath(`/?${href}`)} className={`blog-filter-pill ${tag === item.slug ? "blog-filter-pill-active" : ""}`}>
                    {item.name} <span>{item.articleCount}</span>
                  </Link>
                );
              })}
              {(search || tag) ? (
                <Link href={getBlogPath()} className="blog-filter-pill ml-auto">
                  <X className="size-3.5" /> Clear
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        {featured ? (
          <div className="border-b border-neutral-200 pb-14 dark:border-neutral-800">
            <p className="mb-7 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Featured story</p>
            <ArticleCard article={featured} featured />
          </div>
        ) : null}

        {remaining.length ? (
          <div className={featured ? "pt-14" : ""}>
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
                  {filtered ? "Filtered stories" : "Latest writing"}
                </p>
                <h2 className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl">
                  {search ? `Results for “${search}”` : tag ? `Topic: ${tags.find((item) => item.slug === tag)?.name ?? tag}` : "Fresh from the notebook"}
                </h2>
              </div>
            </div>
            <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {remaining.map((article) => <ArticleCard key={article.id} article={article} />)}
            </div>
          </div>
        ) : null}

        {!articles.length ? (
          <div className="rounded-[2rem] border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center dark:border-neutral-700 dark:bg-neutral-900/40">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {filtered ? "No matching stories" : "The notebook is open"}
            </p>
            <h2 className="mx-auto mt-3 max-w-xl font-serif text-3xl tracking-tight sm:text-4xl">
              {filtered ? "Try another search or clear the current filters." : "The first original story is being prepared."}
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-7 text-neutral-600 dark:text-neutral-400">
              {filtered
                ? "Search checks article titles, excerpts, and the complete published document."
                : "Published articles will appear here automatically from the private author dashboard."}
            </p>
            {filtered ? (
              <Link href={getBlogPath()} className="mt-7 inline-flex items-center gap-2 text-sm font-semibold hover:underline">
                View all stories <ArrowRight className="size-4" />
              </Link>
            ) : (
              <a href={getPortfolioBaseUrl()} className="mt-7 inline-flex items-center gap-2 text-sm font-semibold hover:underline">
                Explore the portfolio <ArrowRight className="size-4" />
              </a>
            )}
          </div>
        ) : null}

        {nextCursor ? (
          <div className="mt-14 flex justify-center">
            <Link href={getBlogPath(`/?${nextParams}`)} className="inline-flex h-11 items-center rounded-full border border-neutral-300 px-6 text-sm font-semibold hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900">
              More stories <ArrowRight className="ml-2 size-4" />
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
