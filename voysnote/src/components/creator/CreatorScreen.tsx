"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { noteAccess } from "@/lib/access";
import { isLive, totalReactions } from "@/lib/catalog";
import { noteToPlayable } from "@/lib/audio/playable";
import { useApp, useCatalog, useEntitlements } from "@/lib/store/app";
import { useNow } from "@/lib/store/clock";
import { ago, cx, firstName, formatCount } from "@/lib/utils";
import { Portrait } from "../ui/Avatar";
import { IconBack, IconHeart, IconMore, Verified } from "../icons";
import { FollowButton, FoundingBadge } from "./CreatorRow";
import { NoteRow } from "../note/NoteRow";
import { FeaturedSeries } from "../discover/DiscoverScreen";
import { openShare } from "../note/ShareSheet";
import { Sheet } from "../ui/Sheet";
import { toast } from "../ui/Toast";

export function CreatorScreen({ username }: { username: string }) {
  const router = useRouter();
  const { catalog, idx } = useCatalog();
  const e = useEntitlements();
  const now = useNow();
  const creator = idx.byUsername.get(username);
  const following = useApp((s) => (creator ? s.follows.includes(creator.id) : false));
  const [tab, setTab] = useState<"notes" | "about">("notes");
  const [menu, setMenu] = useState(false);

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
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-stone-2 to-mist" />
        <h1 className="display mt-6 text-[28px]">Not in the group. Yet.</h1>
        <p className="mt-2 text-[14px] text-stone">Turn on notifications and you&apos;ll know the moment they join.</p>
        <Link href="/" className="mt-6 rounded-full bg-accent px-5 py-2.5 text-[14px] font-semibold text-cream">
          Back to the group
        </Link>
      </div>
    );
  }

  const shareProfile = async () => {
    const url = `${location.origin}/c/${creator.username}`;
    try {
      if (navigator.share) await navigator.share({ title: creator.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Profile link copied", "🔗");
      }
    } catch {}
  };

  return (
    <div className="pb-40">
      <div className="relative">
        <Portrait src={creator.portrait ?? creator.avatar} name={creator.name} tone={creator.tone} className="aspect-[5/4] w-full" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink/35 to-transparent" />
        <div className="absolute inset-x-0 top-0 flex justify-between px-4 pt-[max(14px,env(safe-area-inset-top))] text-cream">
          <button
            onClick={() => (history.length > 1 ? router.back() : router.push("/"))}
            aria-label="Back"
            className="rounded-full bg-ink/20 p-2 backdrop-blur"
          >
            <IconBack size={20} />
          </button>
          <button onClick={() => setMenu(true)} aria-label="More" className="rounded-full bg-ink/20 p-2 backdrop-blur">
            <IconMore size={20} />
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative -mt-7 rounded-t-[28px] bg-cream px-5 pt-6"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-1.5 text-[24px] font-semibold leading-tight tracking-[-0.02em]">
              <span className="truncate">{creator.name}</span>
              {creator.verified && <Verified size={18} className="shrink-0 text-gold" />}
            </h1>
            <p className="mt-0.5 text-[13px] text-stone">
              {creator.role} · {creator.category}
            </p>
          </div>
          <FollowButton creator={creator} size="md" />
        </div>
        {creator.foundingVoice && <FoundingBadge className="mt-3" />}
        <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{creator.bio}</p>

        <div className="mt-5 grid grid-cols-3 divide-x divide-line rounded-[18px] border border-line bg-paper py-3 text-center">
          <Stat value={formatCount(creator.followers + (following ? 1 : 0))} label="Followers" />
          <Stat value={String(notes.length)} label="VoysNotes" />
          <Stat value={String(series.length)} label="Series" />
        </div>

        <nav className="mt-6 flex gap-6 border-b border-line">
          {(
            [
              ["notes", "VoysNotes"],
              ["about", "About"],
            ] as const
          ).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={cx("relative pb-2.5 text-[14px] font-medium", tab === k ? "text-ink" : "text-stone")}>
              {label}
              {tab === k && <motion.span layoutId="creator-tab" className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-accent" />}
            </button>
          ))}
        </nav>

        {tab === "notes" ? (
          <div className="pt-2">
            {series.map((s) => (
              <div key={s.id} className="py-3">
                <FeaturedSeries id={s.id} />
              </div>
            ))}
            <div className="divide-y divide-line/60">
              {notes.map(({ note, access }) => (
                <NoteRow
                  key={note.id}
                  note={note}
                  creator={creator}
                  access={access}
                  queue={queue}
                  meta={
                    <>
                      {ago(note.publishedAt, now)} · <IconHeart size={11} className="inline -translate-y-px" /> {formatCount(totalReactions(note))}
                    </>
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          <dl className="space-y-4 pt-5 text-[14px]">
            <About label="About">{creator.bio}</About>
            <About label="What they talk about">{creator.category}</About>
            <About label="In the group since">
              {new Date(creator.joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </About>
            {creator.foundingVoice && <About label="Founding Voice">One of the first people to join VoysNote, before anyone knew who&apos;d be next.</About>}
          </dl>
        )}
      </motion.div>

      <Sheet open={menu} onClose={() => setMenu(false)} title={creator.name}>
        <div className="-mx-2">
          <MenuItem
            onClick={() => {
              setMenu(false);
              shareProfile();
            }}
          >
            Share profile
          </MenuItem>
          {notes[0] && (
            <MenuItem
              onClick={() => {
                setMenu(false);
                setTimeout(() => openShare(notes[0].note.id), 250);
              }}
            >
              Share {firstName(creator.name)}&apos;s latest as a Story
            </MenuItem>
          )}
        </div>
      </Sheet>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-[17px] font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-stone">{label}</p>
    </div>
  );
}

function About({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] font-medium text-stone">{label}</dt>
      <dd className="mt-0.5 leading-relaxed text-ink-2">{children}</dd>
    </div>
  );
}

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full rounded-2xl px-3 py-3.5 text-left text-[15px] hover:bg-mist">
      {children}
    </button>
  );
}
