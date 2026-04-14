import { GITHUB_API_BASE, GITHUB_USERNAME } from "./constants";

export interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  updated_at: string;
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
  name: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

export async function fetchGitHubUser(): Promise<GitHubUser> {
  const res = await fetch(`${GITHUB_API_BASE}/users/${GITHUB_USERNAME}`, {
    next: { revalidate: 3600 },
    headers: {
      Accept: "application/vnd.github.v3+json",
      ...(process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub user fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchGitHubRepos(): Promise<GitHubRepo[]> {
  const res = await fetch(
    `${GITHUB_API_BASE}/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`,
    {
      next: { revalidate: 3600 },
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
    }
  );
  if (!res.ok) throw new Error(`GitHub repos fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchReposByNames(
  repos: { name: string; owner: string }[]
): Promise<GitHubRepo[]> {
  const results = await Promise.allSettled(
    repos.map(async ({ name, owner }) => {
      const res = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${name}`, {
        next: { revalidate: 3600 },
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN
            ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
            : {}),
        },
      });
      if (!res.ok) return null;
      return res.json() as Promise<GitHubRepo>;
    })
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<GitHubRepo> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value);
}

export function getLanguageColor(lang: string): string {
  const colors: Record<string, string> = {
    TypeScript: "var(--lang-typescript)",
    JavaScript: "var(--lang-javascript)",
    Python: "var(--lang-python)",
    Java: "var(--lang-java-color)",
    HTML: "var(--lang-html)",
    CSS: "var(--lang-css-color)",
    Shell: "var(--lang-shell)",
    Rust: "var(--lang-rust)",
    Go: "var(--lang-go)",
    Ruby: "var(--lang-ruby)",
  };
  return colors[lang] ?? "var(--lang-unknown)";
}
