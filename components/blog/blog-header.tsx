import Link from "next/link";
import { ThemeToggle } from "@/components/blog/theme-toggle";

export function BlogHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/90 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="font-serif text-2xl font-semibold tracking-tight" aria-label="Sarthak Gupta blog home">
          Sarthak<span className="text-emerald-600">.</span>
        </Link>
        <nav className="flex items-center gap-4" aria-label="Blog navigation">
          <a
            href={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}
            className="text-sm text-neutral-600 transition hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
          >
            Portfolio
          </a>
          <a
            href="/rss.xml"
            className="hidden text-sm text-neutral-600 transition hover:text-neutral-950 sm:inline dark:text-neutral-400 dark:hover:text-white"
          >
            RSS
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

