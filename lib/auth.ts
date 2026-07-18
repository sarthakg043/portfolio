import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { hasAdminEmailConfig, isAdminEmail } from "@/lib/admin-config";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { getAdminPath } from "@/lib/site-host";
import { createClient } from "@/lib/supabase/server";

export const getAdminUser = cache(async (): Promise<User | null> => {
  if (!hasSupabaseConfig() || !hasAdminEmailConfig()) return null;

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !isAdminEmail(user.email)) {
    return null;
  }

  return user;
});

export async function requireAdmin(): Promise<User> {
  const user = await getAdminUser();
  if (!user) redirect(getAdminPath("/login"));
  return user;
}
