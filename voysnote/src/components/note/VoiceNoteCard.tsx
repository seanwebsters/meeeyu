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
import { ago, cx, formatCount, formatDuration, relativeFuture } from "@/lib/utils";
import { Avatar } from "../ui/Avatar";
import { Waveform } from "../ui/Waveform";
import { IconBookmark, IconBookmarkFill, IconComment, IconLock, IconMore, IconPause, IconPlay, IconShare, Verified } from "../icons";
import { ReactionButton } from "./ReactionButton";
import { openShare } from "./ShareSheet";
import { openNoteMenu, openReplies, useReplyCount } from "./NoteSheets";
import { toast } from "../ui/Toast";

interface Props {
  note: VoiceNote;
  creator: Creator;
  access?: NoteAccess;
  sponsor?: Sponsor | null;
  queue?: Playable[];
  /** Hide the creator header (e.g. on their own profile). */
  showHeader?: boolean;
  /** Kept for call-site compatibility; every card uses the same layout. */
  variant?: "chat" | "list";
  timeStyle?: "clock" | "relative";
}

export function VoiceNoteCard({ note, creator, access = { state: "open" }, sponsor, queue, showHeader = true }: Props) {
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  const isCurrent = usePlayer((s) => s.current?.id === note.id);
  const status = usePlayer((s) => (s.current?.id === note.id ? s.status : "idle"));
  // Quantised so idle cards don't re-render every animation frame.
  const position = usePlayer((s) => (s.current?.id === note.id ? Math.round(s.position * 10) / 10 : 0));
  const saved = useApp((s) => s.saved.some((x) => x.noteId === note.id));
  const replies = useReplyCount(note.id);
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
        ? `Early access for VoysNote+ · everyone ${note.earlyAccessUntil ? relativeFuture(note.earlyAccessUntil, now) : "soon"}`
        : access.reason === "archive"
          ? "In the archive · VoysNote+"
          : "VoysNote+ exclusive"
      : null;

  return (
    <motion.article
      ref={ref}
      layout="position"
      initial={justArrived ? { opacity: 0, y: 18, scale: 0.97 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 26, stiffness: 260 }}
      className={cx(
        // Flat: no card. The note only gets a surface while it plays.
        "relative -mx-2 overflow-hidden rounded-[22px] transition-colors duration-300",
        active ? "bg-paper shadow-[0_0_0_1px_rgba(216,243,130,0.4),0_18px_60px_-16px_rgba(130,109,238,0.55)]" : "bg-transparent",
      )}
    >
      <div className={cx("transition-[padding] duration-300", active ? "px-4 pb-2 pt-4" : "px-2 pb-0 pt-1")}>
        {showHeader && (
          <header className="mb-2.5 flex items-center gap-2.5">
            <Link href={`/c/${creator.username}`} aria-label={creator.name} className="shrink-0">
              <Avatar src={creator.avatar} name={creator.name} tone={creator.tone} size={34} pulse={playing} sticker />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/c/${creator.username}`} className="flex items-center gap-1 text-[14px] font-semibold leading-tight tracking-[-0.01em]">
                <span className="truncate">{creator.name}</span>
                {creator.verified && <Verified className="shrink-0 text-ink" size={13} />}
                {playing && <span className="ml-1 shrink-0 rounded-full bg-pop px-2 py-0.5 text-[10px] font-bold text-black">now playing</span>}
              </Link>
              <p className="truncate text-[12px] text-stone">
                {creator.role} · {ago(note.publishedAt, now)}
              </p>
            </div>
            <button onClick={() => openNoteMenu(note.id)} aria-label="More" className="-mr-1.5 rounded-full p-1.5 text-stone hover:bg-mist hover:text-ink">
              <IconMore />
            </button>
          </header>
        )}

        <div className="flex items-start justify-between gap-2">
          <p className={cx("display text-[23px] leading-[1.08] text-ink")}>{note.title}</p>
          {access.state === "open" && access.early && (
            <span className="mt-0.5 shrink-0 rounded-full border border-ink/15 px-2 py-0.5 text-[11px] font-medium text-ink-2">early</span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={play}
            aria-label={locked ? "Unlock with VoysNote+" : playing ? "Pause" : "Play"}
            className={cx(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200 active:scale-90",
              locked ? "bg-mist text-ink-2" : playing ? "bg-pop text-black" : "bg-ink text-cream",
            )}
          >
            {locked ? <IconLock size={17} /> : playing ? <IconPause size={16} /> : <IconPlay size={16} className="translate-x-[1px]" />}
          </button>
          <Waveform
            data={note.waveformData}
            progress={progress}
            playing={playing}
            blurred={locked}
            height={32}
            onSeek={locked ? undefined : (f) => (isCurrent ? player.seek(f) : player.play(noteToPlayable(note, creator), { queue, from: f * note.duration }))}
          />
          <span className="w-[36px] shrink-0 text-right text-[12px] font-medium tabular-nums text-ink-2">
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
              <div className="mt-3 flex items-baseline justify-between gap-3">
                <p className="min-h-[2.6em] text-[14px] leading-snug text-stone">
                  <motion.span key={captionAt(note.transcript, progress)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
                    {captionAt(note.transcript, progress)}
                  </motion.span>
                </p>
                <span className="shrink-0 text-[11px] tabular-nums text-stone">{formatDuration(note.duration)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {lockLabel && (
          <button onClick={play} className="mt-2.5 flex items-center gap-1.5 text-[12px] font-medium text-ink-2">
            <IconLock size={13} />
            {lockLabel}
          </button>
        )}

        <footer className="-ml-1.5 mt-1.5 flex items-center gap-0.5">
          <ReactionButton note={note} disabled={locked} />
          <button
            onClick={() => openReplies(note.id)}
            disabled={locked}
            aria-label={`${replies} replies`}
            className="flex h-9 items-center gap-1.5 rounded-full px-2 text-[12px] tabular-nums text-stone hover:text-ink disabled:opacity-40"
          >
            <IconComment size={18} />
            {replies > 0 && formatCount(replies)}
          </button>
          {sponsor ? (
            <a href={sponsor.url} target="_blank" rel="noreferrer sponsored" className="mx-auto truncate px-1 text-[11px] text-stone">
              presented by <span className="font-medium text-ink-2">{sponsor.name}</span>
            </a>
          ) : (
            <span className="flex-1" />
          )}
          <button
            onClick={() => {
              actions.toggleSave(note.id);
              toast(saved ? "Removed from Saved" : "Saved", saved ? undefined : "🔖");
            }}
            aria-label={saved ? "Unsave" : "Save"}
            aria-pressed={saved}
            className={cx("rounded-full p-2 transition-colors", saved ? "text-ink" : "text-stone hover:text-ink")}
          >
            {saved ? <IconBookmarkFill size={18} /> : <IconBookmark size={18} />}
          </button>
          <button onClick={() => openShare(note.id)} aria-label="Share" className="-mr-1.5 rounded-full p-2 text-stone transition-colors hover:text-ink">
            <IconShare size={18} />
          </button>
        </footer>
      </div>
      {active && (
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-mist">
          <div className="h-full bg-live transition-[width] duration-150 ease-linear" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
    </motion.article>
  );
}
