"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useDomain } from "@/components/providers/domain-provider";

export function CustomCursor() {
  const { domain } = useDomain();
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hasMoved, setHasMoved] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cursorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only show custom cursor on desktop
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (isMobile) return;

    document.body.style.cursor = "none";

    const onMove = (e: MouseEvent) => {
      // Update DOM directly for lag-free cursor
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      }
      setPos({ x: e.clientX, y: e.clientY });
      if (!hasMoved) setHasMoved(true);
    };
    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    return () => {
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, [hasMoved]);

  if (!mounted || !hasMoved || !domain) return null;

  const style = typeof window !== "undefined"
    ? getComputedStyle(document.documentElement)
    : null;
  const cssVar = (name: string, fallback: string) =>
    style?.getPropertyValue(name).trim() || fallback;

  const cursorStyles: Record<string, React.CSSProperties> = {
    frontend: {
      width: clicking ? 16 : 20,
      height: clicking ? 16 : 20,
      borderRadius: "50%",
      background: `linear-gradient(135deg, ${cssVar("--cursor-frontend-from", "#a855f7")}, ${cssVar("--cursor-frontend-to", "#ec4899")})`,
      boxShadow: `0 0 20px ${cssVar("--cursor-frontend-glow", "rgba(168,85,247,0.4)")}`,
    },
    java: {
      width: clicking ? 14 : 18,
      height: clicking ? 14 : 18,
      borderRadius: "50%",
      border: `2px solid ${cssVar("--cursor-java-color", "#d4a574")}`,
      background: "transparent",
      boxShadow: `0 0 12px ${cssVar("--cursor-java-glow", "rgba(212,165,116,0.3)")}`,
    },
    cyber: {
      width: 24,
      height: 24,
      borderRadius: 0,
      background: "transparent",
      border: `1px solid ${cssVar("--cursor-cyber-color", "#11c114")}`,
      boxShadow: `0 0 8px ${cssVar("--cursor-cyber-glow", "rgba(17,193,20,0.4)")}`,
      transform: `rotate(45deg) scale(${clicking ? 0.8 : 1})`,
    },
  };

  return createPortal(
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none"
      style={{
        zIndex: 2147483647,
        transform: `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`,
        transition: "width 0.15s, height 0.15s",
        ...cursorStyles[domain],
      }}
    />,
    document.body
  );
}
