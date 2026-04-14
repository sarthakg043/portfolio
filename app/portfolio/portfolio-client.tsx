"use client";

import { useEffect } from "react";
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

  // Authoritative domain source: the URL param.
  // Covers two cases:
  //   1. Direct URL access / page refresh — context domain is null on mount,
  //      this effect sets it so the page renders immediately.
  //   2. Navigation from landing (which no longer calls setDomain itself) —
  //      DomainProvider already initialised from the URL, but calling setDomain
  //      here is a safe no-op if the value is the same.
  useEffect(() => {
    setDomain(urlDomain);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log(
      "%c🕵️ Psst... you opened DevTools. You're clearly not a normie.",
      "color: #FF4D00; font-size: 14px; font-weight: bold;"
    );
    console.log(
      "%c" +
        "╔══════════════════════════════════════════════╗\n" +
        "║  SECRET MENU (shhh, don't tell anyone)       ║\n" +
        "╠══════════════════════════════════════════════╣\n" +
        '║  🎮 Konami Code   → ↑↑↓↓←→←→BA               ║\n' +
        "║  💻 Hidden Terminal → Click logo 5x fast     ║\n" +
        '║  💻 Also works    → Type "sudo" anywhere     ║\n' +
        "║  😴 Do nothing    → Wait 30s, get roasted    ║\n" +
        "╚══════════════════════════════════════════════╝",
      "color: #CCFF00; font-family: monospace; font-size: 12px;"
    );
    console.log(
      "%cIf you're reading the source code to find these... respect. 🫡",
      "color: #888; font-style: italic;"
    );
  }, []);

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