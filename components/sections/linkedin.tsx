"use client";

import { useDomain } from "@/components/providers/domain-provider";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import config from "@/data/portfolio-config.json";
import { Users, UserCheck, ArrowUpRight } from "lucide-react";
import { LinkedinIcon } from "@/components/icons/brands";

export function LinkedIn() {
  const { domain } = useDomain();
  if (!domain) return null;

  const { stats, posts } = config.linkedin;

  return (
    <section id="linkedin" className="py-24 md:py-32 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tight mb-16 text-foreground">
            LINKEDIN
          </h2>
        </ScrollReveal>

        {/* Stats card */}
        <ScrollReveal delay={0.1}>
          <div className="comic-card p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center gap-6">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white"
              style={{ background: "var(--domain-primary)" }}
            >
              <LinkedinIcon size={28} className="text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="text-xl font-black text-[#0e0e0e]">
                {config.personal.name}
              </p>
              <p className="text-sm text-[#888]">{stats.headline}</p>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <span className="text-2xl font-black text-[#0e0e0e]">{stats.followers}</span>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#999]">Followers</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-black text-[#0e0e0e]">{stats.connections}</span>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#999]">Connections</p>
              </div>
            </div>
            <a
              href={config.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider text-white"
              style={{ background: "var(--domain-primary)" }}
            >
              Connect <ArrowUpRight size={14} />
            </a>
          </div>
        </ScrollReveal>

        {/* Embedded posts */}
        {posts.length > 0 && !posts[0].includes("YOUR_POST_ID") && (
          <ScrollReveal delay={0.2}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {posts.map((postUrl, i) => (
                <div key={i} className="comic-card overflow-hidden">
                  <iframe
                    src={postUrl}
                    height={400}
                    width="100%"
                    frameBorder={0}
                    allowFullScreen
                    title={`LinkedIn Post ${i + 1}`}
                    className="w-full"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}
