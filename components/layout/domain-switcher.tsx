"use client";

import { useDomain, type Domain } from "@/components/providers/domain-provider";
import { DOMAIN_LABELS } from "@/lib/constants";
import { motion } from "motion/react";
import { Code, Coffee, Shield } from "lucide-react";

const domainIcons: Record<Domain, React.ReactNode> = {
  frontend: <Code size={14} />,
  java: <Coffee size={14} />,
  cyber: <Shield size={14} />,
};

const domainColors: Record<Domain, string> = {
  frontend: "#FF4D00",
  java: "#FF8C00",
  cyber: "#11c114",
};

export function DomainSwitcher() {
  const { domain, transitionTo } = useDomain();

  const handleSwitch = (d: Domain) => {
    transitionTo(d);
  };

  return (
    <div className="flex items-center gap-1 rounded-full border-2 p-1" style={{ borderColor: "var(--border)", background: "rgba(14,14,14,0.8)" }}>
      {(["frontend", "java", "cyber"] as Domain[]).map((d) => (
        <button
          key={d}
          onClick={() => handleSwitch(d)}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-colors"
          style={{
            color: domain === d ? domainColors[d] : "var(--muted-foreground)",
          }}
        >
          {domain === d && (
            <motion.div
              layoutId="domain-pill"
              className="absolute inset-0 rounded-full border-2"
              style={{
                borderColor: domainColors[d],
                background: `${domainColors[d]}15`,
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
