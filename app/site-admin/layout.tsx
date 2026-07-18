import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Spyboy",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="admin-site min-h-screen">{children}</div>;
}
