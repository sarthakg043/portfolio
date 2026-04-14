"use client";

import { useDomain } from "@/components/providers/domain-provider";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import config from "@/data/portfolio-config.json";
import { motion } from "motion/react";
import { Briefcase, GraduationCap, Trophy } from "lucide-react";

const typeIcon: Record<string, React.ReactNode> = {
  SDE: <Briefcase size={16} />,
  Intern: <Briefcase size={16} />,
  Finalist: <Trophy size={16} />,
  "B.Tech": <GraduationCap size={16} />,
};

function getIcon(title: string) {
  for (const [key, icon] of Object.entries(typeIcon)) {
    if (title.includes(key)) return icon;
  }
  return <Briefcase size={16} />;
}

export function Experience() {
  const { domain } = useDomain();
  if (!domain) return null;

  return (
    <section id="experience" className="py-24 md:py-32 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tight mb-4 text-foreground">
            WORK
          </h2>
          <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tight mb-16 text-outline">
            EXPERIENCE
          </h2>
        </ScrollReveal>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line — thick, solid */}
          <div
            className="absolute left-[19px] md:left-1/2 top-0 bottom-0 w-[3px] -translate-x-1/2"
            style={{ background: "var(--domain-primary)" }}
          />

          {config.experience.map((exp, i) => (
            <ScrollReveal key={i} delay={i * 0.15}>
              <div
                className={`relative flex items-start gap-6 mb-12 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Dot on timeline */}
                <div className="absolute left-[19px] md:left-1/2 -translate-x-1/2 z-10">
                  <motion.div
                    className="w-10 h-10 rounded-full border-3 flex items-center justify-center text-white"
                    style={{
                      borderColor: "var(--domain-primary)",
                      background: "var(--domain-primary)",
                    }}
                  >
                    {getIcon(exp.title)}
                  </motion.div>
                </div>

                {/* Card */}
                <motion.div
                  className={`ml-16 md:ml-0 md:w-[calc(50%-2.5rem)] comic-card p-6 relative overflow-hidden ${
                    i % 2 === 0 ? "md:mr-auto" : "md:ml-auto"
                  }`}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Top accent stripe */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: i % 2 === 0 ? "var(--domain-primary)" : "var(--domain-secondary)" }}
                  />

                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-card-text-subtle mb-2 block">
                    {exp.period}
                  </span>
                  <h3 className="text-lg font-black text-card-text mb-1">
                    {exp.title}
                  </h3>
                  <p className="text-sm font-bold mb-3" style={{ color: "var(--domain-primary)" }}>
                    {exp.company}{" "}
                    <span className="text-card-text-faint font-normal">• {exp.location}</span>
                  </p>
                  <p className="text-sm text-card-text-muted leading-relaxed mb-4">
                    {exp.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {exp.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-card-tag-bg text-card-tag-text"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
