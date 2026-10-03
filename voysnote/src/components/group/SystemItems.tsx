"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import type { Creator } from "@/lib/types";
import type { Pending } from "@/lib/feed";
import { listeningNow } from "@/lib/feed";
import { listenerName } from "@/lib/replies";
import { actions, useApp } from "@/lib/store/app";
import { useNow } from "@/lib/store/clock";
import { ago, cx, firstName, initials, relativeFuture } from "@/lib/utils";
import { Avatar } from "../ui/Avatar";
import { IconBell, IconLock, IconStar, Verified } from "../icons";
import { toast } from "../ui/Toast";

export function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-2 py-1">
      <span className="h-px flex-1 bg-line" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/** The magic moment: someone interesting just joined. */
export function JoinedMoment({ creator, at }: { creator: Creator; at: string }) {
  const following = useApp((s) => s.follows.includes(creator.id));
  const now = useNow();
  const [fresh] = useState(() => Date.now() - new Date(at).getTime() < 10_000);
  return (
    <motion.div
      initial={fresh ? { opacity: 0, scale: 0.9, y: 10 } : false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", damping: 18, stiffness: 220 }}
      className={cx("flex items-center gap-3 rounded-[18px] px-3.5 py-3", fresh ? "bg-accent-soft" : "bg-mist/70")}
    >
      <Link href={`/c/${creator.username}`} className="relative shrink-0">
        {fresh && <span className="pulse-ring absolute inset-0 rounded-full bg-accent/40" />}
        <Avatar src={creator.avatar} name={creator.name} tone={creator.tone} size={38} />
      </Link>
      <Link href={`/c/${creator.username}`} className="min-w-0 flex-1">
        <p className="truncate text-[14px] text-ink">
          <span className="font-semibold">{firstName(creator.name)}</span> joined the group
          {creator.verified && <Verified size={13} className="ml-1 inline -translate-y-px text-accent" />}
        </p>
        <p className="flex items-center gap-1 truncate text-[12px] text-stone">
          {creator.foundingVoice && (
            <span className="inline-flex items-center gap-0.5 font-medium text-gold">
              <IconStar size={11} /> Founding Voice ·
            </span>
          )}
          {creator.role} · {ago(at, now)}
        </p>
      </Link>
      {!following && (
        <button
          onClick={() => {
            actions.toggleFollow(creator.id);
            toast(`Following ${firstName(creator.name)}`);
          }}
          className={cx(
            "shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold",
            fresh ? "bg-accent text-cream" : "border border-ink/10 bg-paper text-ink",
          )}
        >
          Follow
        </button>
      )}
    </motion.div>
  );
}

export function YouJoined() {
  return (
    <div className="flex justify-center py-1">
      <span className="rounded-full bg-paper px-3.5 py-1.5 text-[12px] text-ink-2 ring-1 ring-line">
        <span className="mr-1">👋</span> You joined the group
      </span>
    </div>
  );
}

export function ListeningLine({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-1 text-[12px] text-stone">
      <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" />
      {count.toLocaleString("en-GB")} people are listening right now
    </div>
  );
}

export function ArchiveBanner({ count }: { count: number }) {
  return (
    <Link href="/plus" className="card flex items-center gap-3 px-4 py-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <IconLock size={17} />
      </span>
      <span className="text-[13px] leading-snug text-ink-2">
        <span className="font-semibold text-ink">{count} earlier notes</span> are in the archive.
        <br />
        <span className="text-stone">Scroll back to the beginning with VoysNote+</span>
      </span>
    </Link>
  );
}

/** Typing indicators and the "who's next?" teaser at the end of the chat. */
export function PendingIndicator({ pending }: { pending: Pending }) {
  const now = useNow();
  const [notify, setNotify] = useState(false);
  if (!pending) return null;

  if (pending.kind === "joining") {
    // Listener presence: the room filling up for the arrival.
    const tick = Math.floor(now / 2500);
    const names = [0, 1, 2].map((i) => listenerName(tick + i * 5));
    return (
      <motion.div key="joining" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card flex flex-col items-center px-5 py-6 text-center">
        <div className="flex items-center -space-x-2.5">
          {[0, 1].map((i) => (
            <span key={i} className="relative h-11 w-11 rounded-full border-2 border-paper bg-gradient-to-br from-stone-2 to-mist blur-[0.5px]" />
          ))}
          <span className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-paper bg-mist text-[12px] font-semibold text-ink-2">
            +3
          </span>
        </div>
        <p className="mt-4 flex items-center gap-2 text-[16px] font-semibold">
          Someone new is joining
          <Dots />
        </p>
        <p className="mt-1 text-[12px] text-stone">{listeningNow(now).toLocaleString("en-GB")} people are listening right now</p>
        <ul className="mt-4 w-full max-w-[220px] space-y-2 text-left">
          {names.map((n, i) => (
            <motion.li
              key={`${n}${tick}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2.5 text-[12px] text-stone"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mist text-[9px] font-semibold text-ink-2">{initials(n)}</span>
              {n} is joining…
            </motion.li>
          ))}
        </ul>
      </motion.div>
    );
  }

  if (pending.kind === "recording") {
    return (
      <motion.div key="recording" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card flex items-center gap-3 px-4 py-3.5">
        <Avatar src={pending.creator.avatar} name={pending.creator.name} tone={pending.creator.tone} size={38} />
        <span className="flex h-4 items-center gap-[3px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="wave-live w-[3px] rounded-full bg-accent" style={{ height: `${40 + ((i * 37) % 60)}%`, animationDelay: `${i * 0.12}s` }} />
          ))}
        </span>
        <span className="text-[13px] text-ink-2">{firstName(pending.creator.name)} is recording a voice note…</span>
      </motion.div>
    );
  }

  return (
    <div className="card relative flex flex-col items-center overflow-hidden px-5 py-6 text-center">
      <span className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-accent-soft" />
      <span className="absolute -bottom-14 -left-10 h-32 w-32 rounded-full bg-gold-soft/70" />
      <div className="relative flex -space-x-2.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-10 w-10 rounded-full border-2 border-paper bg-gradient-to-br from-stone-2 to-mist" />
        ))}
      </div>
      <p className="relative mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone">Who&apos;s next?</p>
      <p className="display relative mt-1.5 text-[22px]">Someone new joins {relativeFuture(pending.at, now)}</p>
      <button
        onClick={() => {
          setNotify(true);
          toast("We'll tell you the moment they join", "🔔");
        }}
        className={cx(
          "relative mt-4 flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors",
          notify ? "bg-accent-soft text-accent" : "bg-accent text-cream",
        )}
      >
        <IconBell size={16} /> {notify ? "You'll be notified" : "Notify me"}
      </button>
    </div>
  );
}

function Dots() {
  return (
    <span className="flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-accent" style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
    </span>
  );
}
