"use client";

import { motion, AnimatePresence } from "motion/react";
import { useDomain } from "@/components/providers/domain-provider";
import { useEffect, useRef } from "react";

function CyberOverlay({ onComplete }: { onComplete: () => void }) {
  const canvasTopRef = useRef<HTMLCanvasElement>(null);
  const canvasBottomRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasTop = canvasTopRef.current;
    const canvasBottom = canvasBottomRef.current;
    if (!canvasTop || !canvasBottom) return;
    const ctxTop = canvasTop.getContext("2d");
    const ctxBottom = canvasBottom.getContext("2d");
    if (!ctxTop || !ctxBottom) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    canvasTop.width = canvasBottom.width = w;
    canvasTop.height = canvasBottom.height = h;

    const chars = "01アイウエオカキクケコ";
    const fontSize = 16;
    const columns = Math.ceil(w / fontSize);
    const dropsDown = new Array(columns).fill(0);
    const dropsUp = new Array(columns).fill(Math.ceil(h / fontSize));
    let frame = 0;

    const draw = () => {
      const fade = frame < 10 ? 0.3 : 0.1;

      // Top-down rain
      ctxTop.fillStyle = `rgba(0, 0, 0, ${fade})`;
      ctxTop.fillRect(0, 0, w, h);
      ctxTop.fillStyle = "#00ff41";
      ctxTop.font = `${fontSize}px monospace`;
      for (let i = 0; i < dropsDown.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctxTop.fillText(ch, i * fontSize, dropsDown[i] * fontSize);
        if (dropsDown[i] * fontSize > h && Math.random() > 0.95) dropsDown[i] = 0;
        dropsDown[i]++;
      }

      // Bottom-up rain
      ctxBottom.fillStyle = `rgba(0, 0, 0, ${fade})`;
      ctxBottom.fillRect(0, 0, w, h);
      ctxBottom.fillStyle = "#00ff41";
      ctxBottom.font = `${fontSize}px monospace`;
      for (let i = 0; i < dropsUp.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctxBottom.fillText(ch, i * fontSize, dropsUp[i] * fontSize);
        if (dropsUp[i] * fontSize < 0 && Math.random() > 0.95) dropsUp[i] = Math.ceil(h / fontSize);
        dropsUp[i]--;
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
      className="fixed inset-0 z-9998"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <canvas ref={canvasTopRef} className="absolute inset-0 w-full h-full" />
      <canvas ref={canvasBottomRef} className="absolute inset-0 w-full h-full mix-blend-lighten" />
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
    onComplete();
  }, [onComplete]);

  return null;
}

export function TransitionOverlay() {
  const { isTransitioning, targetDomain, endTransition } = useDomain();

  return (
    <AnimatePresence>
      {isTransitioning && targetDomain === "cyber" && (
        <CyberOverlay key="cyber" onComplete={endTransition} />
      )}
      {isTransitioning && targetDomain === "frontend" && (
        <FrontendOverlay key="frontend" onComplete={endTransition} />
      )}
      {isTransitioning && targetDomain === "java" && (
        <JavaOverlay key="java" onComplete={endTransition} />
      )}
    </AnimatePresence>
  );
}
