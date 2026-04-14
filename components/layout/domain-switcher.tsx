"use client";

import { useDomain, type Domain } from "@/components/providers/domain-provider";
import { DOMAIN_LABELS, DOMAIN_COLORS } from "@/lib/constants";
import { motion } from "motion/react";
import { Code, Coffee, Shield } from "lucide-react";

const domainIcons: Record<Domain, React.ReactNode> = {
  frontend: <Code size={14} />,
  java: <Coffee size={14} />,
  cyber: <Shield size={14} />,
};

export function DomainSwitcher() {
  const { domain, transitionTo } = useDomain();

  const handleSwitch = (d: Domain) => {
    transitionTo(d);
  };

  return (
    <div
      className="flex items-center gap-1 rounded-full border-2 p-1"
      style={{ borderColor: "var(--border)", background: "var(--overlay-dark-mid)" }}
    >
      {(["frontend", "java", "cyber"] as Domain[]).map((d) => (
        <button
          key={d}
          onClick={() => handleSwitch(d)}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-colors"
          style={{
            color: domain === d ? DOMAIN_COLORS[d].color : "var(--muted-foreground)",
          }}
        >
          {domain === d && (
            <motion.div
              layoutId="domain-pill"
              className="absolute inset-0 rounded-full border-2"
              style={{
                borderColor: DOMAIN_COLORS[d].color,
                background: DOMAIN_COLORS[d].faint,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            {domainIcons[d]}
            <span className="hidden sm:inline">{DOMAIN_LABELS[d]}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
