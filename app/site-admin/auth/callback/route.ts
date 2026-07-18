import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin-config";
import { getAdminUrl } from "@/lib/site-host";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(getAdminUrl("/login?error=oauth"));
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(getAdminUrl("/login?error=oauth"));
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !isAdminEmail(user.email)) {
    await supabase.auth.signOut({ scope: "global" });
    return NextResponse.redirect(getAdminUrl("/login?error=unauthorized"));
  }

  return NextResponse.redirect(getAdminUrl(next));
}
