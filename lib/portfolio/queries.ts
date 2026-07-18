import "server-only";

import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import {
  PORTFOLIO_DOMAINS,
  type PortfolioContent,
  type PortfolioDomain,
  type SkillDomain,
} from "@/lib/portfolio/types";

type AssetRow = {
  id: string;
  storage_bucket: string;
  object_path: string;
};

function publicAssetUrl(asset: AssetRow | undefined): string {
  if (!asset) return "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is required to serve portfolio assets.");
  const path = asset.object_path.split("/").map(encodeURIComponent).join("/");
  return new URL(
    `/storage/v1/object/public/${encodeURIComponent(asset.storage_bucket)}/${path}`,
    supabaseUrl
  ).toString();
}

function isPortfolioDomain(value: string): value is PortfolioDomain {
  return PORTFOLIO_DOMAINS.includes(value as PortfolioDomain);
}

function asPortfolioDomains(values: string[]): PortfolioDomain[] {
  return values.filter(isPortfolioDomain);
}

export const getPortfolioContent = cache(async (): Promise<PortfolioContent> => {
  const supabase = createPublicClient();
  const results = await Promise.all([
    supabase.from("portfolio_profile").select("*").eq("id", 1).single(),
    supabase.from("portfolio_domains").select("*").eq("visible", true).order("display_order"),
    supabase.from("social_links").select("*").eq("visible", true).order("display_order"),
    supabase.from("skills").select("*").eq("visible", true).order("domain").order("display_order"),
    supabase.from("experiences").select("*").eq("visible", true).order("display_order"),
    supabase.from("projects").select("*").eq("visible", true).order("display_order"),
    supabase.from("certifications").select("*").eq("visible", true).order("display_order"),
    supabase.from("site_integrations").select("*").eq("id", 1).single(),
    supabase.from("assets").select("id, storage_bucket, object_path").eq("visibility", "public"),
  ]);

  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(`Unable to load public portfolio content: ${failed.error.message}`);

  const profile = results[0].data;
  const domains = results[1].data ?? [];
  const socials = results[2].data ?? [];
  const skills = results[3].data ?? [];
  const experiences = results[4].data ?? [];
  const projects = results[5].data ?? [];
  const certifications = results[6].data ?? [];
  const integrations = results[7].data;
  const assets = new Map((results[8].data ?? []).map((asset) => [asset.id, asset]));

  const domainRows = new Map(domains.map((domain) => [domain.id, domain]));
  for (const domain of PORTFOLIO_DOMAINS) {
    if (!domainRows.has(domain)) throw new Error(`Portfolio domain ${domain} is not configured.`);
  }

  const socialRows = new Map(socials.map((social) => [social.platform, social.url]));
  const requiredSocial = (platform: string): string => {
    const url = socialRows.get(platform);
    if (!url) throw new Error(`Portfolio social link ${platform} is not configured.`);
    return url;
  };

  const groupedSkills: Record<SkillDomain, string[]> = {
    frontend: [],
    java: [],
    cyber: [],
    common: [],
  };
  for (const skill of skills) groupedSkills[skill.domain as SkillDomain]?.push(skill.name);

  const resumeFor = (domain: PortfolioDomain): string =>
    publicAssetUrl(assets.get(domainRows.get(domain)?.resume_asset_id ?? ""));

  return {
    personal: {
      name: profile.name,
      tagline: profile.tagline,
      email: profile.contact_email,
      avatar: publicAssetUrl(assets.get(profile.avatar_asset_id ?? "")),
      resumePdf: publicAssetUrl(assets.get(profile.default_resume_asset_id ?? "")),
      resumeMap: {
        frontend: resumeFor("frontend"),
        java: resumeFor("java"),
        cyber: resumeFor("cyber"),
      },
      location: profile.location,
    },
    socials: {
      github: requiredSocial("github"),
      githubOrg: requiredSocial("github_org"),
      linkedin: requiredSocial("linkedin"),
      twitter: requiredSocial("twitter"),
    },
    about: {
      frontend: domainRows.get("frontend")!.about,
      java: domainRows.get("java")!.about,
      cyber: domainRows.get("cyber")!.about,
    },
    domainTaglines: {
      frontend: domainRows.get("frontend")!.tagline,
      java: domainRows.get("java")!.tagline,
      cyber: domainRows.get("cyber")!.tagline,
    },
    skills: groupedSkills,
    experience: experiences.map((experience) => ({
      id: experience.id,
      title: experience.title,
      company: experience.organization,
      location: experience.location,
      period: experience.period_label,
      description: experience.description,
      tags: experience.tags,
      domain: asPortfolioDomains(experience.domains),
    })),
    repos: projects.map((project) => ({
      id: project.id,
      name: project.name,
      owner: project.repository_owner,
      description: project.description,
      repositoryUrl: project.repository_url,
      domain: asPortfolioDomains(project.domains),
      image: publicAssetUrl(assets.get(project.image_asset_id ?? "")) || null,
      demoUrl: project.demo_url,
    })),
    certifications: certifications.map((certification) => ({
      id: certification.id,
      name: certification.name,
      issuer: certification.issuer,
      year: certification.year_label,
      url: certification.credential_url,
      domain: asPortfolioDomains(certification.domains),
    })),
    linkedin: {
      stats: {
        followers: integrations.linkedin_followers_label,
        connections: integrations.linkedin_connections_label,
        headline: integrations.linkedin_headline,
      },
      posts: integrations.linkedin_post_urls,
    },
    github: {
      username: integrations.github_username,
      showContributions: integrations.show_github_contributions,
      showLanguages: integrations.show_github_languages,
    },
  };
});
