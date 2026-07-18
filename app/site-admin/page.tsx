import Link from "next/link";
import { FileText, FolderOpen, Settings2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getAdminPath } from "@/lib/site-host";

export const dynamic = "force-dynamic";

const cards = [
  {
    title: "Articles",
    description: "Create, edit, publish, archive, and restore blog articles.",
    href: "/articles",
    icon: FileText,
  },
  {
    title: "Media",
    description: "Manage article images, downloads, resumes, and site assets.",
    href: "/media",
    icon: FolderOpen,
  },
  {
    title: "Portfolio",
    description: "Manage projects, experience, skills, and profile content.",
    href: "/portfolio-content",
    icon: Settings2,
  },
];

export default async function AdminDashboardPage() {
  const user = await requireAdmin();

  return (
    <AdminShell email={user.email ?? "Administrator"}>
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Signed in as {user.email}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Good to see you.
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-neutral-600 dark:text-neutral-400">
          Manage articles, media, and every public portfolio section from this
          Supabase-backed dashboard.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {cards.map(({ title, description, href, icon: Icon }) => (
            <Link
              key={title}
              href={getAdminPath(href)}
              className="group rounded-3xl border border-neutral-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-neutral-400 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-600"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-8 text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                {description}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </AdminShell>
  );
}
