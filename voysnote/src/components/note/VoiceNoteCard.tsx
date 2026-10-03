"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Creator, Sponsor, VoiceNote } from "@/lib/types";
import type { NoteAccess } from "@/lib/access";
import { captionAt, player, usePlayer, type Playable } from "@/lib/audio/engine";
import { noteToPlayable, setNoteVisible } from "@/lib/audio/playable";
import { actions, useApp } from "@/lib/store/app";
import { useNow } from "@/lib/store/clock";
import { clockTime, cx, formatDuration, relativeFuture, relativeShort } from "@/lib/utils";
import { Avatar } from "../ui/Avatar";
import { Waveform } from "../ui/Waveform";
import { IconBookmark, IconBookmarkFill, IconLock, IconPause, IconPlay, IconShare, Verified } from "../icons";
import { ReactionButton } from "./ReactionButton";
import { openShare } from "./ShareSheet";
import { toast } from "../ui/Toast";

interface Props {
  note: VoiceNote;
  creator: Creator;
  access?: NoteAccess;
  sponsor?: Sponsor | null;
  showHeader?: boolean;
  queue?: Playable[];
  /** "chat" sits in the group with an avatar gutter; "list" is standalone. */
  variant?: "chat" | "list";
  timeStyle?: "clock" | "relative";
}

export function VoiceNoteCard({ note, creator, access = { state: "open" }, sponsor, showHeader = true, queue, variant = "chat", timeStyle = "clock" }: Props) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const isCurrent = usePlayer((s) => s.current?.id === note.id);
  const status = usePlayer((s) => (s.current?.id === note.id ? s.status : "idle"));
  // Quantise so idle cards don't re-render on every animation frame.
  const position = usePlayer((s) => (s.current?.id === note.id ? Math.round(s.position * 10) / 10 : 0));
  const saved = useApp((s) => s.saved.some((x) => x.noteId === note.id));
  const now = useNow();
  const [justArrived] = useState(() => Date.now() - new Date(note.publishedAt).getTime() < 8000);

  const locked = access.state === "locked";
  const playing = status === "playing";
  const active = isCurrent && status !== "idle";
  const progress = active ? position / note.duration : 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setNoteVisible(note.id, e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => {
      io.disconnect();
      setNoteVisible(note.id, false);
    };
  }, [note.id]);

  const play = () => {
    if (locked) return router.push("/plus");
    player.toggle(noteToPlayable(note, creator), { queue });
  };

  const lockLabel =
    access.state === "locked"
      ? access.reason === "early"
        ? `Early access · everyone ${note.earlyAccessUntil ? relativeFuture(note.earlyAccessUntil, now) : "soon"}`
        : access.reason === "archive"
          ? "In the archive · VoysNote+"
          : "VoysNote+ exclusive"
      : null;

  const time = timeStyle === "clock" ? clockTime(note.publishedAt) : relativeShort(note.publishedAt, now);

  return (
    <motion.div
      ref={ref}
      layout="position"
      initial={justArrived ? { opacity: 0, y: 18, scale: 0.97 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 26, stiffness: 260 }}
      className={cx("flex gap-2.5", variant === "chat" && !showHeader && "-mt-1.5")}
    >
      {variant === "chat" && (
        <div className="w-9 shrink-0 pt-5">
          {showHeader && (
            <Link href={`/c/${creator.username}`} aria-label={creator.name}>
              <Avatar src={creator.avatar} name={creator.name} tone={creator.tone} size={36} pulse={playing} />
            </Link>
          )}
        </div>
      )}

      <div className="min-w-0 flex-1">
        {showHeader && (
          <div className="mb-1 flex items-center gap-1.5 pl-1">
            {variant === "list" && (
              <Link href={`/c/${creator.username}`} className="mr-1">
                <Avatar src={creator.avatar} name={creator.name} tone={creator.tone} size={28} pulse={playing} />
              </Link>
            )}
            <Link href={`/c/${creator.username}`} className="truncate text-[14px] font-semibold tracking-[-0.01em]">
              {creator.name}
            </Link>
            {creator.verified && <Verified className="shrink-0 text-ink" size={14} />}
            <span className="shrink-0 text-[12px] text-stone">· {time}</span>
          </div>
        )}

        <motion.div
          layout
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className={cx(
            "relative max-w-[340px] overflow-hidden rounded-[22px] border bg-paper transition-[box-shadow,border-color] duration-300",
            showHeader && variant === "chat" && "rounded-tl-[8px]",
            active ? "border-ink/10 shadow-[0_10px_30px_-12px_rgba(21,19,16,0.28)]" : "border-line/70 shadow-[0_1px_0_rgba(21,19,16,0.03)]",
          )}
        >
          <div className={cx("transition-[padding] duration-300", active ? "px-4 pb-4 pt-3.5" : "px-3.5 pb-3 pt-3")}>
            <div className="mb-2 flex items-start justify-between gap-2">
              <p
                className={cx(
                  "font-serif leading-[1.15] tracking-[-0.01em] text-ink transition-[font-size] duration-300",
                  active ? "text-[21px]" : "text-[18px]",
                )}
              >
                {note.title}
              </p>
              {access.state === "open" && access.early && (
                <span className="mt-0.5 shrink-0 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cream">Early</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={play}
                aria-label={locked ? "Unlock with VoysNote+" : playing ? "Pause" : "Play"}
                className={cx(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200 active:scale-90",
                  locked ? "bg-mist text-ink" : "bg-ink text-cream",
                )}
              >
                {locked ? <IconLock size={17} /> : playing ? <IconPause size={16} /> : <IconPlay size={16} className="translate-x-[1px]" />}
              </button>
              <Waveform
                data={note.waveformData}
                progress={progress}
                playing={playing}
                blurred={locked}
                onSeek={
                  locked ? undefined : (f) => (isCurrent ? player.seek(f) : player.play(noteToPlayable(note, creator), { queue, from: f * note.duration }))
                }
              />
              <span className="w-[38px] shrink-0 text-right text-[12px] tabular-nums text-stone">
                {active ? formatDuration(position) : formatDuration(note.duration)}
              </span>
            </div>

            <AnimatePresence initial={false}>
              {active && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="flex items-baseline justify-between pt-3">
                    <p className="min-h-[2.6em] pr-3 text-[13px] leading-snug text-ink-2">
                      <motion.span key={captionAt(note.transcript, progress)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
                        {captionAt(note.transcript, progress)}
                      </motion.span>
                    </p>
                    <span className="shrink-0 text-[11px] tabular-nums text-stone-2">{formatDuration(note.duration)}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {lockLabel && (
              <button onClick={play} className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-ink-2">
                <span className="h-1.5 w-1.5 rounded-full bg-ember" />
                {lockLabel}
              </button>
            )}
          </div>
          {active && (
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-mist">
              <div className="h-full bg-ember transition-[width] duration-150 ease-linear" style={{ width: `${progress * 100}%` }} />
            </div>
          )}
        </motion.div>

        <div className="mt-1.5 flex max-w-[340px] items-center gap-1 pl-0.5">
          <ReactionButton note={note} disabled={locked} />
          <button
            onClick={() => {
              actions.toggleSave(note.id);
              toast(saved ? "Removed from Saved" : "Saved", saved ? undefined : "🔖");
            }}
            aria-label={saved ? "Unsave" : "Save"}
            aria-pressed={saved}
            className={cx("rounded-full p-2 transition-colors hover:bg-mist", saved ? "text-ink" : "text-stone")}
          >
            {saved ? <IconBookmarkFill size={18} /> : <IconBookmark size={18} />}
          </button>
          <button onClick={() => openShare(note.id)} aria-label="Share" className="rounded-full p-2 text-stone transition-colors hover:bg-mist hover:text-ink">
            <IconShare size={18} />
          </button>
          {!showHeader && !sponsor && <span className="ml-auto pr-1 text-[11px] text-stone">{time}</span>}
          {sponsor && (
            <a href={sponsor.url} target="_blank" rel="noreferrer sponsored" className="ml-auto truncate pr-1 text-[11px] text-stone">
              Presented by <span className="font-semibold text-ink-2">{sponsor.name}</span>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
