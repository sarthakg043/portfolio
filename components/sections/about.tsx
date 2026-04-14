"use client";

import { useDomain } from "@/components/providers/domain-provider";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { DOMAIN_FONTS, DOMAIN_GRADIENT_CLASS, DOMAIN_HEADING_FONTS } from "@/lib/constants";
import config from "@/data/portfolio-config.json";

export function About() {
  const { domain } = useDomain();
  if (!domain) return null;

  return (
    <section id="about" className="py-24 md:py-32 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tight mb-4 text-foreground">
            ABOUT
          </h2>
          <h2
            className={`text-3xl md:text-6xl font-black uppercase tracking-tight mb-12 text-outline`}
          >
            {domain === "cyber" ? "THE HACKER" : domain === "java" ? "THE ARCHITECT" : "THE DEVELOPER"}
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main about text — comic white card */}
          <ScrollReveal delay={0.1}>
            <div className={`comic-card p-8 lg:col-span-2 h-full ${DOMAIN_FONTS[domain]}`}>
              <p className="text-lg md:text-xl leading-relaxed text-[#333]">
                {config.about[domain]}
              </p>
            </div>
          </ScrollReveal>

          {/* Info card — accent colored */}
          <ScrollReveal delay={0.2}>
            <div
              className="comic-card-accent p-8 h-full relative overflow-hidden"
              style={{ background: "var(--domain-primary)" }}
            >
              <div className="pattern-dots absolute inset-0" />
              <div className="relative z-10 space-y-6">
                {[
                  { label: "LOCATION", value: config.personal.location },
                  { label: "ROLE", value: "SDE-1 @ Tripfactory" },
                  { label: "EDUCATION", value: "IIIT Kottayam '26" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase"
                      style={{ color: domain === "cyber" ? "#000" : "rgba(255,255,255,0.6)" }}
                    >
                      {item.label}
                    </p>
                    <p className="text-lg font-black"
                      style={{ color: domain === "cyber" ? "#000" : "#fff" }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
