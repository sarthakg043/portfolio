import { notFound } from "next/navigation";
import { fetchGitHubUser, fetchGitHubRepos, fetchReposByNames } from "@/lib/github";
import config from "@/data/portfolio-config.json";
import { PortfolioClient } from "../portfolio-client";

const VALID_DOMAINS = ["frontend", "java", "cyber"] as const;

export const revalidate = 3600;

export function generateStaticParams() {
  return VALID_DOMAINS.map((domain) => ({ domain }));
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;

  if (!VALID_DOMAINS.includes(domain as (typeof VALID_DOMAINS)[number])) {
    notFound();
  }

  let user = null;
  let allRepos: Awaited<ReturnType<typeof fetchGitHubRepos>> = [];
  let configRepos: Awaited<ReturnType<typeof fetchReposByNames>> = [];

  try {
    [user, allRepos, configRepos] = await Promise.all([
      fetchGitHubUser(),
      fetchGitHubRepos(),
      fetchReposByNames(
        config.repos.map((r) => ({ name: r.name, owner: r.owner }))
      ),
    ]);
  } catch (e) {
    console.error("Failed to fetch GitHub data:", e);
  }

  return (
    <PortfolioClient
      githubUser={user}
      allRepos={allRepos}
      configRepos={configRepos}
      urlDomain={domain as (typeof VALID_DOMAINS)[number]}
    />
  );
}
