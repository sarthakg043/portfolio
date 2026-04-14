import type { Domain } from "@/components/providers/domain-provider";

export const DOMAIN_LABELS: Record<Domain, string> = {
  frontend: "Frontend",
  java: "Java Backend",
  cyber: "Cybersecurity",
};

export const DOMAIN_FONTS: Record<Domain, string> = {
  frontend: "font-display",
  java: "font-serif",
  cyber: "font-mono",
};

export const DOMAIN_HEADING_FONTS: Record<Domain, string> = {
  frontend: "font-display",
  java: "font-serif italic",
  cyber: "font-mono",
};

export const DOMAIN_GRADIENT_CLASS: Record<Domain, string> = {
  frontend: "text-gradient-frontend",
  java: "text-gradient-java",
  cyber: "text-gradient-cyber",
};

export const GITHUB_USERNAME = "sarthakg043";
export const GITHUB_API_BASE = "https://api.github.com";
export const REVALIDATE_SECONDS = 3600; // 1 hour ISR
