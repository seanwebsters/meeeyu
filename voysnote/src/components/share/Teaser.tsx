"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { player, usePlayer } from "@/lib/audio/engine";
import { noteToPlayable } from "@/lib/audio/playable";
import { useApp, useCatalog } from "@/lib/store/app";
import { useNow } from "@/lib/store/clock";
import { firstName, formatDuration } from "@/lib/utils";
import { Avatar } from "../ui/Avatar";
import { Waveform } from "../ui/Waveform";
import { ButtonLink } from "../ui/Button";
import { IconPause, IconPlay, VMark, Verified } from "../icons";
import { storyHeadline } from "../note/StoryCard";

const PREVIEW_SECONDS = 8;

/** Shared-link landing: a taste of the note, then an invitation in. */
export function Teaser({ id }: { id: string }) {
  const { catalog, idx } = useCatalog();
  const hasUser = useApp((s) => !!s.user);
  const hydrated = useApp((s) => s.hydrated);
  const now = useNow();
  const found = idx.notes.get(id);
  // Never tease a scheduled drop before it lands.
  const note = found && (!now || new Date(found.publishedAt).getTime() <= now) ? found : undefined;
  const creator = note ? idx.creators.get(note.creatorId) : undefined;

  const isCurrent = usePlayer((s) => s.current?.id === id);
  const status = usePlayer((s) => (s.current?.id === id ? s.status : "idle"));
  const position = usePlayer((s) => (s.current?.id === id ? s.position : 0));
  const previewEnded = usePlayer((s) => s.current?.id === id && s.previewEnded);

  useEffect(() => () => player.stop(), []);

  if (!note || !creator) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
        <VMark size={40} />
        <h1 className="display mt-6 text-[40px]">This note is in the group.</h1>
        <ButtonLink href={hydrated && hasUser ? "/" : "/welcome"} className="mt-8">
          Join the group
        </ButtonLink>
      </div>
    );
  }

  const isFirst =
    catalog.notes.filter((n) => n.creatorId === creator.id).sort((a, b) => +new Date(a.publishedAt) - +new Date(b.publishedAt))[0]?.id === note.id;
  const playing = status === "playing";
  const locked = note.premium;
  const limit = Math.min(PREVIEW_SECONDS, note.duration);

  return (
    <div className="flex min-h-dvh flex-col px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))]">
      <Link href="/" className="flex items-center gap-1.5 self-center">
        <VMark size={20} />
        <span className="wordmark text-[20px]">voysnote</span>
      </Link>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 16 }}>
          <Avatar src={creator.avatar} name={creator.name} tone={creator.tone} size={120} pulse={playing} />
        </motion.div>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone">The Group</p>
        <h1 className="display mt-2 text-[48px] uppercase leading-[0.9]">{storyHeadline(creator, isFirst)}</h1>
        <p className="mt-3 flex items-center gap-1 text-[14px] text-ink-2">
          {creator.name} {creator.verified && <Verified size={13} />} · {creator.role}
        </p>

        <div className="mt-8 w-full max-w-[340px] rounded-[22px] border border-line/70 bg-paper p-3.5 text-left">
          <p className="mb-2 font-serif text-[19px]">{note.title}</p>
          <div className="flex items-center gap-3">
            <button
              disabled={locked}
              onClick={() => player.toggle(noteToPlayable(note, creator), { limit })}
              aria-label={playing ? "Pause" : "Play preview"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-cream disabled:bg-mist disabled:text-stone"
            >
              {playing ? <IconPause size={16} /> : <IconPlay size={16} className="translate-x-[1px]" />}
            </button>
            {/* The waveform past the preview is veiled: the rest is in the app. */}
            <div className="relative flex-1">
              <Waveform data={note.waveformData} progress={isCurrent ? position / note.duration : 0} playing={playing} />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 bg-gradient-to-r from-paper/30 to-paper backdrop-blur-[2px]"
                style={{ left: `${(limit / note.duration) * 100}%` }}
              />
            </div>
            <span className="w-9 text-right text-[12px] tabular-nums text-stone">{formatDuration(isCurrent ? position : note.duration)}</span>
          </div>
          <p className="mt-2 text-[12px] text-stone">{locked ? "A VoysNote+ exclusive." : `Preview: first ${limit} of ${note.duration} seconds.`}</p>
        </div>

        <AnimatePresence>
          {previewEnded && (
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="display mt-6 text-[26px]">
              Hear what {firstName(creator.name)} says next…
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-2.5">
        <ButtonLink href={hydrated && hasUser ? "/" : "/welcome"} size="lg" className="w-full">
          {hydrated && hasUser ? "Open the group" : "Join the group to hear the rest"}
        </ButtonLink>
        <p className="text-center text-[12px] text-stone">30 seconds a day from the world&apos;s most interesting people.</p>
      </div>
    </div>
  );
}
