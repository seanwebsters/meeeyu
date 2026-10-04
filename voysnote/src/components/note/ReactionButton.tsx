"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { REACTIONS, type VoiceNote } from "@/lib/types";
import { actions, useApp } from "@/lib/store/app";
import { cx, formatCount } from "@/lib/utils";
import { IconHeart, IconHeartFill } from "../icons";

/**
 * Tap to heart. Press and hold for the full tapback tray (🔥 ❤️ 🙌 🤯 💭).
 * The count is every reaction on the note.
 */
export function ReactionButton({ note, disabled }: { note: VoiceNote; disabled?: boolean }) {
  const mine = useApp((s) => s.reactions[note.id]);
  const [open, setOpen] = useState(false);
  const [burst, setBurst] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const held = useRef(false);
  const [particles, setParticles] = useState<{ id: number; emoji: string; dx: number; rot: number; delay: number }[]>([]);

  // A little burst of the chosen emoji floating up from the button.
  const pop = (emoji: string) => {
    const base = Date.now();
    const fresh = Array.from({ length: 6 }, (_, i) => ({
      id: base + i,
      emoji,
      dx: (i - 2.5) * 12 + (Math.random() - 0.5) * 10,
      rot: (Math.random() - 0.5) * 50,
      delay: i * 40,
    }));
    setParticles((p) => [...p, ...fresh]);
    setTimeout(() => setParticles((p) => p.filter((x) => !fresh.includes(x))), 1300);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  const total = Object.values(note.reactions).reduce((a, b) => a + (b ?? 0), 0) + (mine ? 1 : 0);

  return (
    <div ref={ref} className="relative">
      <span className="pointer-events-none absolute bottom-6 left-2" aria-hidden>
        {particles.map((p) => (
          <span
            key={p.id}
            className="float-up absolute text-[18px]"
            style={{ ["--dx" as string]: `${p.dx}px`, ["--rot" as string]: `${p.rot}deg`, animationDelay: `${p.delay}ms`, opacity: 0 }}
          >
            {p.emoji}
          </span>
        ))}
      </span>
      <button
        disabled={disabled}
        onPointerDown={() => {
          held.current = false;
          hold.current = setTimeout(() => {
            held.current = true;
            setOpen(true);
          }, 450);
        }}
        onPointerUp={() => clearTimeout(hold.current)}
        onPointerLeave={() => clearTimeout(hold.current)}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => {
          if (held.current) return;
          actions.react(note.id, mine ? mine : "❤️");
          if (!mine) {
            setBurst((b) => b + 1);
            pop("❤️");
          }
        }}
        aria-label={mine ? "Remove reaction" : "Like"}
        aria-pressed={!!mine}
        className={cx(
          "flex h-9 select-none items-center gap-1.5 rounded-full px-1.5 text-[12px] tabular-nums transition-colors disabled:opacity-40",
          mine ? "text-heart" : "text-stone hover:text-ink",
        )}
      >
        <motion.span key={burst} initial={burst ? { scale: 0.6 } : false} animate={{ scale: 1 }} transition={{ type: "spring", damping: 9, stiffness: 420 }}>
          {mine && mine !== "❤️" ? <span className="text-[16px] leading-none">{mine}</span> : mine ? <IconHeartFill size={18} /> : <IconHeart size={18} />}
        </motion.span>
        {total > 0 && <span className={mine ? "text-heart" : "text-stone"}>{formatCount(total)}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ type: "spring", damping: 22, stiffness: 420 }}
            className="absolute bottom-[calc(100%+6px)] left-0 z-20 flex gap-0.5 rounded-full border border-line bg-paper p-1 shadow-[0_12px_30px_-10px_rgba(29,28,25,0.3)]"
          >
            {REACTIONS.map((k, i) => (
              <motion.button
                key={k}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.03, type: "spring", damping: 14, stiffness: 400 }}
                whileTap={{ scale: 1.35 }}
                onClick={() => {
                  if (mine !== k) pop(k);
                  actions.react(note.id, k);
                  setOpen(false);
                }}
                aria-label={`React ${k}`}
                className={cx(
                  "flex h-9 w-9 items-center justify-center rounded-full text-[19px] transition-colors",
                  mine === k ? "bg-mist" : "hover:bg-mist/70",
                )}
              >
                {k}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
