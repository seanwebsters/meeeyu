"use client";

import { AnimatePresence, motion } from "motion/react";
import { player, usePlayer } from "@/lib/audio/engine";
import { useNoteVisible } from "@/lib/audio/playable";
import { formatDuration } from "@/lib/utils";
import { Avatar } from "../ui/Avatar";
import { IconClose, IconPause, IconPlay } from "../icons";

/** Keeps the current note in reach when its card scrolls away. */
export function MiniPlayer() {
  const current = usePlayer((s) => s.current);
  const status = usePlayer((s) => s.status);
  const position = usePlayer((s) => Math.round(s.position * 10) / 10);
  const visible = useNoteVisible(current?.id);
  const show = current && status !== "idle" && !visible;
  const playing = status === "playing";

  return (
    <AnimatePresence>
      {show && current && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 340 }}
          className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-40 mx-auto max-w-[460px] px-3"
        >
          <div className="relative flex items-center gap-3 overflow-hidden rounded-[20px] bg-ink py-2 pl-2 pr-2 text-cream shadow-[0_14px_34px_-12px_rgba(21,19,16,0.5)]">
            <Avatar src={current.avatar} name={current.creatorName} size={38} pulse={playing} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{current.creatorName}</p>
              <p className="truncate text-[12px] text-cream/60">
                {current.title} · {formatDuration(position)} / {formatDuration(current.duration)}
              </p>
            </div>
            <button
              onClick={() => (playing ? player.pause() : player.resume())}
              aria-label={playing ? "Pause" : "Play"}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-ink active:scale-90"
            >
              {playing ? <IconPause size={16} /> : <IconPlay size={16} className="translate-x-[1px]" />}
            </button>
            <button onClick={() => player.stop()} aria-label="Close player" className="p-1.5 text-cream/60 hover:text-cream">
              <IconClose size={18} />
            </button>
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-cream/10">
              <div className="h-full bg-ember" style={{ width: `${(position / current.duration) * 100}%` }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
