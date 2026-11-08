"use server";

import { redirect } from "next/navigation";
import { getAdminPath } from "@/lib/site-host";
import { createClient } from "@/lib/supabase/server";
import { runAdminAction } from "@/lib/admin/run-action";

export async function signOutAction() {
  return runAdminAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) throw error;
    redirect(getAdminPath("/login"));
  });
}
