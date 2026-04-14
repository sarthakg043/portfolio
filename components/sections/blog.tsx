"use client";

import { useDomain } from "@/components/providers/domain-provider";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/effects/scroll-reveal";
import config from "@/data/portfolio-config.json";
import { ArrowUpRight, Calendar } from "lucide-react";
import { motion } from "motion/react";

export function Blog() {
  const { domain } = useDomain();
  if (!domain) return null;

  if (config.blog.length === 0) return null;

  return (
    <section id="blog" className="py-24 md:py-32 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tight mb-4 text-foreground">
            DESIGN
          </h2>
          <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tight mb-16 text-outline">
            THOUGHTS
          </h2>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {config.blog.map((post, i) => (
            <StaggerItem key={i}>
              <motion.a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block comic-card p-6 group relative overflow-hidden h-[360px] flex flex-col"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2 text-xs text-[#999] font-bold mb-4">
                  <Calendar size={12} />
                  <span>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <h3 className="font-black text-[#0e0e0e] mb-2 group-hover:text-domain-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-[#666] leading-relaxed mb-4 line-clamp-7">
                  {post.excerpt}
                </p>
                <span
                  className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider mt-auto"
                  style={{ color: "var(--domain-primary)" }}
                >
                  Read more <ArrowUpRight size={12} />
                </span>
              </motion.a>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
