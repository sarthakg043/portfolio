"use client";

import { useState } from "react";
import { GithubIcon } from "@/components/icons/brands";
import { createClient } from "@/lib/supabase/client";
import { getAdminBaseUrl } from "@/lib/site-host";

export function GitHubLoginButton({ configured }: { configured: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    if (!configured || pending) return;

    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: getAdminBaseUrl() + "/auth/callback",
          scopes: "read:user user:email",
        },
      });

      if (signInError) throw signInError;
    } catch (signInError) {
      setPending(false);
      setError(
        signInError instanceof Error
          ? signInError.message
          : "GitHub sign-in could not be started."
      );
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={!configured || pending}
        onClick={signIn}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
      >
        <GithubIcon className="size-4" />
        {pending ? "Opening GitHub…" : "Continue with GitHub"}
      </button>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
