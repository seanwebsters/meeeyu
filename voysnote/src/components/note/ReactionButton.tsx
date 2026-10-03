"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { REACTIONS, type ReactionKind, type VoiceNote } from "@/lib/types";
import { actions, useApp } from "@/lib/store/app";
import { cx, formatCount } from "@/lib/utils";

/** iMessage-style tapback: tap to open a small tray, pick one, tap again to undo. */
export function ReactionButton({ note, disabled }: { note: VoiceNote; disabled?: boolean }) {
  const mine = useApp((s) => s.reactions[note.id]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  const counts = { ...note.reactions };
  if (mine) counts[mine] = (counts[mine] ?? 0) + 1;
  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
  const top = (Object.entries(counts) as [ReactionKind, number][])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  return (
    <div ref={ref} className="relative">
      <button
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-label="React"
        aria-expanded={open}
        className={cx(
          "flex h-8 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium tabular-nums transition-colors disabled:opacity-40",
          mine ? "bg-ink text-cream" : "text-stone hover:bg-mist",
        )}
      >
        {top.length ? (
          <span className="flex -space-x-0.5 text-[13px] leading-none">
            {top.map((k) => (
              <span key={k}>{k}</span>
            ))}
          </span>
        ) : (
          <span className="text-[14px] grayscale">🔥</span>
        )}
        {total > 0 && <span>{formatCount(total)}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ type: "spring", damping: 22, stiffness: 420 }}
            className="absolute bottom-[calc(100%+6px)] left-0 z-20 flex gap-0.5 rounded-full border border-line bg-paper p-1 shadow-[0_12px_30px_-10px_rgba(21,19,16,0.3)]"
          >
            {REACTIONS.map((k, i) => (
              <motion.button
                key={k}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.03, type: "spring", damping: 14, stiffness: 400 }}
                whileTap={{ scale: 1.35 }}
                onClick={() => {
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
