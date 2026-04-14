"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export type Domain = "frontend" | "java" | "cyber";

interface DomainContextValue {
  domain: Domain | null;
  setDomain: (d: Domain) => void;
  isTransitioning: boolean;
  targetDomain: Domain | null;
  transitionTo: (d: Domain) => void;
  endTransition: () => void;
}

const DomainContext = createContext<DomainContextValue | null>(null);

const STORAGE_KEY = "portfolio-domain";
const VALID_DOMAINS: Domain[] = ["frontend", "java", "cyber"];

export function DomainProvider({ children }: { children: ReactNode }) {
  const [domain, setDomainState] = useState<Domain | null>(null);
  const [targetDomain, setTargetDomain] = useState<Domain | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage, falling back to URL path
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Domain | null;
    if (stored && VALID_DOMAINS.includes(stored)) {
      setDomainState(stored);
    } else {
      // Extract domain from URL as fallback (e.g. /portfolio/frontend)
      const segments = window.location.pathname.split("/");
      const urlDomain = segments[2] as Domain | undefined;
      if (urlDomain && VALID_DOMAINS.includes(urlDomain)) {
        setDomainState(urlDomain);
      }
    }
    setMounted(true);
  }, []);

  // Sync data-domain attribute, localStorage, and URL when domain changes
  useEffect(() => {
    if (!mounted) return;
    if (domain) {
      document.documentElement.setAttribute("data-domain", domain);
      localStorage.setItem(STORAGE_KEY, domain);
      // Keep URL in sync without triggering navigation
      if (window.location.pathname !== `/portfolio/${domain}`) {
        window.history.replaceState(null, "", `/portfolio/${domain}`);
      }
    } else {
      document.documentElement.removeAttribute("data-domain");
    }
  }, [domain, mounted]);

  const setDomain = useCallback((d: Domain) => {
    setDomainState(d);
  }, []);

  const endTransition = useCallback(() => {
    setIsTransitioning(false);
    setTargetDomain(null);
  }, []);

  const transitionTo = useCallback(
    (d: Domain) => {
      if (d === domain || isTransitioning) return;
      setIsTransitioning(true);
      setTargetDomain(d);
      // Delay domain change until overlay has fully covered the screen (~400ms)
      setTimeout(() => {
        setDomainState(d);
      }, 400);
    },
    [domain, isTransitioning]
  );

  return (
    <DomainContext.Provider
      value={{ domain, setDomain, isTransitioning, targetDomain, transitionTo, endTransition }}
    >
      {children}
    </DomainContext.Provider>
  );
}

export function useDomain() {
  const ctx = useContext(DomainContext);
  if (!ctx) throw new Error("useDomain must be used within DomainProvider");
  return ctx;
}
