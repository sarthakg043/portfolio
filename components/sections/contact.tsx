"use client";

import { useDomain } from "@/components/providers/domain-provider";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { MagneticButton } from "@/components/effects/magnetic-button";
import config from "@/data/portfolio-config.json";
import { Mail, ArrowUpRight } from "lucide-react";
import { GithubIcon, LinkedinIcon, XTwitterIcon } from "@/components/icons/brands";

const links = [
  {
    icon: Mail,
    label: "Email",
    href: `mailto:${config.personal.email}`,
    text: config.personal.email,
  },
  {
    icon: GithubIcon,
    label: "GitHub",
    href: config.socials.github,
    text: "@sarthakg043",
  },
  {
    icon: LinkedinIcon,
    label: "LinkedIn",
    href: config.socials.linkedin,
    text: "in/sarthak-gupta-webdev",
  },
  {
    icon: XTwitterIcon,
    label: "Twitter / X",
    href: config.socials.twitter,
    text: "@sarthak_webdev",
  },
];

export function Contact() {
  const { domain } = useDomain();
  if (!domain) return null;

  return (
    <section id="contact" className="py-24 md:py-32 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tight mb-4 text-foreground">
            LET&apos;S WORK
          </h2>
          <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tight mb-6 text-outline">
            TOGETHER
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <p className="text-muted-foreground mb-12 text-lg max-w-lg">
            Interested in building something great? Drop a message.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {links.map(({ icon: Icon, label, href, text }) => (
              <MagneticButton key={label} strength={0.1}>
                <a
                  href={href}
                  target={href.startsWith("mailto") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 comic-card p-5 group w-full transition-transform hover:-translate-y-1"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{ background: "var(--domain-primary)" }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#999]">{label}</p>
                    <p className="text-sm font-black text-[#0e0e0e]">{text}</p>
                  </div>
                  <ArrowUpRight size={16} className="text-[#bbb] group-hover:text-[var(--domain-primary)] transition-colors" />
                </a>
              </MagneticButton>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
