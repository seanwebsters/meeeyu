"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useMemo } from "react";
import { noteAccess, ownsSeries } from "@/lib/access";
import { isLive } from "@/lib/catalog";
import { noteToPlayable } from "@/lib/audio/playable";
import { useApp, useCatalog, useEntitlements } from "@/lib/store/app";
import { useNow } from "@/lib/store/clock";
import { formatCount, relativeShort, TIME } from "@/lib/utils";
import { Portrait } from "../ui/Avatar";
import { IconBack, IconShare, Verified } from "../icons";
import { FollowButton, FoundingBadge } from "./CreatorRow";
import { VoiceNoteCard } from "../note/VoiceNoteCard";
import { SeriesCard } from "../series/SeriesCard";
import { openShare } from "../note/ShareSheet";
import { toast } from "../ui/Toast";

export function CreatorScreen({ username }: { username: string }) {
  const router = useRouter();
  const { catalog, idx } = useCatalog();
  const e = useEntitlements();
  const now = useNow();
  const creator = idx.byUsername.get(username);
  const following = useApp((s) => (creator ? s.follows.includes(creator.id) : false));

  const notes = useMemo(() => {
    if (!creator) return [];
    return catalog.notes
      .filter((n) => n.creatorId === creator.id)
      .map((n) => ({ note: n, access: noteAccess(n, e, now) }))
      .filter((x) => x.access.state !== "hidden")
      .sort((a, b) => +new Date(b.note.publishedAt) - +new Date(a.note.publishedAt));
  }, [catalog, creator, e, now]);
  const queue = useMemo(() => (creator ? notes.filter((x) => x.access.state === "open").map((x) => noteToPlayable(x.note, creator)) : []), [notes, creator]);
  const series = creator ? catalog.series.filter((s) => s.creatorId === creator.id) : [];

  if (!creator || !isLive(creator.joinedAt, now)) {
    return (
      <div className="flex min-h-[80dvh] flex-col items-center justify-center px-8 text-center">
        <div className="h-24 w-24 rounded-full bg-mist" />
        <h1 className="display mt-6 text-[36px]">Not in the group. Yet.</h1>
        <p className="mt-2 text-[14px] text-stone">Turn on notifications and you&apos;ll know the moment they join.</p>
        <Link href="/" className="mt-6 rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-cream">
          Back to the group
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-40">
      <div className="relative">
        <Portrait src={creator.portrait ?? creator.avatar} name={creator.name} tone={creator.tone} className="aspect-[4/5] w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/25 via-transparent to-cream" />
        <div className="absolute inset-x-0 top-0 flex justify-between px-4 pt-[max(14px,env(safe-area-inset-top))]">
          <button
            onClick={() => (history.length > 1 ? router.back() : router.push("/"))}
            aria-label="Back"
            className="rounded-full bg-cream/80 p-2.5 backdrop-blur"
          >
            <IconBack size={20} />
          </button>
          <button
            onClick={async () => {
              const url = `${location.origin}/c/${creator.username}`;
              try {
                if (navigator.share) await navigator.share({ title: creator.name, url });
                else {
                  await navigator.clipboard.writeText(url);
                  toast("Profile link copied", "🔗");
                }
              } catch {}
            }}
            aria-label="Share profile"
            className="rounded-full bg-cream/80 p-2.5 backdrop-blur"
          >
            <IconShare size={20} />
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative -mt-28 px-5"
      >
        {creator.foundingVoice && <FoundingBadge className="mb-3 bg-cream/70 backdrop-blur" />}
        <h1 className="display flex items-end gap-2 text-[52px]">
          {creator.name}
          {creator.verified && <Verified size={24} className="mb-2.5 shrink-0" />}
        </h1>
        <p className="mt-2 text-[14px] font-medium text-ink-2">
          {creator.role} · {creator.category}
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{creator.bio}</p>

        <div className="mt-5 flex items-center gap-5 text-[13px] text-stone">
          <span>
            <b className="text-[15px] font-semibold text-ink">{formatCount(creator.followers + (following ? 1 : 0))}</b> followers
          </span>
          <span>
            <b className="text-[15px] font-semibold text-ink">{notes.length}</b> notes
          </span>
          <span>
            {now - +new Date(creator.joinedAt) < 7 * TIME.DAY
              ? `Joined ${relativeShort(creator.joinedAt, now)} ago`
              : `Joined ${relativeShort(creator.joinedAt, now)}`}
          </span>
        </div>

        <div className="mt-5 flex gap-2">
          <FollowButton creator={creator} size="md" />
          {notes[0] && (
            <button onClick={() => openShare(notes[0].note.id)} className="h-11 rounded-full border border-ink/15 px-5 text-[15px] font-semibold">
              Share latest
            </button>
          )}
        </div>
      </motion.div>

      {series.length > 0 && (
        <section className="px-5 pt-10">
          <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-stone">Series</h2>
          <div className="space-y-3">
            {series.map((s) => (
              <SeriesCard
                key={s.id}
                series={s}
                creator={creator}
                sponsor={s.sponsorId ? idx.sponsors.get(s.sponsorId) : null}
                owned={ownsSeries(s, e) && s.price > 0}
              />
            ))}
          </div>
        </section>
      )}

      <section className="px-4 pt-10">
        <h2 className="mb-4 px-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-stone">VoysNotes</h2>
        <div className="space-y-6">
          {notes.map(({ note, access }) => (
            <VoiceNoteCard
              key={note.id}
              note={note}
              creator={creator}
              access={access}
              sponsor={note.sponsorId ? idx.sponsors.get(note.sponsorId) : null}
              variant="list"
              timeStyle="relative"
              showHeader={false}
              queue={queue}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
