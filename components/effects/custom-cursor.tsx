"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useDomain } from "@/components/providers/domain-provider";

export function CustomCursor() {
  const { domain } = useDomain();
  const [hasMoved, setHasMoved] = useState(false);
  const [initialPosition, setInitialPosition] = useState({ x: -100, y: -100 });
  const [clicking, setClicking] = useState(false);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const hasMovedRef = useRef(false);

  useEffect(() => {
    // Only show custom cursor on desktop
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (isMobile) return;

    document.body.style.cursor = "none";

    const onMove = (e: MouseEvent) => {
      // Update DOM directly for lag-free cursor
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
      if (!hasMovedRef.current) {
        hasMovedRef.current = true;
        setInitialPosition({ x: e.clientX, y: e.clientY });
        setHasMoved(true);
      }
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
  }, []);

  if (!hasMoved || !domain || typeof document === "undefined") return null;

  const cursorStyles: Record<string, React.CSSProperties> = {
    frontend: {
      width: clicking ? 16 : 20,
      height: clicking ? 16 : 20,
      borderRadius: "50%",
      background: "linear-gradient(135deg, var(--cursor-frontend-from, #a855f7), var(--cursor-frontend-to, #ec4899))",
      boxShadow: "0 0 20px var(--cursor-frontend-glow, rgba(168,85,247,0.4))",
    },
    java: {
      width: clicking ? 14 : 18,
      height: clicking ? 14 : 18,
      borderRadius: "50%",
      border: "2px solid var(--cursor-java-color, #d4a574)",
      background: "transparent",
      boxShadow: "0 0 12px var(--cursor-java-glow, rgba(212,165,116,0.3))",
    },
    cyber: {
      width: 24,
      height: 24,
      borderRadius: 0,
      background: "transparent",
      border: "1px solid var(--cursor-cyber-color, #11c114)",
      boxShadow: "0 0 8px var(--cursor-cyber-glow, rgba(17,193,20,0.4))",
    },
  };

  const transform = domain === "cyber"
    ? `translate(-50%, -50%) rotate(45deg) scale(${clicking ? 0.8 : 1})`
    : "translate(-50%, -50%)";

  return createPortal(
    <div
      ref={cursorRef}
      className="pointer-events-none fixed"
      data-testid="custom-cursor"
      style={{
        zIndex: 2147483647,
        left: initialPosition.x,
        top: initialPosition.y,
        transform,
        transition: "width 0.15s, height 0.15s, transform 0.15s",
        ...cursorStyles[domain],
      }}
    />,
    document.body
  );
}
