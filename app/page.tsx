"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDomain } from "@/components/providers/domain-provider";
import { LandingScene } from "@/components/landing/landing-scene";

export default function Home() {
  const { domain } = useDomain();
  const router = useRouter();

  // If the user navigates back to "/" while a domain is already active in
  // context (e.g. they hit the browser back button from the portfolio),
  // send them straight to their portfolio. This effect is safe because
  // LandingScene no longer calls setDomain — it only calls router.push —
  // so clicking a portal card never triggers this effect, eliminating the
  // double-navigation that previously caused the blank screen.
  useEffect(() => {
    if (domain) {
      router.replace(`/portfolio/${domain}`);
    }
  }, [domain, router]);

  // Hide landing while the redirect is in flight
  if (domain) return null;

  return <LandingScene />;
}