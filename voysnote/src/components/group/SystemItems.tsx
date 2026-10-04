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
import { IconBell, IconLock } from "../icons";
import { toast } from "../ui/Toast";

export function DayDivider({ label }: { label: string }) {
  return <p className="pt-2 text-center text-[12px] font-medium lowercase text-stone-2">{label}</p>;
}

/** The magic moment: someone interesting just joined. A quiet line, not a card. */
/** Stable playful tilt per person, -4..4 degrees. */
export function tiltFor(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return (Math.abs(h) % 9) - 4;
}

/** The magic moment: someone interesting just joined. Big, a little loud. */
export function JoinedMoment({ creator, at }: { creator: Creator; at: string }) {
  const following = useApp((s) => s.follows.includes(creator.id));
  const now = useNow();
  const [fresh] = useState(() => Date.now() - new Date(at).getTime() < 10_000);
  return (
    <motion.div
      initial={fresh ? { opacity: 0, scale: 0.6, rotate: -8 } : false}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", damping: 12, stiffness: 180 }}
      className="flex flex-col items-center py-2 text-center"
    >
      <Link href={`/c/${creator.username}`} className="relative">
        {fresh && <span className="pulse-ring absolute inset-0 rounded-[28%] bg-pop" />}
        <Avatar src={creator.avatar} name={creator.name} tone={creator.tone} size={fresh ? 88 : 68} square sticker tilt={tiltFor(creator.id) || 3} />
        {fresh && <span className="absolute -right-3 -top-1 rotate-12 rounded-full bg-pop px-2 py-0.5 text-[11px] font-bold text-ink shadow-sm">new</span>}
      </Link>
      <Link href={`/c/${creator.username}`} className="display mt-3.5 text-[24px] lowercase">
        {firstName(creator.name)} joined the group
      </Link>
      <p className="mt-1 text-[13px] text-stone">
        {creator.role.toLowerCase()} · {ago(at, now)}
        {creator.foundingVoice && " · founding voice ⭐"}
      </p>
      {!following && (
        <button
          onClick={() => {
            actions.toggleFollow(creator.id);
            toast(`following ${firstName(creator.name).toLowerCase()} 🫶`);
          }}
          className="mt-3 rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-cream active:scale-95"
        >
          follow
        </button>
      )}
    </motion.div>
  );
}

export function YouJoined() {
  return (
    <p className="text-center text-[13px] text-stone">
      <span className="rounded-full bg-pop px-2.5 py-1 font-semibold text-ink">you&apos;re in 🫶</span>
    </p>
  );
}

export function ListeningLine({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-center gap-2 text-[12px] text-stone">
      <span className="live-dot h-1.5 w-1.5 rounded-full bg-live" />
      {count.toLocaleString("en-GB")} listening rn
    </div>
  );
}

export function ArchiveBanner({ count }: { count: number }) {
  return (
    <Link href="/plus" className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mist text-ink">
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
      <motion.div key="joining" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-4 text-center">
        <div className="flex items-center -space-x-2.5">
          {[0, 1].map((i) => (
            <span key={i} className="relative h-10 w-10 rounded-full border-2 border-cream bg-gradient-to-br from-stone-2 to-mist blur-[0.5px]" />
          ))}
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-cream bg-mist text-[12px] font-semibold text-ink-2">
            +3
          </span>
        </div>
        <p className="mt-4 flex items-center gap-2 text-[18px] font-semibold tracking-[-0.02em]">
          someone&apos;s about to join 👀
          <Dots />
        </p>
        <p className="mt-1 text-[12px] text-stone">{listeningNow(now).toLocaleString("en-GB")} listening right now</p>
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
              {n.toLowerCase()} just tuned in
            </motion.li>
          ))}
        </ul>
      </motion.div>
    );
  }

  if (pending.kind === "recording") {
    return (
      <motion.div key="recording" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2.5">
        <Avatar src={pending.creator.avatar} name={pending.creator.name} tone={pending.creator.tone} size={28} />
        <span className="flex h-4 items-center gap-[3px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="wave-live w-[3px] rounded-full bg-live" style={{ height: `${40 + ((i * 37) % 60)}%`, animationDelay: `${i * 0.12}s` }} />
          ))}
        </span>
        <span className="text-[14px] text-stone">
          <b className="font-semibold text-ink">{firstName(pending.creator.name)}</b> is recording…
        </span>
      </motion.div>
    );
  }

  return (
    <div className="card relative flex flex-col items-center overflow-hidden px-5 py-6 text-center">
      <div className="relative flex -space-x-2.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="sticker h-10 w-10 rounded-full bg-gradient-to-br from-stone-2 to-mist" style={{ transform: `rotate(${(i - 1) * 8}deg)` }} />
        ))}
      </div>
      <p className="relative mt-3 text-[13px] font-semibold text-stone">who&apos;s next? 👀</p>
      <p className="display relative mt-1.5 text-[24px]">someone new joins {relativeFuture(pending.at, now)}</p>
      <button
        onClick={() => {
          setNotify(true);
          toast("We'll tell you the moment they join", "🔔");
        }}
        className={cx(
          "relative mt-4 flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors",
          notify ? "bg-pop text-ink" : "bg-ink text-cream",
        )}
      >
        <IconBell size={16} /> {notify ? "we'll ping you" : "ping me"}
      </button>
    </div>
  );
}

function Dots() {
  return (
    <span className="flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-live" style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
    </span>
  );
}
