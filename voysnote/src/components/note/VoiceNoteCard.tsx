"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Creator, Sponsor, VoiceNote } from "@/lib/types";
import type { NoteAccess } from "@/lib/access";
import { captionAt, player, usePlayer, type Playable } from "@/lib/audio/engine";
import { noteToPlayable, setNoteVisible } from "@/lib/audio/playable";
import { characterForNote } from "@/lib/character";
import { actions, useApp } from "@/lib/store/app";
import { useNow } from "@/lib/store/clock";
import { ago, cx, formatCount, formatDuration, relativeFuture } from "@/lib/utils";
import { Avatar } from "../ui/Avatar";
import { Face } from "./Face";
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

  const character = characterForNote(creator, note, locked);
  const { pair } = character;
  // The tail swoops down to the speaker's avatar, clear of the corner radius.
  const tailLeft = character.shape === "pill" ? 30 : 20;

  return (
    <motion.article
      ref={ref}
      layout="position"
      initial={justArrived ? { opacity: 0, y: 18, scale: 0.94 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 22, stiffness: 260 }}
      className="relative"
    >
      <div className={cx(playing && "bubble-bob")}>
        <div
          className={cx(
            "relative px-5 pb-4 pt-4 text-black transition-shadow duration-300",
            character.shape === "pill" ? "rounded-[40px] px-6" : "rounded-[26px]",
            active && "shadow-[0_20px_50px_-18px_var(--bubble)]",
          )}
          style={{ background: pair.bg, ["--bubble" as string]: pair.bg }}
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1 pt-1">
              <p className="display text-[24px] leading-[1.05]">{note.title}</p>
              {access.state === "open" && access.early && (
                <span className="mt-2 inline-block rounded-full bg-black px-2 py-0.5 text-[11px] font-semibold" style={{ color: pair.bg }}>
                  early access
                </span>
              )}
            </div>
            <Face character={character} size={84} talking={playing} className="-mr-2 -mt-1" />
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={play}
              aria-label={locked ? "Unlock with VoysNote+" : playing ? "Pause" : "Play"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black transition-transform duration-200 active:scale-90"
              style={{ color: pair.bg }}
            >
              {locked ? <IconLock size={17} /> : playing ? <IconPause size={16} /> : <IconPlay size={16} className="translate-x-[1px]" />}
            </button>
            <Waveform
              data={note.waveformData}
              progress={progress}
              playing={playing}
              blurred={locked}
              height={30}
              tone="black"
              onSeek={locked ? undefined : (f) => (isCurrent ? player.seek(f) : player.play(noteToPlayable(note, creator), { queue, from: f * note.duration }))}
            />
            <span className="w-[36px] shrink-0 text-right text-[12px] font-semibold tabular-nums text-black/70">
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
                <p className="mt-3 min-h-[2.6em] text-[14px] font-medium leading-snug text-black/75">
                  <motion.span key={captionAt(note.transcript, progress)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
                    {captionAt(note.transcript, progress)}
                  </motion.span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {lockLabel && (
            <button onClick={play} className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-black/70">
              <IconLock size={13} />
              {lockLabel}
            </button>
          )}
          {sponsor && (
            <a href={sponsor.url} target="_blank" rel="noreferrer sponsored" className="mt-3 block truncate text-[11px] text-black/60">
              presented by <span className="font-semibold text-black/80">{sponsor.name}</span>
            </a>
          )}
          {active && (
            <div className="absolute inset-x-6 bottom-2 h-[3px] overflow-hidden rounded-full bg-black/15">
              <div className="h-full bg-black transition-[width] duration-150 ease-linear" style={{ width: `${progress * 100}%` }} />
            </div>
          )}
        </div>
        <svg width="28" height="20" viewBox="0 0 28 20" className="-mt-px block" style={{ marginLeft: tailLeft }} aria-hidden>
          <path d="M4 0h24C18 4 9 11 0 20 3 12 5 6 4 0z" fill={pair.bg} />
        </svg>
      </div>

      <footer className="-mt-1 flex items-center gap-0.5">
        {showHeader && (
          <>
            <Link href={`/c/${creator.username}`} aria-label={creator.name} className="mr-2 shrink-0">
              <Avatar src={creator.avatar} name={creator.name} tone={creator.tone} size={30} pulse={playing} square sticker tilt={-4} />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/c/${creator.username}`} className="flex items-center gap-1 text-[13px] font-semibold leading-tight">
                <span className="truncate">{creator.name}</span>
                {creator.verified && <Verified className="shrink-0 text-ink" size={12} />}
              </Link>
              <p className="truncate text-[11px] text-stone">
                {playing ? <span className="font-semibold text-pop">talking now</span> : ago(note.publishedAt, now)}
              </p>
            </div>
          </>
        )}
        {!showHeader && <span className="flex-1" />}
        <ReactionButton note={note} disabled={locked} />
        <button
          onClick={() => openReplies(note.id)}
          disabled={locked}
          aria-label={`${replies} replies`}
          className="flex h-9 items-center gap-1 rounded-full px-1.5 text-[12px] tabular-nums text-stone hover:text-ink disabled:opacity-40"
        >
          <IconComment size={18} />
          {replies > 0 && formatCount(replies)}
        </button>
        <button
          onClick={() => {
            actions.toggleSave(note.id);
            toast(saved ? "Removed from Saved" : "Saved", saved ? undefined : "🔖");
          }}
          aria-label={saved ? "Unsave" : "Save"}
          aria-pressed={saved}
          className={cx("rounded-full p-1.5 transition-colors", saved ? "text-ink" : "text-stone hover:text-ink")}
        >
          {saved ? <IconBookmarkFill size={18} /> : <IconBookmark size={18} />}
        </button>
        <button onClick={() => openShare(note.id)} aria-label="Share" className="rounded-full p-1.5 text-stone transition-colors hover:text-ink">
          <IconShare size={18} />
        </button>
        <button onClick={() => openNoteMenu(note.id)} aria-label="More" className="-mr-1.5 rounded-full p-1.5 text-stone hover:text-ink">
          <IconMore size={18} />
        </button>
      </footer>
    </motion.article>
  );
}
