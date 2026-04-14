"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDomain } from "@/components/providers/domain-provider";

// /portfolio (no domain in URL) — redirect to /portfolio/[domain] or landing
export default function PortfolioRedirect() {
  const { domain } = useDomain();
  const router = useRouter();

  useEffect(() => {
    if (domain) {
      router.replace(`/portfolio/${domain}`);
    } else {
      router.replace("/");
    }
  }, [domain, router]);

  return null;
}
