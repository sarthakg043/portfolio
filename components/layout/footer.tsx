"use client";

import { useDomain } from "@/components/providers/domain-provider";
import config from "@/data/portfolio-config.json";
import { Mail, Heart } from "lucide-react";
import { GithubIcon, LinkedinIcon, XTwitterIcon } from "@/components/icons/brands";

export function Footer() {
  const { domain } = useDomain();

  return (
    <footer className="relative border-t-2 py-12 px-4 md:px-8" style={{ borderColor: "var(--border)" }}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()}</span>
          <span className="font-black text-foreground uppercase">
            {config.personal.name}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            Made with <Heart size={12} className="text-red-500 fill-red-500" /> & code
          </span>
        </div>

        <div className="flex items-center gap-4">
          {[
            { Icon: GithubIcon, href: config.socials.github },
            { Icon: LinkedinIcon, href: config.socials.linkedin },
            { Icon: XTwitterIcon, href: config.socials.twitter },
            { Icon: Mail, href: `mailto:${config.personal.email}` },
          ].map(({ Icon, href }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon size={16} />
            </a>
          ))}
        </div>
      </div>

      {/* Secret footer area */}
      <div className="mt-12 text-center" data-secret-footer>
        <pre className="text-[8px] leading-tight text-muted-foreground/0 hover:text-muted-foreground/30 transition-colors duration-1000 select-none">
          {`
    ╔══════════════════════════════════════╗
    ║   You found the secret!              ║
    ║                                      ║
    ║   > console.log("Hello, curious!")   ║
    ║                                      ║
    ║   Built with Next.js + ❤️             ║
    ╚══════════════════════════════════════╝
          `}
        </pre>
      </div>
    </footer>
  );
}
