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
  transitionTo: (d: Domain) => void;
}

const DomainContext = createContext<DomainContextValue | null>(null);

const STORAGE_KEY = "portfolio-domain";

export function DomainProvider({ children }: { children: ReactNode }) {
  const [domain, setDomainState] = useState<Domain | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Domain | null;
    if (stored && ["frontend", "java", "cyber"].includes(stored)) {
      setDomainState(stored);
    }
    setMounted(true);
  }, []);

  // Sync data-domain attribute + localStorage
  useEffect(() => {
    if (!mounted) return;
    if (domain) {
      document.documentElement.setAttribute("data-domain", domain);
      localStorage.setItem(STORAGE_KEY, domain);
    } else {
      document.documentElement.removeAttribute("data-domain");
    }
  }, [domain, mounted]);

  const setDomain = useCallback((d: Domain) => {
    setDomainState(d);
  }, []);

  const transitionTo = useCallback(
    (d: Domain) => {
      if (d === domain || isTransitioning) return;
      setIsTransitioning(true);
      // Transition overlay will read isTransitioning and targetDomain
      // After overlay animation completes (~1200ms), we apply the domain
      setTimeout(() => {
        setDomainState(d);
      }, 600);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 1200);
    },
    [domain, isTransitioning]
  );

  return (
    <DomainContext.Provider
      value={{ domain, setDomain, isTransitioning, transitionTo }}
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
