"use client";

import { motion, AnimatePresence } from "motion/react";
import { useDomain, type Domain } from "@/components/providers/domain-provider";
import { useEffect, useRef, useState } from "react";

function CyberOverlay({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "01アイウエオ";
    const fontSize = 16;
    const columns = Math.ceil(canvas.width / fontSize);
    const drops = new Array(columns).fill(0);
    let frame = 0;

    const draw = () => {
      ctx.fillStyle = `rgba(0, 0, 0, ${frame < 10 ? 0.3 : 0.1})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff41";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.95)
          drops[i] = 0;
        drops[i]++;
      }
      frame++;
    };

    const interval = setInterval(draw, 30);
    const timeout = setTimeout(onComplete, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9998]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </motion.div>
  );
}

function FrontendOverlay({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timeout = setTimeout(onComplete, 1000);
    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9998] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            background: `radial-gradient(circle, ${
              ["#FF4D00", "#CCFF00", "#FF4D00", "#CCFF00", "#FF4D00"][i]
            }88, transparent)`,
            width: "150vmax",
            height: "150vmax",
          }}
          initial={{
            x: `${Math.random() * 100}vw`,
            y: `${Math.random() * 100}vh`,
            scale: 0,
            opacity: 0,
          }}
          animate={{
            scale: 1,
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 0.8,
            delay: i * 0.08,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      ))}
    </motion.div>
  );
}

function JavaOverlay({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timeout = setTimeout(onComplete, 1000);
    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9998] bg-[#0e0c08]"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, times: [0, 0.3, 0.7, 1] }}
    />
  );
}

export function TransitionOverlay() {
  const { isTransitioning, domain } = useDomain();
  const [targetDomain, setTargetDomain] = useState<Domain | null>(null);

  useEffect(() => {
    if (isTransitioning && domain) {
      setTargetDomain(domain);
    }
  }, [isTransitioning, domain]);

  const handleComplete = () => {
    setTargetDomain(null);
  };

  return (
    <AnimatePresence>
      {isTransitioning && targetDomain === "cyber" && (
        <CyberOverlay key="cyber" onComplete={handleComplete} />
      )}
      {isTransitioning && targetDomain === "frontend" && (
        <FrontendOverlay key="frontend" onComplete={handleComplete} />
      )}
      {isTransitioning && targetDomain === "java" && (
        <JavaOverlay key="java" onComplete={handleComplete} />
      )}
    </AnimatePresence>
  );
}
