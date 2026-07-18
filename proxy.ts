import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSiteKind } from "@/lib/site-host";
import { hasSupabaseConfig, getSupabaseConfig } from "@/lib/supabase/config";

const INTERNAL_PREFIXES = ["/site-blog", "/site-admin"];

function rewriteForSite(request: NextRequest) {
  const site = getSiteKind(
    request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  );

  if (
    site === "portfolio" &&
    INTERNAL_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix))
  ) {
    return { site, response: new NextResponse(null, { status: 404 }) };
  }

  if (site === "portfolio") {
    return { site, response: NextResponse.next() };
  }

  const url = request.nextUrl.clone();
  const prefix = site === "blog" ? "/site-blog" : "/site-admin";
  url.pathname = `${prefix}${url.pathname === "/" ? "" : url.pathname}`;

  return { site, response: NextResponse.rewrite(url) };
}

export async function proxy(request: NextRequest) {
  const { site, response } = rewriteForSite(request);

  if (site === "admin") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Cache-Control", "private, no-store");
  }

  if (site !== "admin" || !hasSupabaseConfig()) {
    return response;
  }

  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // getClaims verifies and refreshes the JWT when needed. Authorization is
  // repeated in protected pages/actions and finally enforced by database RLS.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
