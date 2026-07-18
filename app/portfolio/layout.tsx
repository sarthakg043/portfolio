import { PortfolioProviders } from "@/components/providers/portfolio-providers";

export default function PortfolioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PortfolioProviders>{children}</PortfolioProviders>;
}
