"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import type { Creator } from "@/lib/types";
import type { Pending } from "@/lib/feed";
import { actions, useApp } from "@/lib/store/app";
import { useNow } from "@/lib/store/clock";
import { clockTime, cx, firstName, formatCount, relativeFuture } from "@/lib/utils";
import { Avatar } from "../ui/Avatar";
import { IconBell, IconLock, Verified } from "../icons";
import { toast } from "../ui/Toast";

export function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-1">
      <span className="rounded-full bg-mist/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone">{label}</span>
    </div>
  );
}

/** The magic moment: someone interesting just joined. */
export function JoinedMoment({ creator, at }: { creator: Creator; at: string }) {
  const following = useApp((s) => s.follows.includes(creator.id));
  const [fresh] = useState(() => Date.now() - new Date(at).getTime() < 10_000);
  return (
    <motion.div
      initial={fresh ? { opacity: 0, scale: 0.85, y: 10 } : false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", damping: 18, stiffness: 200 }}
      className="flex flex-col items-center py-3 text-center"
    >
      <Link href={`/c/${creator.username}`} className="group flex flex-col items-center">
        <span className="relative">
          {fresh && <span className="pulse-ring absolute inset-0 rounded-full bg-ember/40" />}
          <Avatar src={creator.avatar} name={creator.name} tone={creator.tone} size={fresh ? 64 : 48} className="ring-[3px] ring-paper" />
        </span>
        <p className="mt-2.5 text-[14px] leading-tight text-ink-2">
          <span className="font-semibold text-ink group-hover:underline">{creator.name}</span>
          {creator.verified && <Verified size={13} className="mx-0.5 inline -translate-y-px text-ink" />} joined the group
        </p>
      </Link>
      <p className="mt-1 text-[12px] text-stone">
        {creator.role}
        {creator.foundingVoice && <span> · Founding Voice</span>}
        <span> · {clockTime(at)}</span>
      </p>
      {fresh && !following && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={() => {
            actions.toggleFollow(creator.id);
            toast(`Following ${firstName(creator.name)}`);
          }}
          className="mt-2.5 rounded-full bg-ink px-4 py-1.5 text-[12px] font-semibold text-cream"
        >
          Follow
        </motion.button>
      )}
    </motion.div>
  );
}

export function YouJoined() {
  return (
    <div className="flex justify-center py-2">
      <span className="rounded-full border border-line px-3.5 py-1.5 text-[12px] text-ink-2">
        <span className="mr-1">👋</span> You joined the group
      </span>
    </div>
  );
}

export function ListeningLine({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-1.5 text-[12px] text-stone">
      <span className="live-dot h-1.5 w-1.5 rounded-full bg-ember" />
      {count.toLocaleString("en-GB")} people are listening right now
    </div>
  );
}

export function ArchiveBanner({ count }: { count: number }) {
  return (
    <Link href="/plus" className="mx-auto mb-2 flex max-w-[340px] items-center gap-3 rounded-[20px] border border-dashed border-stone-2 px-4 py-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mist text-ink">
        <IconLock size={16} />
      </span>
      <span className="text-[13px] leading-snug text-ink-2">
        <span className="font-semibold text-ink">{count} earlier notes</span> are in the archive.
        <br />
        <span className="text-stone">Scroll back to the beginning with VoysNote+</span>
      </span>
    </Link>
  );
}

/** Typing indicators and the "who's next?" teaser at the bottom of the chat. */
export function PendingIndicator({ pending }: { pending: Pending }) {
  const now = useNow();
  const [notify, setNotify] = useState(false);
  if (!pending) return null;

  if (pending.kind === "joining") {
    return (
      <motion.div key="joining" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2 py-3">
        <div className="relative">
          <span className="pulse-ring absolute inset-0 rounded-full bg-ember/30" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-mist text-[18px] text-stone">?</div>
        </div>
        <p className="flex items-center gap-2 text-[13px] font-medium text-ink-2">
          Someone new is joining
          <Dots />
        </p>
      </motion.div>
    );
  }

  if (pending.kind === "recording") {
    return (
      <motion.div key="recording" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2.5 py-1">
        <Avatar src={pending.creator.avatar} name={pending.creator.name} tone={pending.creator.tone} size={36} />
        <div className="flex items-center gap-2.5 rounded-[20px] rounded-tl-[8px] border border-line/70 bg-paper px-4 py-3">
          <span className="flex h-4 items-center gap-[3px]">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="wave-live w-[3px] rounded-full bg-ember"
                style={{ height: `${40 + ((i * 37) % 60)}%`, animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </span>
          <span className="text-[13px] text-ink-2">{firstName(pending.creator.name)} is recording a voice note…</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto mt-2 flex max-w-[340px] flex-col items-center rounded-[24px] bg-ink px-5 py-5 text-center text-cream">
      <div className="flex -space-x-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cx("h-9 w-9 rounded-full border-2 border-ink bg-cream/20 backdrop-blur", i === 1 && "bg-cream/35")} />
        ))}
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/60">Who&apos;s next?</p>
      <p className="display mt-1.5 text-[28px]">Someone new joins {relativeFuture(pending.at, now)}</p>
      <button
        onClick={() => {
          setNotify(true);
          toast("We'll tell you the moment they join", "🔔");
        }}
        className={cx(
          "mt-4 flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors",
          notify ? "bg-cream/15 text-cream" : "bg-cream text-ink",
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
        <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-stone" style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
    </span>
  );
}

export function MembersLine({ creators, listening }: { creators: Creator[]; listening: number }) {
  const names = creators
    .slice(-3)
    .reverse()
    .map((c) => firstName(c.name));
  return (
    <span className="truncate">
      {names.join(", ")} and {formatCount(listening)} listening
    </span>
  );
}
