"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDomain, type Domain } from "@/components/providers/domain-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Skills } from "@/components/sections/skills";
import { Experience } from "@/components/sections/experience";
import { Projects } from "@/components/sections/projects";
import { GitHubStats } from "@/components/sections/github-stats";
import { Certifications } from "@/components/sections/certifications";
import { Blog } from "@/components/sections/blog";
import { LinkedIn } from "@/components/sections/linkedin";
import { Contact } from "@/components/sections/contact";
import { KonamiCode } from "@/components/easter-eggs/konami";
import { MiniTerminal } from "@/components/easter-eggs/mini-terminal";
import { IdleDetector } from "@/components/easter-eggs/idle-detector";
import type { GitHubRepo, GitHubUser } from "@/lib/github";

interface PortfolioClientProps {
  githubUser: GitHubUser | null;
  allRepos: GitHubRepo[];
  configRepos: GitHubRepo[];
  urlDomain: Domain;
}

export function PortfolioClient({
  githubUser,
  allRepos,
  configRepos,
  urlDomain,
}: PortfolioClientProps) {
  const { domain, setDomain } = useDomain();
  const router = useRouter();

  // Sync domain from URL — URL is the source of truth
  useEffect(() => {
    if (urlDomain && urlDomain !== domain) {
      setDomain(urlDomain);
    }
  }, [urlDomain, domain, setDomain]);

  if (!domain) return null;

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Skills />
        <Experience />
        <Projects githubRepos={configRepos} />
        <GitHubStats user={githubUser} repos={allRepos} />
        <Certifications />
        <Blog />
        <LinkedIn />
        <Contact />
      </main>
      <Footer />

      {/* Easter eggs */}
      <KonamiCode />
      <MiniTerminal />
      <IdleDetector />
    </>
  );
}
