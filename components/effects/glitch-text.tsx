"use client";

import { motion } from "motion/react";
import { useDomain, type Domain } from "@/components/providers/domain-provider";

export function GlitchText({
  children,
  className = "",
  as: Tag = "span",
}: {
  children: string;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
}) {
  const { domain } = useDomain();

  if (domain === "cyber") {
    return (
      <Tag className={`relative inline-block ${className}`}>
        <span className="relative z-10">{children}</span>
        <span
          aria-hidden
          className="absolute top-0 left-0 z-0 text-[#00ff41] opacity-70"
          style={{
            animation: "glitch-1 0.3s infinite linear alternate-reverse",
          }}
        >
          {children}
        </span>
        <span
          aria-hidden
          className="absolute top-0 left-0 z-0 text-[#ff0040] opacity-70"
          style={{
            animation: "glitch-2 0.3s infinite linear alternate-reverse",
          }}
        >
          {children}
        </span>
      </Tag>
    );
  }

  return <Tag className={className}>{children}</Tag>;
}

export function TypewriterText({
  text,
  className = "",
  speed = 50,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  return (
    <motion.span className={`inline-block ${className}`}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * (speed / 1000), duration: 0.01 }}
        >
          {char}
        </motion.span>
      ))}
      <motion.span
        className="inline-block w-[2px] h-[1em] bg-[#00ff41] ml-1 align-middle animate-blink"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: text.length * (speed / 1000) }}
      />
    </motion.span>
  );
}

export function InkStrokeText({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <motion.span
      className={`relative inline-block ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
      <motion.span
        className="absolute bottom-0 left-0 h-[2px] bg-[#FFD700]"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.span>
  );
}

export function DomainText({
  children,
  className = "",
  as: Tag = "span",
}: {
  children: string;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
}) {
  const { domain } = useDomain();

  if (domain === "cyber") {
    return (
      <TypewriterText text={children} className={className} />
    );
  }

  if (domain === "java") {
    return (
      <InkStrokeText className="text-[#FF8C00]">{children}</InkStrokeText>
    );
  }

  // Frontend — bouncy spring
  return (
    <motion.span
      className={`inline-block ${className}`}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      <Tag>{children}</Tag>
    </motion.span>
  );
}
