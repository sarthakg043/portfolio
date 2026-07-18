import Link from "next/link";
import { FileText, FolderOpen, LayoutDashboard, LogOut, Settings2 } from "lucide-react";
import { ThemeToggle } from "@/components/blog/theme-toggle";
import { signOutAction } from "@/app/site-admin/actions";

const navigation = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/articles", label: "Articles", icon: FileText },
  { href: "/media", label: "Media", icon: FolderOpen },
  { href: "/portfolio-content", label: "Portfolio", icon: Settings2 },
];

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" className="shrink-0">
            <p className="text-sm font-semibold">Spyboy CMS</p>
            <p className="hidden text-xs text-neutral-500 sm:block">{email}</p>
          </Link>
          <nav className="scrollbar-hidden flex items-center gap-1 overflow-x-auto" aria-label="Admin navigation">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white">
                <Icon className="size-4" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <form action={signOutAction}>
              <button type="submit" className="inline-flex size-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-900" aria-label="Sign out">
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

