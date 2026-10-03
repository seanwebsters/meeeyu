"use client";

import { useRouter } from "next/navigation";
import type { Creator, VoiceNote } from "@/lib/types";
import type { NoteAccess } from "@/lib/access";
import { player, usePlayer, type Playable } from "@/lib/audio/engine";
import { noteToPlayable } from "@/lib/audio/playable";
import { cx, formatDuration } from "@/lib/utils";
import { Avatar } from "../ui/Avatar";
import { IconLock, IconPause, IconPlay } from "../icons";

/** Compact list row: square thumbnail, title, meta. Tap to play. */
export function NoteRow({
  note,
  creator,
  access = { state: "open" },
  queue,
  rank,
  meta,
  trailing,
}: {
  note: VoiceNote;
  creator: Creator;
  access?: NoteAccess;
  queue?: Playable[];
  rank?: number;
  /** Replaces the default "Name · 0:27" line. */
  meta?: React.ReactNode;
  /** Replaces the default play button. */
  trailing?: React.ReactNode;
}) {
  const router = useRouter();
  const status = usePlayer((s) => (s.current?.id === note.id ? s.status : "idle"));
  const position = usePlayer((s) => (s.current?.id === note.id ? Math.round(s.position) : 0));
  const playing = status === "playing";
  const active = status !== "idle";
  const locked = access.state === "locked";
  const toggle = () => (locked ? router.push("/plus") : player.toggle(noteToPlayable(note, creator), { queue }));

  return (
    <div className="flex items-center gap-3 py-2.5">
      {rank != null && <span className="w-4 text-center text-[15px] font-semibold text-stone">{rank}</span>}
      <button onClick={toggle} className="relative shrink-0" aria-label={locked ? "Unlock" : playing ? "Pause" : "Play"}>
        <Avatar src={creator.avatar} name={creator.name} tone={creator.tone} size={52} square />
        {(active || locked) && (
          <span className="absolute inset-0 flex items-center justify-center rounded-[12px] bg-ink/35 text-cream">
            {locked ? <IconLock size={16} /> : playing ? <IconPause size={16} /> : <IconPlay size={16} />}
          </span>
        )}
      </button>
      <button onClick={toggle} className="min-w-0 flex-1 text-left">
        <p className={cx("truncate text-[14px] font-semibold leading-tight", active && "text-accent")}>{note.title}</p>
        <p className="mt-1 truncate text-[12px] text-stone">
          {meta ?? creator.name} ·{" "}
          <span className="tabular-nums">{active ? `${formatDuration(position)} / ${formatDuration(note.duration)}` : formatDuration(note.duration)}</span>
          {locked && <span className="text-accent"> · VoysNote+</span>}
        </p>
      </button>
      {trailing ?? (
        <button
          onClick={toggle}
          aria-label={locked ? "Unlock" : playing ? "Pause" : "Play"}
          className={cx(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90",
            locked ? "bg-mist text-ink-2" : active ? "bg-accent text-cream" : "border border-ink/15 text-ink",
          )}
        >
          {locked ? <IconLock size={14} /> : playing ? <IconPause size={13} /> : <IconPlay size={13} className="translate-x-[1px]" />}
        </button>
      )}
    </div>
  );
}
