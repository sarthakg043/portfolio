"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { type Domain } from "@/components/providers/domain-provider";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

const portals: {
  domain: Domain;
  title: string;
  subtitle: string;
  bgVar: string;
  textVar: string;
  subtitleVar: string;
  icon: string;
}[] = [
  {
    domain: "frontend",
    title: "Frontend",
    subtitle: "Pixel-Perfect Experiences",
    bgVar: "var(--brand-frontend-primary)",
    textVar: "var(--on-brand-dark)",
    subtitleVar: "var(--on-brand-dark-muted)",
    icon: "🎨",
  },
  {
    domain: "java",
    title: "Java Backend",
    subtitle: "Scalable Architecture",
    bgVar: "var(--brand-java-secondary)",
    textVar: "var(--on-brand-light)",
    subtitleVar: "var(--on-brand-light-muted)",
    icon: "☕",
  },
  {
    domain: "cyber",
    title: "Cybersecurity",
    subtitle: "Hack & Secure",
    bgVar: "var(--brand-cyber-primary)",
    textVar: "var(--on-brand-dark)",
    subtitleVar: "var(--on-brand-dark-muted)",
    icon: "🔒",
  },
];

function PortalCard({
  portal,
  onSelect,
}: {
  portal: (typeof portals)[0];
  onSelect: (d: Domain) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-150, 150], [8, -8]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [-150, 150], [-8, 8]), {
    stiffness: 300,
    damping: 30,
  });

  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
    setHovered(false);
  };

  return (
    <motion.div
      ref={ref}
      className="relative cursor-pointer group"
      style={{ perspective: 800, rotateX, rotateY }}
      onMouseMove={handleMouse}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
      onClick={() => onSelect(portal.domain)}
      whileTap={{ scale: 0.97 }}
    >
      <motion.div
        className="relative w-full h-[380px] md:h-[460px] overflow-hidden comic-card-accent"
        style={{ background: portal.bgVar }}
        animate={{ y: hovered ? -8 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Pattern overlay */}
        <div className="pattern-zigzag absolute inset-0" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 relative z-10">
          {/* Icon */}
          <motion.div
            className="text-7xl mb-6"
            animate={{
              scale: hovered ? 1.2 : 1,
              y: hovered ? -8 : 0,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {portal.icon}
          </motion.div>

          {/* Title */}
          <h3
            className="text-3xl md:text-4xl font-black uppercase text-center mb-2"
            style={{ color: portal.textVar }}
          >
            {portal.title}
          </h3>

          {/* Subtitle */}
          <p
            className="text-sm uppercase tracking-[0.2em] font-bold text-center"
            style={{ color: portal.subtitleVar }}
          >
            {portal.subtitle}
          </p>

          {/* Enter button */}
          <motion.div
            className="mt-8 px-6 py-3 rounded-full border-2 text-sm font-black uppercase tracking-wider flex items-center gap-2"
            style={{
              borderColor: portal.textVar,
              color: portal.textVar,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: hovered ? 1 : 0,
              y: hovered ? 0 : 10,
            }}
            transition={{ duration: 0.3 }}
          >
            Enter <ArrowRight size={16} />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function LandingScene() {
  const router = useRouter();

  // Only navigate — do NOT call setDomain here.
  // Setting domain here would trigger the useEffect in app/page.tsx
  // (which also redirects when domain changes), causing a double navigation
  // that results in a blank screen. PortfolioClient sets the domain from
  // the URL param after the page loads.
  const handleSelect = (d: Domain) => {
    router.push(`/portfolio/${d}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Header */}
      <motion.div
        className="text-center mb-16 relative z-10"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.h1
          className="text-5xl md:text-7xl lg:text-8xl font-black text-foreground mb-2 tracking-tight uppercase"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          Sarthak Gupta
        </motion.h1>
        <motion.p
          className="text-muted-foreground text-lg md:text-xl tracking-[0.3em] uppercase font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Choose your path
        </motion.p>
      </motion.div>

      {/* Portal cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl w-full relative z-10"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {portals.map((portal) => (
          <PortalCard
            key={portal.domain}
            portal={portal}
            onSelect={handleSelect}
          />
        ))}
      </motion.div>

      {/* Bottom hint */}
      <motion.p
        className="mt-12 text-xs text-muted-foreground/50 tracking-[0.3em] uppercase font-bold relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        Click a portal to begin • You can switch anytime
      </motion.p>
    </div>
  );
}