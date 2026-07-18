import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BLOG_URL ?? "http://blog.localhost:3000"
  ),
  title: {
    default: "Sarthak Gupta — Blog",
    template: "%s — Sarthak Gupta",
  },
  description:
    "Notes on frontend engineering, backend systems, cybersecurity, and building practical software.",
};

export default function BlogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="editorial-site min-h-screen">{children}</div>;
}
