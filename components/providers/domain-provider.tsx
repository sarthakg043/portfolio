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

const VALID_DOMAINS: Domain[] = ["frontend", "java", "cyber"];

export function DomainProvider({ children }: { children: ReactNode }) {
  const [domain, setDomainState] = useState<Domain | null>(null);
  const [targetDomain, setTargetDomain] = useState<Domain | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Initialize domain from the current URL on first mount (no localStorage)
  useEffect(() => {
    const segments = window.location.pathname.split("/");
    const urlDomain = segments[2] as Domain | undefined;
    if (urlDomain && VALID_DOMAINS.includes(urlDomain)) {
      setDomainState(urlDomain);
    }
  }, []);

  // Sync the CSS data-domain attribute and URL whenever domain changes
  useEffect(() => {
    if (domain) {
      document.documentElement.setAttribute("data-domain", domain);

      // Keep the URL slug in sync only when already on the portfolio route
      // (avoids accidentally rewriting the landing "/" path)
      if (
        window.location.pathname.startsWith("/portfolio") &&
        window.location.pathname !== `/portfolio/${domain}`
      ) {
        window.history.replaceState(null, "", `/portfolio/${domain}`);
      }
    } else {
      document.documentElement.removeAttribute("data-domain");
    }
  }, [domain]);

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
      // Delay domain swap until the overlay has covered the screen (~400 ms)
      setTimeout(() => {
        setDomainState(d);
      }, 400);
    },
    [domain, isTransitioning]
  );

  return (
    <DomainContext.Provider
      value={{
        domain,
        setDomain,
        isTransitioning,
        targetDomain,
        transitionTo,
        endTransition,
      }}
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