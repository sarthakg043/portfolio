"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const nullableUuid = z.union([z.literal(""), z.uuid()]).transform((value) => value || null);
const optionalHttpsUrl = z.union([z.literal(""), z.url().startsWith("https://")]).transform((value) => value || null);
const order = z.coerce.number().int().min(0).max(10_000);

function checked(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true";
}

function list(value: FormDataEntryValue | null): string[] {
  return String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

function refreshPortfolio() {
  revalidatePath("/site-admin/portfolio-content");
  revalidatePath("/portfolio/[domain]", "page");
}

export async function savePortfolioProfileAction(formData: FormData) {
  const user = await requireAdmin();
  const parsed = z.object({
    name: z.string().trim().min(1).max(100),
    tagline: z.string().trim().min(1).max(250),
    contactEmail: z.email(),
    location: z.string().trim().min(1).max(150),
    avatarAssetId: nullableUuid,
    defaultResumeAssetId: nullableUuid,
  }).parse({
    name: formData.get("name"), tagline: formData.get("tagline"), contactEmail: formData.get("contactEmail"), location: formData.get("location"), avatarAssetId: formData.get("avatarAssetId") ?? "", defaultResumeAssetId: formData.get("defaultResumeAssetId") ?? "",
  });
  const supabase = await createClient();
  const { error } = await supabase.from("portfolio_profile").upsert({ id: 1, owner_id: user.id, name: parsed.name, tagline: parsed.tagline, contact_email: parsed.contactEmail, location: parsed.location, avatar_asset_id: parsed.avatarAssetId, default_resume_asset_id: parsed.defaultResumeAssetId });
  if (error) throw new Error(error.message);
  refreshPortfolio();
}

export async function savePortfolioDomainAction(formData: FormData) {
  const user = await requireAdmin();
  const parsed = z.object({ id: z.enum(["frontend", "java", "cyber"]), tagline: z.string().trim().min(1).max(250), about: z.string().trim().min(1).max(3000), resumeAssetId: nullableUuid, displayOrder: order, visible: z.boolean() }).parse({
    id: formData.get("id"), tagline: formData.get("tagline"), about: formData.get("about"), resumeAssetId: formData.get("resumeAssetId") ?? "", displayOrder: formData.get("displayOrder"), visible: checked(formData.get("visible")),
  });
  const supabase = await createClient();
  const { error } = await supabase.from("portfolio_domains").upsert({ id: parsed.id, owner_id: user.id, tagline: parsed.tagline, about: parsed.about, resume_asset_id: parsed.resumeAssetId, display_order: parsed.displayOrder, visible: parsed.visible });
  if (error) throw new Error(error.message);
  refreshPortfolio();
}

export async function saveSiteIntegrationsAction(formData: FormData) {
  const user = await requireAdmin();
  const parsed = z.object({ githubUsername: z.string().trim().min(1).max(100), linkedinFollowers: z.string().trim().max(50), linkedinConnections: z.string().trim().max(50), linkedinHeadline: z.string().trim().max(300), linkedinPosts: z.array(z.url().startsWith("https://")).max(20) }).parse({
    githubUsername: formData.get("githubUsername"), linkedinFollowers: formData.get("linkedinFollowers"), linkedinConnections: formData.get("linkedinConnections"), linkedinHeadline: formData.get("linkedinHeadline"), linkedinPosts: list(formData.get("linkedinPosts")),
  });
  const supabase = await createClient();
  const { error } = await supabase.from("site_integrations").upsert({ id: 1, owner_id: user.id, github_username: parsed.githubUsername, show_github_contributions: checked(formData.get("showGithubContributions")), show_github_languages: checked(formData.get("showGithubLanguages")), linkedin_followers_label: parsed.linkedinFollowers, linkedin_connections_label: parsed.linkedinConnections, linkedin_headline: parsed.linkedinHeadline, linkedin_post_urls: parsed.linkedinPosts });
  if (error) throw new Error(error.message);
  refreshPortfolio();
}

const itemBase = z.object({ id: z.union([z.literal(""), z.uuid()]), displayOrder: order, visible: z.boolean() });

export async function savePortfolioItemAction(formData: FormData) {
  const user = await requireAdmin();
  const kind = z.enum(["social", "skill", "experience", "project", "certification"]).parse(formData.get("kind"));
  const common = { id: formData.get("id") ?? "", displayOrder: formData.get("displayOrder") ?? 0, visible: checked(formData.get("visible")) };
  const supabase = await createClient();

  if (kind === "social") {
    const parsed = itemBase.extend({ platform: z.enum(["github", "github_org", "linkedin", "twitter", "website", "other"]), label: z.string().trim().min(1).max(100), url: z.url().startsWith("https://") }).parse({ ...common, platform: formData.get("platform"), label: formData.get("label"), url: formData.get("url") });
    const payload = { owner_id: user.id, platform: parsed.platform, label: parsed.label, url: parsed.url, display_order: parsed.displayOrder, visible: parsed.visible };
    const result = parsed.id ? await supabase.from("social_links").update(payload).eq("id", parsed.id) : await supabase.from("social_links").insert(payload);
    if (result.error) throw new Error(result.error.message);
  }

  if (kind === "skill") {
    const parsed = itemBase.extend({ domain: z.enum(["frontend", "java", "cyber", "common"]), name: z.string().trim().min(1).max(80) }).parse({ ...common, domain: formData.get("domain"), name: formData.get("name") });
    const payload = { owner_id: user.id, domain: parsed.domain, name: parsed.name, display_order: parsed.displayOrder, visible: parsed.visible };
    const result = parsed.id ? await supabase.from("skills").update(payload).eq("id", parsed.id) : await supabase.from("skills").insert(payload);
    if (result.error) throw new Error(result.error.message);
  }

  if (kind === "experience") {
    const parsed = itemBase.extend({ title: z.string().trim().min(1).max(150), organization: z.string().trim().min(1).max(150), location: z.string().trim().max(150), period: z.string().trim().min(1).max(100), description: z.string().trim().min(1).max(3000), tags: z.array(z.string().max(80)).max(30), domains: z.array(z.enum(["frontend", "java", "cyber"])).min(1) }).parse({ ...common, title: formData.get("title"), organization: formData.get("organization"), location: formData.get("location"), period: formData.get("period"), description: formData.get("description"), tags: list(formData.get("tags")), domains: list(formData.get("domains")) });
    const payload = { owner_id: user.id, title: parsed.title, organization: parsed.organization, location: parsed.location, period_label: parsed.period, description: parsed.description, tags: parsed.tags, domains: parsed.domains, display_order: parsed.displayOrder, visible: parsed.visible };
    const result = parsed.id ? await supabase.from("experiences").update(payload).eq("id", parsed.id) : await supabase.from("experiences").insert(payload);
    if (result.error) throw new Error(result.error.message);
  }

  if (kind === "project") {
    const parsed = itemBase.extend({ name: z.string().trim().min(1).max(150), repositoryOwner: z.string().trim().min(1).max(100), description: z.string().trim().min(1).max(3000), repositoryUrl: optionalHttpsUrl, demoUrl: optionalHttpsUrl, imageAssetId: nullableUuid, domains: z.array(z.enum(["frontend", "java", "cyber"])).min(1), featured: z.boolean() }).parse({ ...common, name: formData.get("name"), repositoryOwner: formData.get("repositoryOwner"), description: formData.get("description"), repositoryUrl: formData.get("repositoryUrl") ?? "", demoUrl: formData.get("demoUrl") ?? "", imageAssetId: formData.get("imageAssetId") ?? "", domains: list(formData.get("domains")), featured: checked(formData.get("featured")) });
    const payload = { owner_id: user.id, name: parsed.name, repository_owner: parsed.repositoryOwner, description: parsed.description, repository_url: parsed.repositoryUrl, demo_url: parsed.demoUrl, image_asset_id: parsed.imageAssetId, domains: parsed.domains, featured: parsed.featured, display_order: parsed.displayOrder, visible: parsed.visible };
    const result = parsed.id ? await supabase.from("projects").update(payload).eq("id", parsed.id) : await supabase.from("projects").insert(payload);
    if (result.error) throw new Error(result.error.message);
  }

  if (kind === "certification") {
    const parsed = itemBase.extend({ name: z.string().trim().min(1).max(180), issuer: z.string().trim().min(1).max(150), year: z.string().trim().min(1).max(30), credentialUrl: optionalHttpsUrl, domains: z.array(z.enum(["frontend", "java", "cyber"])).min(1) }).parse({ ...common, name: formData.get("name"), issuer: formData.get("issuer"), year: formData.get("year"), credentialUrl: formData.get("credentialUrl") ?? "", domains: list(formData.get("domains")) });
    const payload = { owner_id: user.id, name: parsed.name, issuer: parsed.issuer, year_label: parsed.year, credential_url: parsed.credentialUrl, domains: parsed.domains, display_order: parsed.displayOrder, visible: parsed.visible };
    const result = parsed.id ? await supabase.from("certifications").update(payload).eq("id", parsed.id) : await supabase.from("certifications").insert(payload);
    if (result.error) throw new Error(result.error.message);
  }

  refreshPortfolio();
}

export async function deletePortfolioItemAction(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ kind: z.enum(["social", "skill", "experience", "project", "certification"]), id: z.uuid() }).parse({ kind: formData.get("kind"), id: formData.get("id") });
  const table = { social: "social_links", skill: "skills", experience: "experiences", project: "projects", certification: "certifications" } as const;
  const supabase = await createClient();
  const { error } = await supabase.from(table[parsed.kind]).delete().eq("id", parsed.id);
  if (error) throw new Error(error.message);
  refreshPortfolio();
}

