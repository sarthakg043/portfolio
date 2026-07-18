import { fetchGitHubUser, fetchGitHubRepos } from "@/lib/github";
import { NextResponse } from "next/server";
import { getPortfolioContent } from "@/lib/portfolio/queries";

export const revalidate = 3600; // ISR: revalidate every hour

export async function GET() {
  try {
    const { github } = await getPortfolioContent();
    const [user, repos] = await Promise.all([
      fetchGitHubUser(github.username),
      fetchGitHubRepos(github.username),
    ]);

    return NextResponse.json({ user, repos }, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("GitHub API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch GitHub data" },
      { status: 500 }
    );
  }
}
