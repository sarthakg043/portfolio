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
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/providers/theme-provider";

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
      suppressHydrationWarning
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
        <ThemeProvider>
          <Analytics />
          <SpeedInsights />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
