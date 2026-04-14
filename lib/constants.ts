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

/** Per-domain colors for UI that renders all three at once (e.g. DomainSwitcher).
 *  Values reference CSS custom properties so the single source of truth stays in globals.css. */
export const DOMAIN_COLORS: Record<Domain, { color: string; faint: string }> = {
  frontend: {
    color: "var(--brand-frontend-primary)",
    faint: "var(--brand-frontend-primary-faint)",
  },
  java: {
    color: "var(--brand-java-primary)",
    faint: "var(--brand-java-primary-faint)",
  },
  cyber: {
    color: "var(--brand-cyber-primary)",
    faint: "var(--brand-cyber-primary-faint)",
  },
};

/** Chart colors used in external image URLs (cannot be CSS variable references).
 *  Keep in sync with --chart-domain-hex values in globals.css. */
export const DOMAIN_CHART_HEX: Record<Domain, string> = {
  frontend: "FF4D00",
  java: "FF8C00",
  cyber: "11c114",
};

export const GITHUB_USERNAME = "sarthakg043";
export const GITHUB_API_BASE = "https://api.github.com";
export const REVALIDATE_SECONDS = 3600; // 1 hour ISR
