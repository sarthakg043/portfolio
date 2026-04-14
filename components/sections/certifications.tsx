"use client";

import { useDomain } from "@/components/providers/domain-provider";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/effects/scroll-reveal";
import config from "@/data/portfolio-config.json";
import { Award, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";

export function Certifications() {
  const { domain } = useDomain();
  if (!domain) return null;

  if (config.certifications.length === 0) return null;

  return (
    <section id="certifications" className="py-24 md:py-32 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tight mb-16 text-foreground">
            CERTIFICATIONS
          </h2>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {config.certifications.map((cert, i) => (
            <StaggerItem key={i}>
              <motion.a
                href={cert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block comic-card p-6 group relative overflow-hidden"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ background: i % 2 === 0 ? "var(--domain-primary)" : "var(--domain-secondary)" }}
                />
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-on-primary"
                    style={{ background: "var(--domain-primary)" }}
                  >
                    <Award size={20} />
                  </div>
                  <ArrowUpRight size={16} className="text-card-text-dim group-hover:text-domain-primary transition-colors" />
                </div>
                <h3 className="font-black text-card-text mb-1">{cert.name}</h3>
                <p className="text-sm text-card-text-subtle">{cert.issuer} • {cert.year}</p>
              </motion.a>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
