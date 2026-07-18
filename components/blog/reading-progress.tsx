"use client";

import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function updateProgress() {
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(distance <= 0 ? 0 : Math.min((window.scrollY / distance) * 100, 100));
    }

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent" aria-hidden="true">
      <div className="h-full bg-emerald-500 transition-[width] duration-100" style={{ width: `${progress}%` }} />
    </div>
  );
}

