import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { formatArticleDate } from "@/lib/blog/format";
import { getBlogPath } from "@/lib/blog/url";
import type { BlogArticleCard as BlogArticleCardType } from "@/lib/blog/types";

export function ArticleCard({
  article,
  featured = false,
}: {
  article: BlogArticleCardType;
  featured?: boolean;
}) {
  const articleHref = article.externalUrl ?? getBlogPath(`/${article.slug}`);
  const external = Boolean(article.externalUrl);

  return (
    <article className={featured ? "grid gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-center" : "group"}>
      {article.cover?.publicUrl ? (
        <Link
          href={articleHref}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer noopener" : undefined}
          className={`block overflow-hidden bg-neutral-100 dark:bg-neutral-900 ${featured ? "aspect-[16/10] rounded-[2rem]" : "aspect-[16/9] rounded-2xl"}`}
          tabIndex={-1}
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.cover.publicUrl}
            alt={article.cover.altText ?? ""}
            className="size-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        </Link>
      ) : null}

      <div className={article.cover?.publicUrl && !featured ? "pt-5" : ""}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
          <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5" /> {article.readingTimeMinutes} min read
          </span>
        </div>

        <h2 className={`font-serif font-medium tracking-[-0.025em] ${featured ? "mt-5 text-4xl leading-tight sm:text-5xl" : "mt-3 text-2xl leading-tight"}`}>
          <Link href={articleHref} target={external ? "_blank" : undefined} rel={external ? "noreferrer noopener" : undefined} className="decoration-emerald-500/50 underline-offset-4 hover:underline">
            {article.title}
          </Link>
        </h2>

        {article.subtitle || article.excerpt ? (
          <p className={`text-neutral-600 dark:text-neutral-400 ${featured ? "mt-5 text-lg leading-8" : "mt-3 line-clamp-3 leading-7"}`}>
            {article.subtitle ?? article.excerpt}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {article.tags.map((tag) => (
            <Link
              key={tag.id}
              href={getBlogPath(`/?tag=${encodeURIComponent(tag.slug)}`)}
              className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {tag.name}
            </Link>
          ))}
          <Link
            href={articleHref}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer noopener" : undefined}
            className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
          >
            Read <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
