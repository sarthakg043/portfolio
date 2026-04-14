"use client";

import { useDomain, type Domain } from "@/components/providers/domain-provider";
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from "@/components/effects/scroll-reveal";
import config from "@/data/portfolio-config.json";
import { motion } from "motion/react";

const categoryLabels: Record<string, string> = {
  frontend: "FRONTEND",
  java: "JAVA BACKEND",
  cyber: "CYBERSECURITY",
  common: "GENERAL",
};

function SkillBadge({
  skill,
  highlighted,
}: {
  skill: string;
  highlighted: boolean;
}) {
  return (
    <motion.span
      className="inline-flex items-center px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border-2 transition-all duration-200"
      style={{
        borderColor: highlighted ? "var(--domain-primary)" : "var(--border)",
        color: highlighted ? (["cyber"].includes("") ? "#000" : "#fff") : "var(--muted-foreground)",
        background: highlighted ? "var(--domain-primary)" : "transparent",
      }}
      whileHover={{
        scale: 1.05,
        y: -2,
      }}
    >
      {skill}
    </motion.span>
  );
}

export function Skills() {
  const { domain } = useDomain();
  if (!domain) return null;

  const categories = Object.entries(config.skills) as [string, string[]][];

  return (
    <section id="skills" className="py-24 md:py-32 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tight mb-4 text-foreground">
            SKILLS &
          </h2>
          <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tight mb-16 text-outline">
            EXPERTISE
          </h2>
        </ScrollReveal>

        <div className="space-y-10">
          {categories.map(([category, skills]) => {
            const isCurrent = category === domain || category === "common";
            return (
              <ScrollReveal key={category} delay={0.1}>
                <div>
                  <h3
                    className="text-xs font-black tracking-[0.3em] uppercase mb-4 pb-2 border-b-2"
                    style={{
                      color: isCurrent ? "var(--domain-primary)" : "var(--muted-foreground)",
                      borderColor: isCurrent ? "var(--domain-primary)" : "var(--border)",
                    }}
                  >
                    {categoryLabels[category] || category}
                  </h3>
                  <StaggerContainer className="flex flex-wrap gap-3" staggerDelay={0.03}>
                    {skills.map((skill) => (
                      <StaggerItem key={skill}>
                        <SkillBadge skill={skill} highlighted={isCurrent} />
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
