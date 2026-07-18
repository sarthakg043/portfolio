import type { Metadata } from "next";
import { BlogHeader } from "@/components/blog/blog-header";
import { getBlogBaseUrl, getBlogPath } from "@/lib/blog/url";
import { getPortfolioBaseUrl } from "@/lib/site-host";

export const metadata: Metadata = {
  metadataBase: new URL(getBlogBaseUrl()),
  title: {
    default: "Sarthak Gupta — Blog",
    template: "%s — Sarthak Gupta",
  },
  description:
    "Notes on frontend engineering, backend systems, cybersecurity, and building practical software.",
  alternates: { canonical: getBlogBaseUrl() },
  openGraph: {
    type: "website",
    siteName: "Sarthak Gupta — Blog",
    title: "Sarthak Gupta — Blog",
    description:
      "Notes on frontend engineering, backend systems, cybersecurity, and building practical software.",
    url: getBlogBaseUrl(),
  },
  twitter: { card: "summary_large_image" },
};

export default function BlogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="editorial-site min-h-screen bg-white text-neutral-950 transition-colors dark:bg-neutral-950 dark:text-neutral-50">
      <BlogHeader />
      {children}
      <footer className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 dark:text-neutral-400">
          <p>© {new Date().getFullYear()} Sarthak Gupta. Written with care.</p>
          <div className="flex gap-4">
            <a href={getBlogPath("/rss.xml")} className="hover:text-neutral-950 dark:hover:text-white">RSS</a>
            <a href={getPortfolioBaseUrl()} className="hover:text-neutral-950 dark:hover:text-white">Portfolio</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
