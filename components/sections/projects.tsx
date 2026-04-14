"use client";

import { useState } from "react";
import { useDomain, type Domain } from "@/components/providers/domain-provider";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/effects/scroll-reveal";
import { getLanguageColor, type GitHubRepo } from "@/lib/github";
import config from "@/data/portfolio-config.json";
import { motion, AnimatePresence } from "motion/react";
import { Star, GitFork, ExternalLink, ArrowUpRight } from "lucide-react";

interface ProjectsProps {
  githubRepos: GitHubRepo[];
}

const accentColors = ["var(--domain-primary)", "var(--domain-secondary)", "#06b6d4", "#f59e0b"];

export function Projects({ githubRepos }: ProjectsProps) {
  const { domain } = useDomain();
  const [filter, setFilter] = useState<"all" | Domain>("all");

  if (!domain) return null;

  const projects = config.repos.map((configRepo) => {
    const ghRepo = githubRepos.find(
      (r) =>
        r.name === configRepo.name &&
        r.full_name.startsWith(configRepo.owner)
    );
    return { ...configRepo, gh: ghRepo };
  });

  const filtered =
    filter === "all"
      ? projects
      : projects.filter((p) => p.domain.includes(filter));

  const filters: { key: "all" | Domain; label: string }[] = [
    { key: "all", label: "ALL" },
    { key: "frontend", label: "FRONTEND" },
    { key: "java", label: "JAVA" },
    { key: "cyber", label: "CYBER" },
  ];

  return (
    <section id="projects" className="py-24 md:py-32 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tight mb-4 text-foreground">
            RECENT
          </h2>
          <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tight mb-8 text-outline">
            PROJECTS
          </h2>
        </ScrollReveal>

        {/* Filters — bold pill buttons */}
        <ScrollReveal delay={0.1}>
          <div className="flex flex-wrap gap-3 mb-12">
            {filters.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="relative px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider border-2 transition-all"
                style={{
                  borderColor: filter === key ? "var(--domain-primary)" : "var(--border)",
                  background: filter === key ? "var(--domain-primary)" : "transparent",
                  color: filter === key
                    ? (domain === "cyber" ? "#000" : "#fff")
                    : "var(--muted-foreground)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Project grid — comic cards */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((project, i) => (
              <StaggerItem key={project.name}>
                <motion.a
                  layout
                  href={project.gh?.html_url ?? `https://github.com/${project.owner}/${project.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block comic-card p-6 group relative overflow-hidden"
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Top accent bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ background: accentColors[i % accentColors.length] }}
                  />

                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-black text-[#0e0e0e] group-hover:text-[var(--domain-primary)] transition-colors">
                      {project.name}
                    </h3>
                    <ArrowUpRight size={18} className="text-[#bbb] group-hover:text-[var(--domain-primary)] transition-colors" />
                  </div>

                  <p className="text-sm text-[#666] leading-relaxed mb-5">
                    {project.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-[#999]">
                    {project.gh?.language && (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ background: getLanguageColor(project.gh.language) }}
                        />
                        <span className="font-bold">{project.gh.language}</span>
                      </span>
                    )}
                    {project.gh && (
                      <>
                        <span className="flex items-center gap-1 font-bold">
                          <Star size={12} /> {project.gh.stargazers_count}
                        </span>
                        <span className="flex items-center gap-1 font-bold">
                          <GitFork size={12} /> {project.gh.forks_count}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {project.domain.map((d) => (
                      <span
                        key={d}
                        className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-[#f0f0f0] text-[#555]"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </motion.a>
              </StaggerItem>
            ))}
          </AnimatePresence>
        </StaggerContainer>
      </div>
    </section>
  );
}
