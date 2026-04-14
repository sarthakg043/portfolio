"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useDomain } from "@/components/providers/domain-provider";

const COMMANDS: Record<string, string> = {
  whoami: "sarthak_gupta — Developer, Builder, Breaker",
  help: "Available commands: whoami, ls, pwd, date, hack, sudo, clear, exit",
  ls: "projects/  skills/  experience/  secrets/  .env (permission denied)",
  pwd: "/home/sarthak/portfolio",
  date: new Date().toLocaleString(),
  hack: "Initializing hack sequence...\n██████████████░░░░░░ 70%\nAccess denied. Nice try! 😄",
  "hack nasa": "ERROR 403: NASA firewalls are too strong.\nAlso, don't do that. 🚀",
  "sudo rm -rf /": "🚨 WHAT ARE YOU DOING?!\nJust kidding, this is a fake terminal.\nYour system is safe. 😅",
  sudo: "sarthak is not in the sudoers file. This incident will be reported. 🤡",
  "cat /etc/passwd": "Nice try, skid. 🔒",
  neofetch:
    "  ┌─────────────────┐\n  │  Sarthak Gupta   │\n  │  OS: Next.js 16  │\n  │  Shell: React 19 │\n  │  Theme: Custom    │\n  └─────────────────┘",
  "": "",
};

export function MiniTerminal() {
  const { domain } = useDomain();
  const [open, setOpen] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [history, setHistory] = useState<{ cmd: string; output: string }[]>([
    { cmd: "", output: "Welcome to SG Terminal v1.0 — Type 'help' for commands" },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track rapid clicks on the logo
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-logo]")) {
        setClickCount((c) => {
          const next = c + 1;
          if (next >= 5) {
            setOpen(true);
            return 0;
          }
          return next;
        });

        if (clickTimer.current) clearTimeout(clickTimer.current);
        clickTimer.current = setTimeout(() => setClickCount(0), 2000);
      }
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // Also listen for "sudo" typed anywhere
  useEffect(() => {
    let buffer = "";
    const handleKey = (e: KeyboardEvent) => {
      if (open) return;
      buffer += e.key;
      if (buffer.length > 20) buffer = buffer.slice(-20);
      if (buffer.includes("sudo")) {
        setOpen(true);
        setHistory((h) => [
          ...h,
          { cmd: "sudo", output: COMMANDS.sudo },
        ]);
        buffer = "";
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const runCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim().toLowerCase();
      if (trimmed === "clear") {
        setHistory([]);
        return;
      }
      if (trimmed === "exit") {
        setOpen(false);
        return;
      }

      const output =
        COMMANDS[trimmed] ??
        `Command not found: ${trimmed}. Type 'help' for available commands.`;
      setHistory((h) => [...h, { cmd: trimmed, output }]);
    },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runCommand(input);
    setInput("");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed bottom-4 right-4 z-9998 w-105 max-w-[calc(100vw-2rem)] rounded-xl overflow-hidden border shadow-2xl"
          style={{
            borderColor: domain === "cyber" ? "var(--terminal-border-cyber)" : "var(--border)",
            background: "var(--terminal-bg)",
          }}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary border-b border-white/5">
            <div className="flex gap-1.5">
              <button
                onClick={() => setOpen(false)}
                className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400"
              />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono ml-2">
              sg-terminal — zsh
            </span>
          </div>

          {/* Terminal body */}
          <div className="h-64 overflow-y-auto p-4 font-mono text-xs scrollbar-hidden">
            {history.map((entry, i) => (
              <div key={i} className="mb-2">
                {entry.cmd && (
                  <div className="flex items-center gap-1">
                    <span className="text-matrix text-xs font-mono">$</span>
                    <span className="text-gray-300">{entry.cmd}</span>
                  </div>
                )}
                <pre className="text-gray-400 whitespace-pre-wrap mt-0.5">
                  {entry.output}
                </pre>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 border-t border-white/5"
          >
            <span className="text-matrix text-xs font-mono">$</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent text-xs font-mono text-gray-200 outline-none placeholder:text-gray-600"
              placeholder="Type a command..."
              autoComplete="off"
              spellCheck={false}
            />
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
