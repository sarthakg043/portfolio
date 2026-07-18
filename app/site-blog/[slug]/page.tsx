import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3, Download } from "lucide-react";
import { ArticleCard } from "@/components/blog/article-card";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { ShareActions } from "@/components/blog/share-actions";
import { formatArticleDate, formatBytes } from "@/lib/blog/format";
import { getPublishedArticle, getRelatedArticles } from "@/lib/blog/queries";
import { renderTiptapDocument } from "@/lib/blog/tiptap-renderer";
import { getBlogArticleUrl, getBlogPath } from "@/lib/blog/url";
import { getPortfolioBaseUrl } from "@/lib/site-host";

type ArticlePageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) return { title: "Article not found" };

  const url = article.canonicalUrl ?? getBlogArticleUrl(article.slug);
  const description = article.seoDescription ?? article.excerpt ?? article.subtitle ?? undefined;
  const images = article.cover?.publicUrl ? [{ url: article.cover.publicUrl, alt: article.cover.altText ?? article.title }] : undefined;

  return {
    title: article.seoTitle ?? article.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: article.seoTitle ?? article.title,
      description,
      url,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      tags: article.tags.map((tag) => tag.name),
      images,
    },
    twitter: { card: "summary_large_image", title: article.seoTitle ?? article.title, description, images: images?.map((image) => image.url) },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) notFound();

  const [{ content, tableOfContents }, related] = await Promise.all([
    Promise.resolve(renderTiptapDocument(article.content)),
    getRelatedArticles(article),
  ]);
  const articleUrl = article.canonicalUrl ?? getBlogArticleUrl(article.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt ?? article.subtitle,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: articleUrl,
    author: { "@type": "Person", name: "Sarthak Gupta", url: getPortfolioBaseUrl() },
    image: article.cover?.publicUrl,
    keywords: article.tags.map((tag) => tag.name).join(", "),
  };

  return (
    <main>
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <article>
        <header className="mx-auto max-w-4xl px-5 pb-10 pt-12 text-center sm:px-8 sm:pb-14 sm:pt-20">
          <Link href={getBlogPath()} className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white">
            <ArrowLeft className="size-4" /> All stories
          </Link>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {article.tags.map((tag) => (
              <Link key={tag.id} href={getBlogPath(`/?tag=${encodeURIComponent(tag.slug)}`)} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                {tag.name}
              </Link>
            ))}
          </div>
          <h1 className="mt-6 font-serif text-5xl font-medium leading-[1.02] tracking-[-0.04em] sm:text-7xl">
            {article.title}
          </h1>
          {article.subtitle ? <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-neutral-600 dark:text-neutral-400">{article.subtitle}</p> : null}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-neutral-500 dark:text-neutral-400">
            <span className="font-medium text-neutral-800 dark:text-neutral-200">Sarthak Gupta</span>
            <span aria-hidden="true">·</span>
            <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4" /> {article.readingTimeMinutes} min read</span>
          </div>
        </header>

        {article.cover?.publicUrl ? (
          <figure className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="aspect-[16/9] overflow-hidden rounded-[2rem] bg-neutral-100 dark:bg-neutral-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.cover.publicUrl} alt={article.cover.altText ?? article.title} className="size-full object-cover" />
            </div>
          </figure>
        ) : null}

        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-16">
          <div>
            <div className="blog-prose">{content}</div>

            {article.attachments.length ? (
              <section className="mt-14 border-t border-neutral-200 pt-8 dark:border-neutral-800" aria-labelledby="downloads-heading">
                <h2 id="downloads-heading" className="font-serif text-2xl">Downloads</h2>
                <div className="mt-5 grid gap-3">
                  {article.attachments.map((asset) => (
                    <a key={asset.id} href={asset.publicUrl} download className="flex items-center gap-4 rounded-2xl border border-neutral-200 p-4 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900">
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800"><Download className="size-4" /></span>
                      <span className="min-w-0"><strong className="block truncate text-sm">{asset.displayName}</strong><small className="text-neutral-500 dark:text-neutral-400">{asset.mimeType} · {formatBytes(asset.byteSize)}</small></span>
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="mt-14 flex items-center justify-between border-y border-neutral-200 py-6 dark:border-neutral-800">
              <p className="text-sm font-medium">Share this story</p>
              <ShareActions title={article.title} url={articleUrl} />
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              {tableOfContents.length ? (
                <nav aria-label="Table of contents">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">On this page</p>
                  <ol className="mt-4 space-y-3 border-l border-neutral-200 pl-4 text-sm dark:border-neutral-800">
                    {tableOfContents.map((item) => (
                      <li key={item.id} className={item.level > 2 ? "pl-3" : ""}>
                        <a href={`#${item.id}`} className="text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white">{item.title}</a>
                      </li>
                    ))}
                  </ol>
                </nav>
              ) : null}
            </div>
          </aside>
        </div>
      </article>

      {related.length ? (
        <section className="border-t border-neutral-200 bg-neutral-50/70 dark:border-neutral-800 dark:bg-neutral-900/30">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">Keep reading</p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl">Related stories</h2>
            <div className="mt-8 grid gap-10 md:grid-cols-3">
              {related.map((item) => <ArticleCard key={item.id} article={item} />)}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
