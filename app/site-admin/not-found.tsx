import Link from "next/link";
import { getAdminPath } from "@/lib/site-host";

export default function AdminNotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-5 text-neutral-950 dark:bg-neutral-950 dark:text-white"><section className="admin-panel w-full max-w-lg"><h1 className="text-2xl font-semibold">This page is unavailable</h1><p className="text-neutral-600 dark:text-neutral-400">The article or page may have been removed, or its address may be incorrect.</p><Link href={getAdminPath()} className="admin-primary-button w-fit">Back to dashboard</Link></section></main>;
}
