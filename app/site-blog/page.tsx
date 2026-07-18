import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/blog/theme-toggle";

export default function BlogHomePage() {
  return (
    <div className="min-h-screen bg-white text-neutral-950 transition-colors dark:bg-neutral-950 dark:text-neutral-50">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="font-serif text-2xl font-semibold tracking-tight">
            Sarthak.
          </Link>
          <div className="flex items-center gap-4">
            <a
              href={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}
              className="text-sm text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
            >
              Portfolio
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
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

        <section className="border-y border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
            <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-8 sm:p-12 dark:border-neutral-700 dark:bg-neutral-950">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                Blog foundation is ready
              </p>
              <h2 className="mt-3 max-w-2xl font-serif text-3xl tracking-tight sm:text-4xl">
                Published articles will appear here after the database migration
                is connected.
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-neutral-600 dark:text-neutral-400">
                The feed, search, tags, article renderer, metadata, and RSS are
                implemented in the next public-blog phase after the secured
                Supabase schema is applied.
              </p>
              <a
                href={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}
                className="mt-7 inline-flex items-center gap-2 text-sm font-semibold hover:underline"
              >
                Explore the portfolio <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
