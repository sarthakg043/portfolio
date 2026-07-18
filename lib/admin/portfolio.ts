import "server-only";

import { createClient } from "@/lib/supabase/server";

export type PortfolioRow = Record<string, unknown>;

export async function getPortfolioAdminData() {
  const supabase = await createClient();
  const results = await Promise.all([
    supabase.from("portfolio_profile").select("*").eq("id", 1).maybeSingle(),
    supabase.from("portfolio_domains").select("*").order("display_order"),
    supabase.from("social_links").select("*").order("display_order"),
    supabase.from("skills").select("*").order("domain").order("display_order"),
    supabase.from("experiences").select("*").order("display_order"),
    supabase.from("projects").select("*").order("display_order"),
    supabase.from("certifications").select("*").order("display_order"),
    supabase.from("site_integrations").select("*").eq("id", 1).maybeSingle(),
    supabase.from("assets").select("id, display_name, kind").eq("visibility", "public").order("display_name"),
  ]);

  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(`Unable to load portfolio content: ${failed.error.message}`);

  return {
    profile: (results[0].data ?? null) as PortfolioRow | null,
    domains: (results[1].data ?? []) as PortfolioRow[],
    socials: (results[2].data ?? []) as PortfolioRow[],
    skills: (results[3].data ?? []) as PortfolioRow[],
    experiences: (results[4].data ?? []) as PortfolioRow[],
    projects: (results[5].data ?? []) as PortfolioRow[],
    certifications: (results[6].data ?? []) as PortfolioRow[],
    integrations: (results[7].data ?? null) as PortfolioRow | null,
    assets: (results[8].data ?? []) as Array<{ id: string; display_name: string; kind: string }>,
  };
}

