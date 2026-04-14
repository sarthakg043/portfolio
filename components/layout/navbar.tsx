"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDomain } from "@/components/providers/domain-provider";
import { DomainSwitcher } from "./domain-switcher";
import { ScrollProgress } from "./scroll-progress";
import { MagneticButton } from "@/components/effects/magnetic-button";
import { Mail, Download, Menu, X } from "lucide-react";
import { GithubIcon, LinkedinIcon, XTwitterIcon } from "@/components/icons/brands";
import config from "@/data/portfolio-config.json";

const socialLinks = [
  { icon: GithubIcon, href: config.socials.github, label: "GitHub" },
  { icon: LinkedinIcon, href: config.socials.linkedin, label: "LinkedIn" },
  { icon: XTwitterIcon, href: config.socials.twitter, label: "Twitter" },
  { icon: Mail, href: `mailto:${config.personal.email}`, label: "Email" },
];

export function Navbar() {
  const { domain } = useDomain();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <ScrollProgress />
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3 transition-all duration-300"
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: scrolled ? "rgba(14, 14, 14, 0.95)" : "transparent",
          borderBottom: scrolled ? "2px solid var(--border)" : "2px solid transparent",
        }}
      >
        {/* Logo / Name — bold comic style */}
        <a href="/portfolio" className="text-lg font-black tracking-tight text-foreground uppercase">
          SG<span style={{ color: "var(--domain-primary)" }}>.</span>
        </a>

        {/* Center — Domain switcher */}
        <DomainSwitcher />

        {/* Right — Socials + Resume */}
        <div className="hidden md:flex items-center gap-2">
          {socialLinks.map(({ icon: Icon, href, label }) => (
            <MagneticButton key={label} strength={0.2}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                aria-label={label}
              >
                <Icon size={16} />
              </a>
            </MagneticButton>
          ))}
          <MagneticButton strength={0.2}>
            <a
              href={config.personal.resumePdf}
              download
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border-2 transition-colors ml-2"
              style={{
                borderColor: "var(--domain-primary)",
                color: "var(--domain-primary)",
              }}
            >
              <Download size={12} />
              Resume
            </a>
          </MagneticButton>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-background/95 flex flex-col items-center justify-center gap-8 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DomainSwitcher />
            <div className="flex items-center gap-4">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-full border-2 text-muted-foreground hover:text-foreground transition-colors"
                  style={{ borderColor: "var(--border)" }}
                  aria-label={label}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
            <a
              href={config.personal.resumePdf}
              download
              className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-black uppercase tracking-wider border-2"
              style={{
                borderColor: "var(--domain-primary)",
                color: "var(--domain-primary)",
              }}
              onClick={() => setMobileOpen(false)}
            >
              <Download size={14} />
              Download Resume
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
