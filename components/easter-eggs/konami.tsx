"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MatrixRain } from "@/components/effects/matrix-rain";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export function KonamiCode() {
  const [sequence, setSequence] = useState<string[]>([]);
  const [activated, setActivated] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (activated) return;

      const newSeq = [...sequence, e.key].slice(-KONAMI.length);
      setSequence(newSeq);

      if (newSeq.length === KONAMI.length && newSeq.every((k, i) => k === KONAMI[i])) {
        setActivated(true);
        setSequence([]);
        setTimeout(() => setActivated(false), 5000);
      }
    },
    [sequence, activated]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {activated && (
        <motion.div
          className="fixed inset-0 z-9999 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <MatrixRain />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-matrix text-2xl font-mono font-bold text-center px-4">
              ↑↑↓↓←→←→BA
              <br />
              <span className="text-sm opacity-60">
                You&apos;ve unlocked the matrix!
              </span>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
