import { notFound } from "next/navigation";
import { fetchGitHubUser, fetchGitHubRepos, fetchReposByNames } from "@/lib/github";
import { getLatestPublishedArticles } from "@/lib/blog/queries";
import { getBlogBaseUrl } from "@/lib/blog/url";
import { getPortfolioContent } from "@/lib/portfolio/queries";
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
  let latestArticles: Awaited<ReturnType<typeof getLatestPublishedArticles>> = [];
  const content = await getPortfolioContent();

  try {
    [user, allRepos, configRepos] = await Promise.all([
      fetchGitHubUser(content.github.username),
      fetchGitHubRepos(content.github.username),
      fetchReposByNames(
        content.repos.map((repository) => ({ name: repository.name, owner: repository.owner }))
      ),
    ]);
  } catch (e) {
    console.error("Failed to fetch GitHub data:", e);
  }

  try {
    latestArticles = await getLatestPublishedArticles(3);
  } catch (error) {
    console.error("Failed to fetch latest articles:", error);
  }

  return (
    <PortfolioClient
      githubUser={user}
      allRepos={allRepos}
      configRepos={configRepos}
      latestArticles={latestArticles}
      blogBaseUrl={getBlogBaseUrl()}
      content={content}
      urlDomain={domain as (typeof VALID_DOMAINS)[number]}
    />
  );
}
