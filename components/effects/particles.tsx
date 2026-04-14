"use client";

import { useEffect, useRef } from "react";
import { useDomain } from "@/components/providers/domain-provider";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

const domainParticleConfig = {
  frontend: {
    colors: ["#a855f7", "#ec4899", "#06b6d4", "#8b5cf6"],
    count: 50,
    speed: 0.3,
    maxSize: 4,
  },
  java: {
    colors: ["#d4a574", "#c9a84c", "#8b6f47", "#f5e6d3"],
    count: 30,
    speed: 0.15,
    maxSize: 3,
  },
  cyber: {
    colors: ["#00ff41", "#00cc33", "#009926"],
    count: 60,
    speed: 0.5,
    maxSize: 2,
  },
};

export function Particles({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { domain } = useDomain();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !domain) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const config = domainParticleConfig[domain];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = Array.from({ length: config.count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * config.speed,
      vy: (Math.random() - 0.5) * config.speed,
      size: Math.random() * config.maxSize + 1,
      alpha: Math.random() * 0.5 + 0.1,
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
    }));

    let animId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }

      // Draw connections for cyber domain
      if (domain === "cyber") {
        ctx.globalAlpha = 0.06;
        ctx.strokeStyle = "#00ff41";
        ctx.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [domain]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
}
