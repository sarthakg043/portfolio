"use server";

import { redirect } from "next/navigation";
import { getAdminPath } from "@/lib/site-host";
import { createClient } from "@/lib/supabase/server";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect(getAdminPath("/login"));
}
