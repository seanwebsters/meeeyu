"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Creator, VoiceNote } from "@/lib/types";
import type { NoteAccess } from "@/lib/access";
import { player, usePlayer, type Playable } from "@/lib/audio/engine";
import { noteToPlayable } from "@/lib/audio/playable";
import { cx, formatDuration } from "@/lib/utils";
import { Avatar } from "../ui/Avatar";
import { IconLock, IconPause, IconPlay, Verified } from "../icons";

/** Compact, list-style note for Discover, Saved and profiles. */
export function NoteRow({
  note,
  creator,
  access = { state: "open" },
  queue,
  rank,
  meta,
}: {
  note: VoiceNote;
  creator: Creator;
  access?: NoteAccess;
  queue?: Playable[];
  rank?: number;
  meta?: React.ReactNode;
}) {
  const router = useRouter();
  const status = usePlayer((s) => (s.current?.id === note.id ? s.status : "idle"));
  const position = usePlayer((s) => (s.current?.id === note.id ? Math.round(s.position) : 0));
  const playing = status === "playing";
  const active = status !== "idle";
  const locked = access.state === "locked";

  return (
    <div className="flex items-center gap-3 py-2.5">
      {rank != null && <span className="display w-5 text-center text-[24px] text-stone-2">{rank}</span>}
      <Link href={`/c/${creator.username}`} className="shrink-0">
        <Avatar src={creator.avatar} name={creator.name} tone={creator.tone} size={44} pulse={playing} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 truncate text-[13px] text-stone">
          <span className="truncate font-semibold text-ink">{creator.name}</span>
          {creator.verified && <Verified size={12} className="shrink-0 text-ink" />}
        </p>
        <p className="truncate font-serif text-[17px] leading-tight">{note.title}</p>
        <p className="mt-0.5 text-[12px] text-stone">
          {meta}
          {meta ? " · " : ""}
          <span className="tabular-nums">{active ? `${formatDuration(position)} / ${formatDuration(note.duration)}` : formatDuration(note.duration)}</span>
          {locked && <span className="text-ember"> · VoysNote+</span>}
        </p>
      </div>
      <button
        onClick={() => (locked ? router.push("/plus") : player.toggle(noteToPlayable(note, creator), { queue }))}
        aria-label={locked ? "Unlock" : playing ? "Pause" : "Play"}
        className={cx(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90",
          locked ? "bg-mist" : active ? "bg-ink text-cream" : "border border-ink/15 text-ink",
        )}
      >
        {locked ? <IconLock size={16} /> : playing ? <IconPause size={15} /> : <IconPlay size={15} className="translate-x-[1px]" />}
      </button>
    </div>
  );
}
