import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { GitHubLoginButton } from "@/components/admin/github-login-button";
import { ThemeToggle } from "@/components/blog/theme-toggle";
import { hasAdminEmailConfig } from "@/lib/admin-config";
import { getAdminUser } from "@/lib/auth";
import { getAdminPath, getAdminUrl } from "@/lib/site-host";
import { hasSupabaseConfig } from "@/lib/supabase/config";

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized:
    "This GitHub account is not authorized. Its verified email must match the sole administrator email.",
  oauth: "GitHub authentication could not be completed. Please try again.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getAdminUser()) redirect(getAdminPath());

  const configured = hasSupabaseConfig() && hasAdminEmailConfig();
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-neutral-50 px-5 py-8 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
      <div className="mx-auto flex max-w-5xl justify-end">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-md items-center">
        <section className="w-full rounded-3xl border border-neutral-200 bg-white p-7 shadow-sm sm:p-9 dark:border-neutral-800 dark:bg-neutral-900">
          <span className="mb-7 inline-flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <ShieldCheck className="size-5" />
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">Author access</h1>
          <p className="mt-3 leading-7 text-neutral-600 dark:text-neutral-400">
            Sign in with the GitHub account configured as the sole
            administrator. Every other account is rejected.
          </p>

          {!configured ? (
            <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Server configuration is incomplete. Copy <code>.env.example</code>{" "}
              to <code>.env.local</code> and add the Supabase project values and{" "}
              <code>ADMIN_EMAIL</code>.
            </div>
          ) : null}

          {error && ERROR_MESSAGES[error] ? (
            <p
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300"
              role="alert"
            >
              {ERROR_MESSAGES[error]}
            </p>
          ) : null}

          <div className="mt-7">
            <GitHubLoginButton
              configured={configured}
              callbackUrl={getAdminUrl("/auth/callback")}
            />
          </div>
          <p className="mt-5 text-xs leading-5 text-neutral-500">
            Authentication is provided by Supabase using GitHub OAuth. No
            GitHub access token is stored by this application.
          </p>
        </section>
      </div>
    </main>
  );
}
