export const PORTFOLIO_DOMAINS = ["frontend", "java", "cyber"] as const;
export type PortfolioDomain = (typeof PORTFOLIO_DOMAINS)[number];
export type SkillDomain = PortfolioDomain | "common";

export type PortfolioContent = {
  personal: {
    name: string;
    tagline: string;
    email: string;
    avatar: string;
    resumePdf: string;
    resumeMap: Record<PortfolioDomain, string>;
    location: string;
  };
  socials: {
    github: string;
    githubOrg: string;
    linkedin: string;
    twitter: string;
  };
  about: Record<PortfolioDomain, string>;
  domainTaglines: Record<PortfolioDomain, string>;
  skills: Record<SkillDomain, string[]>;
  experience: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    period: string;
    description: string;
    tags: string[];
    domain: PortfolioDomain[];
  }>;
  repos: Array<{
    id: string;
    name: string;
    owner: string;
    description: string;
    repositoryUrl: string | null;
    domain: PortfolioDomain[];
    image: string | null;
    demoUrl: string | null;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    year: string;
    url: string | null;
    domain: PortfolioDomain[];
  }>;
  linkedin: {
    stats: {
      followers: string;
      connections: string;
      headline: string;
    };
    posts: string[];
  };
  github: {
    username: string;
    showContributions: boolean;
    showLanguages: boolean;
  };
};
