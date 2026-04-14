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
    const timeout = setTimeout(onComplete, 900);
    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-9998 overflow-hidden flex"
      initial={{ opacity: 1 }}
      exit={{ opacity: 1 }}
    >
      {/* Left panel slides in from left, out to left */}
      <motion.div
        className="w-1/2 h-full"
        style={{ background: "#FF4D00" }}
        initial={{ x: "-100%" }}
        animate={{ x: "0%" }}
        exit={{ x: "-100%" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="pattern-zigzag absolute inset-0 opacity-30" />
      </motion.div>
      {/* Right panel slides in from right, out to right */}
      <motion.div
        className="w-1/2 h-full"
        style={{ background: "#CCFF00" }}
        initial={{ x: "100%" }}
        animate={{ x: "0%" }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="pattern-zigzag absolute inset-0 opacity-30" />
      </motion.div>
    </motion.div>
  );
}

function JavaOverlay({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timeout = setTimeout(onComplete, 900);
    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-9998 overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 1 }}
    >
      {/* Top panel slides down, exits up */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-1/2"
        style={{ background: "#FF8C00" }}
        initial={{ y: "-100%" }}
        animate={{ y: "0%" }}
        exit={{ y: "-100%" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Bottom panel slides up, exits down */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1/2"
        style={{ background: "#FFD700" }}
        initial={{ y: "100%" }}
        animate={{ y: "0%" }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.div>
  );
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
