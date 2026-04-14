"use client";

import { motion } from "motion/react";
import { useDomain } from "@/components/providers/domain-provider";
import { Particles } from "@/components/effects/particles";
import { DomainText } from "@/components/effects/glitch-text";
import { MagneticButton } from "@/components/effects/magnetic-button";
import { DOMAIN_FONTS, DOMAIN_GRADIENT_CLASS } from "@/lib/constants";
import config from "@/data/portfolio-config.json";
import { ArrowRight } from "lucide-react";

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

export function Hero() {
  const { domain } = useDomain();
  if (!domain) return null;

  const gradientClass = DOMAIN_GRADIENT_CLASS[domain];
  const fontClass = DOMAIN_FONTS[domain];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-clip px-4 md:px-8 pt-20">
      {/* Background particles */}
      <Particles className="z-0 opacity-40" />

      {/* Content — two-column layout like the reference */}
      <div className={`relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${fontClass}`}>
        {/* Left — profile card */}
        <motion.div
          className="flex justify-center lg:justify-start"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="comic-card p-8 w-full max-w-95 text-center relative">
            {/* Dashed decorative arc */}
            <div
              className="absolute -top-6 -left-6 w-40 h-40 rounded-full border-2 border-dashed opacity-50"
              style={{ borderColor: "var(--domain-primary)" }}
            />

            {/* Avatar area */}
            <div
              className="relative w-48 h-48 mx-auto mb-6 rounded-xl overflow-hidden border-3"
              style={{ borderColor: "var(--domain-primary)", background: "var(--domain-primary)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.personal.avatar}
                alt={config.personal.name}
                className="w-full h-full object-cover"
              />
            </div>

            <h2 className="text-2xl font-black text-[#0e0e0e] mb-1">
              {config.personal.name}
            </h2>

            {/* Orange dot separator */}
            <div className="flex justify-center my-3">
              <span
                className="w-3 h-3 rounded-full"
                style={{ background: "var(--domain-primary)" }}
              />
            </div>

            <p className="text-sm text-[#666] leading-relaxed mb-6">
              {config.about[domain]}
            </p>

            {/* Social icons row */}
            <div className="flex items-center justify-center gap-4">
              {[config.socials.github, config.socials.linkedin, config.socials.twitter].map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ color: "var(--domain-primary)" }}
                >
                  <span className="text-lg">{["⌨", "💼", "𝕏"][i]}</span>
                </a>
              ))}
            </div>

            {/* Dashed decorative line */}
            <svg className="absolute -bottom-8 -right-4 w-32 h-20 opacity-50" viewBox="0 0 120 80">
              <path
                d="M 0 40 Q 40 0 80 30 Q 120 60 120 80"
                fill="none"
                stroke="var(--domain-primary)"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
            </svg>
          </div>
        </motion.div>

        {/* Right — title & stats */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Domain badge */}
          <motion.div
            className="inline-block mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <span
              className="text-xs font-bold tracking-[0.3em] uppercase px-4 py-2 rounded-full border-2"
              style={{
                borderColor: "var(--domain-primary)",
                color: "var(--domain-primary)",
              }}
            >
              {domain === "cyber" ? "> whoami" : domain === "java" ? "— Greetings —" : "Hey there!"}
            </span>
          </motion.div>

          {/* BIG title — split into two lines like the reference */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight mb-2 text-foreground leading-[0.9]">
            SOFTWARE
          </h1>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight mb-6 leading-[0.9]">
            <DomainText className={gradientClass}>{
              domain === "frontend" ? "ENGINEER" : domain === "java" ? "ARCHITECT" : "HACKER"
            }</DomainText>
          </h1>

          {/* Tagline */}
          <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-md leading-relaxed">
            {config.domainTaglines[domain]}
          </p>

          {/* Stats row — like the reference */}
          <div className="flex items-start gap-8 md:gap-12 mb-10">
            {[
              { value: "4+", label: "PROJECTS\nCOMPLETED" },
              { value: "2+", label: "YEARS OF\nEXPERIENCE" },
              { value: "3", label: "DOMAINS\nMASTERED" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                <span className="text-4xl md:text-5xl font-black text-foreground">
                  {stat.value}
                </span>
                <p className="text-[10px] md:text-xs text-muted-foreground tracking-wider uppercase mt-1 whitespace-pre-line">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <MagneticButton>
              <button
                onClick={() => scrollToSection("projects")}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm uppercase tracking-wider transition-all cursor-pointer"
                style={{
                  background: "var(--domain-primary)",
                  color: domain === "cyber" ? "#000" : "#fff",
                }}
              >
                View My Work
                <ArrowRight size={16} />
              </button>
            </MagneticButton>
            <MagneticButton>
              <button
                onClick={() => scrollToSection("contact")}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm uppercase tracking-wider border-2 transition-all cursor-pointer"
                style={{
                  borderColor: "var(--domain-primary)",
                  color: "var(--domain-primary)",
                }}
              >
                Get in Touch
              </button>
            </MagneticButton>
          </div>
        </motion.div>
      </div>

      {/* Bottom accent cards — like the reference */}
      <motion.div
        className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 mt-16"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div
          className="comic-card-accent p-8 relative overflow-hidden"
          style={{ background: "var(--domain-primary)" }}
        >
          <div className="pattern-zigzag absolute inset-0" />
          <div className="relative z-10">
            <p className="text-2xl md:text-3xl font-black uppercase text-white leading-tight">
              {domain === "frontend" ? "DYNAMIC ANIMATION, MOTION DESIGN" 
                : domain === "java" ? "SCALABLE APIS, MICROSERVICES"
                : "PENETRATION TESTING, RED TEAM"}
            </p>
          </div>
          <ArrowRight className="absolute bottom-4 right-4 text-white/60" size={24} />
        </div>

        <div
          className="comic-card-accent p-8 relative overflow-hidden"
          style={{ background: "var(--domain-secondary)" }}
        >
          <div className="pattern-zigzag absolute inset-0" />
          <div className="relative z-10">
            <p className="text-2xl md:text-3xl font-black uppercase leading-tight"
              style={{ color: domain === "cyber" ? "#000" : "#0e0e0e" }}
            >
              {domain === "frontend" ? "REACT, NEXT.JS, TYPESCRIPT, TAILWIND"
                : domain === "java" ? "SPRING BOOT, HIBERNATE, DOCKER"
                : "LINUX, PYTHON, NMAP, BURP SUITE"}
            </p>
          </div>
          <ArrowRight
            className="absolute bottom-4 right-4 opacity-60"
            size={24}
            style={{ color: domain === "cyber" ? "#000" : "#0e0e0e" }}
          />
        </div>
      </motion.div>

    </section>
  );
}
