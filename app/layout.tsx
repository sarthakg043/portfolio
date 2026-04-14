import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import {
  geistSans,
  geistMono,
  jetbrainsMono,
  playfairDisplay,
  plusJakartaSans,
} from "@/lib/fonts";
import { DomainProvider } from "@/components/providers/domain-provider";
import { LenisProvider } from "@/components/providers/lenis-provider";
import { CustomCursor } from "@/components/effects/custom-cursor";
import { TransitionOverlay } from "@/components/effects/transition-overlay";

export const metadata: Metadata = {
  title: "Sarthak Gupta — Developer Portfolio",
  description:
    "Frontend Developer | Java Backend SDE | Cybersecurity Enthusiast. Building scalable AI systems with Next.js & TypeScript.",
  keywords: [
    "Sarthak Gupta",
    "developer",
    "portfolio",
    "frontend",
    "java",
    "cybersecurity",
    "Next.js",
    "React",
  ],
  authors: [{ name: "Sarthak Gupta" }],
  openGraph: {
    title: "Sarthak Gupta — Developer Portfolio",
    description: "Frontend Developer | Java Backend SDE | Cybersecurity Enthusiast",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        jetbrainsMono.variable,
        playfairDisplay.variable,
        plusJakartaSans.variable
      )}
    >
      <body className="min-h-screen bg-background text-foreground font-sans">
        <DomainProvider>
          <LenisProvider>
            <CustomCursor />
            <TransitionOverlay />
            {children}
          </LenisProvider>
        </DomainProvider>
      </body>
    </html>
  );
}
