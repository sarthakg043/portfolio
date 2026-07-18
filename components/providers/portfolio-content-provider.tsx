"use client";

import { createContext, useContext } from "react";
import type { PortfolioContent } from "@/lib/portfolio/types";

const PortfolioContentContext = createContext<PortfolioContent | null>(null);

export function PortfolioContentProvider({
  content,
  children,
}: {
  content: PortfolioContent;
  children: React.ReactNode;
}) {
  return (
    <PortfolioContentContext.Provider value={content}>
      {children}
    </PortfolioContentContext.Provider>
  );
}

export function usePortfolioContent(): PortfolioContent {
  const content = useContext(PortfolioContentContext);
  if (!content) throw new Error("usePortfolioContent must be used inside PortfolioContentProvider.");
  return content;
}
