"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";

export function IdleDetector() {
  const [showMessage, setShowMessage] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setShowMessage(false);
    timer.current = setTimeout(() => {
      setShowMessage(true);
      // Auto-hide after 4 seconds
      setTimeout(() => setShowMessage(false), 4000);
    }, 30000); // 30 seconds idle
  }, []);

  useEffect(() => {
    const events = ["mousemove", "keydown", "scroll", "touchstart", "click"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [resetTimer]);

  return (
    <AnimatePresence>
      {showMessage && (
        <motion.div
          className="fixed top-20 right-4 z-9997 max-w-xs p-4 rounded-xl border shadow-lg backdrop-blur-sm"
          style={{
            borderColor: "var(--domain-primary)",
            background: "rgba(10, 10, 15, 0.9)",
          }}
          initial={{ opacity: 0, x: 50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <p className="text-sm text-foreground font-medium mb-1">
            Still exploring? 👀
          </p>
          <p className="text-xs text-muted-foreground">
            Try the Konami code or click the logo 5 times for surprises!
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
