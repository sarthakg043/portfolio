import { Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  deletePortfolioItemAction,
  savePortfolioDomainAction,
  savePortfolioItemAction,
  savePortfolioProfileAction,
  saveSiteIntegrationsAction,
} from "@/app/site-admin/portfolio-content/actions";
import { getPortfolioAdminData, type PortfolioRow } from "@/lib/admin/portfolio";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type ItemKind = "social" | "skill" | "experience" | "project" | "certification";

const text = (row: PortfolioRow | null, key: string) => typeof row?.[key] === "string" ? row[key] as string : "";
const number = (row: PortfolioRow | null, key: string) => typeof row?.[key] === "number" ? row[key] as number : 0;
const bool = (row: PortfolioRow | null, key: string, fallback = false) => typeof row?.[key] === "boolean" ? row[key] as boolean : fallback;
const csv = (row: PortfolioRow | null, key: string) => Array.isArray(row?.[key]) ? (row?.[key] as string[]).join(", ") : "";

function AssetSelect({ name, value, assets, kinds }: { name: string; value: string; assets: Array<{ id: string; display_name: string; kind: string }>; kinds?: string[] }) {
  return <select name={name} defaultValue={value}><option value="">None</option>{assets.filter((asset) => !kinds || kinds.includes(asset.kind)).map((asset) => <option key={asset.id} value={asset.id}>{asset.display_name}</option>)}</select>;
}

function CommonFields({ row }: { row: PortfolioRow | null }) {
  return <><label className="admin-field"><span>Display order</span><input type="number" min="0" name="displayOrder" defaultValue={number(row, "display_order")} /></label><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="visible" defaultChecked={bool(row, "visible", true)} /> Visible</label></>;
}

function ItemFields({ kind, row, assets }: { kind: ItemKind; row: PortfolioRow | null; assets: Array<{ id: string; display_name: string; kind: string }> }) {
  if (kind === "social") return <><label className="admin-field"><span>Platform</span><select name="platform" defaultValue={text(row, "platform") || "website"}>{["github", "github_org", "linkedin", "twitter", "website", "other"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="admin-field"><span>Label</span><input name="label" defaultValue={text(row, "label")} required /></label><label className="admin-field"><span>HTTPS URL</span><input name="url" defaultValue={text(row, "url")} placeholder="https://" required /></label><CommonFields row={row} /></>;
  if (kind === "skill") return <><label className="admin-field"><span>Domain</span><select name="domain" defaultValue={text(row, "domain") || "common"}>{["frontend", "java", "cyber", "common"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="admin-field"><span>Skill</span><input name="name" defaultValue={text(row, "name")} required /></label><CommonFields row={row} /></>;
  if (kind === "experience") return <><label className="admin-field"><span>Title</span><input name="title" defaultValue={text(row, "title")} required /></label><label className="admin-field"><span>Organization</span><input name="organization" defaultValue={text(row, "organization")} required /></label><label className="admin-field"><span>Location</span><input name="location" defaultValue={text(row, "location")} /></label><label className="admin-field"><span>Period</span><input name="period" defaultValue={text(row, "period_label")} required /></label><label className="admin-field"><span>Description</span><textarea name="description" defaultValue={text(row, "description")} rows={4} required /></label><label className="admin-field"><span>Tags</span><input name="tags" defaultValue={csv(row, "tags")} placeholder="Next.js, Java" /></label><label className="admin-field"><span>Domains</span><input name="domains" defaultValue={csv(row, "domains")} placeholder="frontend, java" required /></label><CommonFields row={row} /></>;
  if (kind === "project") return <><label className="admin-field"><span>Repository name</span><input name="name" defaultValue={text(row, "name")} required /></label><label className="admin-field"><span>Repository owner</span><input name="repositoryOwner" defaultValue={text(row, "repository_owner")} required /></label><label className="admin-field"><span>Description</span><textarea name="description" defaultValue={text(row, "description")} rows={4} required /></label><label className="admin-field"><span>Repository URL</span><input name="repositoryUrl" defaultValue={text(row, "repository_url")} placeholder="https://" /></label><label className="admin-field"><span>Demo URL</span><input name="demoUrl" defaultValue={text(row, "demo_url")} placeholder="https://" /></label><label className="admin-field"><span>Image</span><AssetSelect name="imageAssetId" value={text(row, "image_asset_id")} assets={assets} kinds={["image"]} /></label><label className="admin-field"><span>Domains</span><input name="domains" defaultValue={csv(row, "domains")} placeholder="frontend, cyber" required /></label><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="featured" defaultChecked={bool(row, "featured")} /> Featured</label><CommonFields row={row} /></>;
  return <><label className="admin-field"><span>Name</span><input name="name" defaultValue={text(row, "name")} required /></label><label className="admin-field"><span>Issuer</span><input name="issuer" defaultValue={text(row, "issuer")} required /></label><label className="admin-field"><span>Year</span><input name="year" defaultValue={text(row, "year_label")} required /></label><label className="admin-field"><span>Credential URL</span><input name="credentialUrl" defaultValue={text(row, "credential_url")} placeholder="https://" /></label><label className="admin-field"><span>Domains</span><input name="domains" defaultValue={csv(row, "domains")} placeholder="frontend, java" required /></label><CommonFields row={row} /></>;
}

function Collection({ title, kind, rows, assets }: { title: string; kind: ItemKind; rows: PortfolioRow[]; assets: Array<{ id: string; display_name: string; kind: string }> }) {
  return (
    <section className="admin-panel">
      <div><p className="admin-eyebrow">Collection</p><h2 className="mt-1 text-2xl font-semibold">{title}</h2></div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[...rows, null].map((row) => {
          const id = text(row, "id");
          return (
            <details key={id || `new-${kind}`} className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-700" open={!row}>
              <summary className="cursor-pointer font-semibold">{row ? text(row, "name") || text(row, "label") || text(row, "title") || `Edit ${kind}` : `Add ${kind}`}</summary>
              <form action={savePortfolioItemAction} className="mt-5 grid gap-4">
                <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} />
                <ItemFields kind={kind} row={row} assets={assets} />
                <button className="admin-primary-button w-fit" type="submit">{row ? "Save changes" : `Add ${kind}`}</button>
              </form>
              {row ? <form action={deletePortfolioItemAction} className="mt-3"><input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} /><button className="inline-flex items-center gap-2 text-xs font-semibold text-red-600"><Trash2 className="size-3.5" /> Delete</button></form> : null}
            </details>
          );
        })}
      </div>
    </section>
  );
}

export default async function PortfolioContentPage() {
  const user = await requireAdmin();
  const data = await getPortfolioAdminData();
  const domains = ["frontend", "java", "cyber"].map((id, index) => data.domains.find((row) => text(row, "id") === id) ?? { id, display_order: index, visible: true });

  return (
    <AdminShell email={user.email ?? "Administrator"}>
      <main className="mx-auto max-w-7xl space-y-8 px-5 py-10 sm:px-8">
        <div><p className="admin-eyebrow">Portfolio CMS</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Portfolio content</h1><p className="mt-2 max-w-2xl text-neutral-600 dark:text-neutral-400">Edit the normalized database content that will replace the static JSON fixture in Phase 5.</p></div>

        <section className="admin-panel">
          <div><p className="admin-eyebrow">Identity</p><h2 className="mt-1 text-2xl font-semibold">Profile</h2></div>
          <form action={savePortfolioProfileAction} className="grid gap-4 md:grid-cols-2">
            <label className="admin-field"><span>Name</span><input name="name" defaultValue={text(data.profile, "name")} required /></label><label className="admin-field"><span>Contact email</span><input type="email" name="contactEmail" defaultValue={text(data.profile, "contact_email")} required /></label><label className="admin-field md:col-span-2"><span>Tagline</span><input name="tagline" defaultValue={text(data.profile, "tagline")} required /></label><label className="admin-field"><span>Location</span><input name="location" defaultValue={text(data.profile, "location")} required /></label><label className="admin-field"><span>Avatar</span><AssetSelect name="avatarAssetId" value={text(data.profile, "avatar_asset_id")} assets={data.assets} kinds={["image", "avatar"]} /></label><label className="admin-field"><span>Default resume</span><AssetSelect name="defaultResumeAssetId" value={text(data.profile, "default_resume_asset_id")} assets={data.assets} kinds={["resume", "download"]} /></label><div className="md:col-span-2"><button className="admin-primary-button">Save profile</button></div>
          </form>
        </section>

        <section className="admin-panel">
          <div><p className="admin-eyebrow">Three paths</p><h2 className="mt-1 text-2xl font-semibold">Domain copy and resumes</h2></div>
          <div className="grid gap-4 lg:grid-cols-3">{domains.map((domain) => <form key={text(domain, "id")} action={savePortfolioDomainAction} className="grid gap-4 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-700"><input type="hidden" name="id" value={text(domain, "id")} /><h3 className="font-semibold capitalize">{text(domain, "id")}</h3><label className="admin-field"><span>Tagline</span><input name="tagline" defaultValue={text(domain, "tagline")} required /></label><label className="admin-field"><span>About</span><textarea name="about" defaultValue={text(domain, "about")} rows={6} required /></label><label className="admin-field"><span>Resume</span><AssetSelect name="resumeAssetId" value={text(domain, "resume_asset_id")} assets={data.assets} kinds={["resume", "download"]} /></label><label className="admin-field"><span>Order</span><input type="number" min="0" name="displayOrder" defaultValue={number(domain, "display_order")} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="visible" defaultChecked={bool(domain, "visible", true)} /> Visible</label><button className="admin-secondary-button">Save domain</button></form>)}</div>
        </section>

        <Collection title="Social links" kind="social" rows={data.socials} assets={data.assets} />
        <Collection title="Skills" kind="skill" rows={data.skills} assets={data.assets} />
        <Collection title="Experience" kind="experience" rows={data.experiences} assets={data.assets} />
        <Collection title="Projects" kind="project" rows={data.projects} assets={data.assets} />
        <Collection title="Certifications" kind="certification" rows={data.certifications} assets={data.assets} />

        <section className="admin-panel">
          <div><p className="admin-eyebrow">Live integrations</p><h2 className="mt-1 text-2xl font-semibold">GitHub and LinkedIn</h2></div>
          <form action={saveSiteIntegrationsAction} className="grid gap-4 md:grid-cols-2">
            <label className="admin-field"><span>GitHub username</span><input name="githubUsername" defaultValue={text(data.integrations, "github_username")} required /></label><div className="flex flex-wrap items-center gap-5"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="showGithubContributions" defaultChecked={bool(data.integrations, "show_github_contributions", true)} /> Contributions</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="showGithubLanguages" defaultChecked={bool(data.integrations, "show_github_languages", true)} /> Languages</label></div><label className="admin-field"><span>LinkedIn followers</span><input name="linkedinFollowers" defaultValue={text(data.integrations, "linkedin_followers_label")} /></label><label className="admin-field"><span>LinkedIn connections</span><input name="linkedinConnections" defaultValue={text(data.integrations, "linkedin_connections_label")} /></label><label className="admin-field md:col-span-2"><span>LinkedIn headline</span><input name="linkedinHeadline" defaultValue={text(data.integrations, "linkedin_headline")} /></label><label className="admin-field md:col-span-2"><span>LinkedIn post URLs</span><textarea name="linkedinPosts" defaultValue={csv(data.integrations, "linkedin_post_urls")} rows={4} placeholder="Comma-separated HTTPS embed URLs" /></label><div className="md:col-span-2"><button className="admin-primary-button">Save integrations</button></div>
          </form>
        </section>
      </main>
    </AdminShell>
  );
}
