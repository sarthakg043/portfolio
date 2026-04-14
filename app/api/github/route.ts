import { fetchGitHubUser, fetchGitHubRepos } from "@/lib/github";
import { NextResponse } from "next/server";

export const revalidate = 3600; // ISR: revalidate every hour

export async function GET() {
  try {
    const [user, repos] = await Promise.all([
      fetchGitHubUser(),
      fetchGitHubRepos(),
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
