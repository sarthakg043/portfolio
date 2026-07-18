"use client";

import { DomainProvider } from "@/components/providers/domain-provider";
import { LenisProvider } from "@/components/providers/lenis-provider";
import { CustomCursor } from "@/components/effects/custom-cursor";
import { TransitionOverlay } from "@/components/effects/transition-overlay";

export function PortfolioProviders({ children }: { children: React.ReactNode }) {
  return (
    <DomainProvider>
      <LenisProvider>
        <CustomCursor />
        <TransitionOverlay />
        {children}
      </LenisProvider>
    </DomainProvider>
  );
}
