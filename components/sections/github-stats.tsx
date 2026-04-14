"use client";

import { useDomain } from "@/components/providers/domain-provider";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import type { GitHubUser, GitHubRepo } from "@/lib/github";
import { motion } from "motion/react";
import { Star, GitFork, Users, BookOpen } from "lucide-react";

interface GitHubStatsProps {
  user: GitHubUser | null;
  repos: GitHubRepo[];
}

function StatCard({
  icon,
  label,
  value,
  delay,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  delay: number;
  accent?: boolean;
}) {
  return (
    <ScrollReveal delay={delay}>
      <div
        className={accent ? "comic-card-accent p-6 text-center" : "comic-card p-6 text-center"}
        style={accent ? { background: "var(--domain-primary)" } : {}}
      >
        <div className="flex items-center justify-center mb-3"
          style={{ color: accent ? (["cyber"].includes("") ? "#000" : "#fff") : "var(--domain-primary)" }}
        >
          {icon}
        </div>
        <div className={`text-3xl md:text-4xl font-black mb-1 ${accent ? "text-white" : "text-[#0e0e0e]"}`}>
          {value}
        </div>
        <div className={`text-[10px] font-bold tracking-[0.2em] uppercase ${accent ? "text-white/60" : "text-[#999]"}`}>
          {label}
        </div>
      </div>
    </ScrollReveal>
  );
}

function LanguageBar({ repos }: { repos: GitHubRepo[] }) {
  const langMap = new Map<string, number>();
  repos.forEach((r) => {
    if (r.language) {
      langMap.set(r.language, (langMap.get(r.language) || 0) + 1);
    }
  });

  const sorted = [...langMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const total = sorted.reduce((s, [, c]) => s + c, 0);

  const colors: Record<string, string> = {
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    Python: "#3572A5",
    Java: "#b07219",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Shell: "#89e051",
  };

  return (
    <ScrollReveal delay={0.3}>
      <div className="comic-card p-6">
        <h3 className="text-sm font-black uppercase tracking-wider text-[#0e0e0e] mb-4">
          Top Languages
        </h3>
        <div className="flex rounded-full overflow-hidden h-4 mb-4 border-2 border-[#0e0e0e]">
          {sorted.map(([lang, count]) => (
            <motion.div
              key={lang}
              className="h-full"
              style={{ background: colors[lang] || "#666" }}
              initial={{ width: 0 }}
              whileInView={{ width: `${(count / total) * 100}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          {sorted.map(([lang, count]) => (
            <span key={lang} className="flex items-center gap-1.5 text-xs text-[#666]">
              <span
                className="w-3 h-3 rounded-full"
                style={{ background: colors[lang] || "#666" }}
              />
              <span className="font-bold">{lang}</span>
              <span>{((count / total) * 100).toFixed(0)}%</span>
            </span>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}

export function GitHubStats({ user, repos }: GitHubStatsProps) {
  const { domain } = useDomain();
  if (!domain || !user) return null;

  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const totalForks = repos.reduce((s, r) => s + r.forks_count, 0);

  return (
    <section id="github" className="py-24 md:py-32 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tight mb-4 text-foreground">
            GITHUB
          </h2>
          <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tight mb-16 text-outline">
            STATS
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<BookOpen size={22} />} label="Repos" value={user.public_repos} delay={0} />
          <StatCard icon={<Star size={22} />} label="Stars" value={totalStars} delay={0.1} accent />
          <StatCard icon={<GitFork size={22} />} label="Forks" value={totalForks} delay={0.2} />
          <StatCard icon={<Users size={22} />} label="Followers" value={user.followers} delay={0.3} accent />
        </div>

        <LanguageBar repos={repos} />

        {/* GitHub contribution graph */}
        <ScrollReveal delay={0.4}>
          <div className="mt-8 comic-card p-4 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://ghchart.rshah.org/${domain === "cyber" ? "00ff41" : domain === "java" ? "FF8C00" : "FF4D00"}/${user.login}`}
              alt="GitHub contribution graph"
              className="w-full"
              loading="lazy"
            />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
