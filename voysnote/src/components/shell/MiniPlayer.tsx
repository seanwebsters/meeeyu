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
          className="fixed inset-x-0 bottom-[calc(70px+env(safe-area-inset-bottom))] z-40 mx-auto max-w-[460px] px-3"
        >
          <div className="card relative flex items-center gap-3 overflow-hidden rounded-[18px] py-2 pl-2 pr-2 shadow-[0_14px_34px_-14px_rgba(29,28,25,0.35)]">
            <Avatar src={current.avatar} name={current.creatorName} size={40} square />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{current.title}</p>
              <p className="truncate text-[12px] text-stone">
                {current.creatorName} · {formatDuration(position)} / {formatDuration(current.duration)}
              </p>
            </div>
            <button
              onClick={() => (playing ? player.pause() : player.resume())}
              aria-label={playing ? "Pause" : "Play"}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-cream active:scale-90"
            >
              {playing ? <IconPause size={15} /> : <IconPlay size={15} className="translate-x-[1px]" />}
            </button>
            <button onClick={() => player.stop()} aria-label="Close player" className="p-1.5 text-stone hover:text-ink">
              <IconClose size={18} />
            </button>
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-mist">
              <div className="h-full bg-accent" style={{ width: `${(position / current.duration) * 100}%` }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
