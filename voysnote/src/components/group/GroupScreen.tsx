"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { buildFeed, listeningNow } from "@/lib/feed";
import { joinedCreators } from "@/lib/catalog";
import { buildNotifications } from "@/lib/notifications";
import { noteToPlayable } from "@/lib/audio/playable";
import { useApp, useCatalog, useEntitlements } from "@/lib/store/app";
import { useNow } from "@/lib/store/clock";
import { cx, firstName } from "@/lib/utils";
import { Avatar } from "../ui/Avatar";
import { IconArrowDown, IconBell, VMark } from "../icons";
import { VoiceNoteCard } from "../note/VoiceNoteCard";
import { ArchiveBanner, DayDivider, JoinedMoment, ListeningLine, PendingIndicator, YouJoined } from "./SystemItems";

export function GroupScreen() {
  const { catalog, idx } = useCatalog();
  const entitlements = useEntitlements();
  const userJoinedAt = useApp((s) => s.user?.joinedAt ?? null);
  const follows = useApp((s) => s.follows);
  const seenAt = useApp((s) => s.notificationsSeenAt);
  const now = useNow();

  // Rebuild only when something actually becomes live, not every second.
  const liveKey = useMemo(() => {
    const times = [...catalog.events.map((e) => e.at), ...catalog.notes.map((n) => n.publishedAt), ...catalog.notes.map((n) => n.earlyAccessUntil ?? "")];
    return times.filter((t) => t && new Date(t).getTime() <= now).length + ":" + Math.floor(now / 5000);
  }, [catalog, now]);

  const { items, pending, playable } = useMemo(
    () => buildFeed(catalog, { now, entitlements, userJoinedAt }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- liveKey stands in for `now`
    [catalog, entitlements, userJoinedAt, liveKey],
  );

  const queue = useMemo(() => playable.map((n) => noteToPlayable(n, idx.creators.get(n.creatorId)!)), [playable, idx]);
  const members = useMemo(() => joinedCreators(catalog, now), [catalog, now]);
  const unread = useMemo(() => {
    const seen = seenAt ? new Date(seenAt).getTime() : 0;
    return buildNotifications(catalog, follows, now).filter((n) => new Date(n.at).getTime() > seen).length;
  }, [catalog, follows, now, seenAt]);

  // --- Chat scrolling: open at the latest, follow new arrivals --------------
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastId = items.at(-1)?.id;
  const pendingKind = pending?.kind;
  const [newArrival, setNewArrival] = useState<string | null>(null);
  const first = useRef(true);

  useLayoutEffect(() => {
    if (!first.current) return;
    first.current = false;
    const toBottom = () => window.scrollTo({ top: document.documentElement.scrollHeight });
    toBottom();
    // Navigation resets scroll after mount; settle on the latest message.
    const raf = requestAnimationFrame(toBottom);
    const t = setTimeout(toBottom, 120);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (first.current) return;
    const nearBottom = window.innerHeight + window.scrollY > document.documentElement.scrollHeight - 420;
    if (nearBottom) {
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
    } else {
      const last = items.at(-1);
      // Responds to the window's scroll position, which React doesn't own.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (last?.kind === "joined") setNewArrival(`${firstName(last.creator.name)} joined the group`);
      else if (last?.kind === "note") setNewArrival(`New from ${firstName(last.creator.name)}`);
    }
    // Only react to the newest item or the typing indicator changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastId, pendingKind]);

  useEffect(() => {
    if (!newArrival) return;
    const onScroll = () => {
      if (window.innerHeight + window.scrollY > document.documentElement.scrollHeight - 200) setNewArrival(null);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [newArrival]);

  return (
    <div className="pb-44">
      <header className="sticky top-0 z-30 border-b border-line/60 bg-cream/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 pb-2.5 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-cream">
            <VMark size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <h1 className="wordmark text-[21px] leading-none">voysnote</h1>
              <span className="text-[12px] font-medium text-stone">The Group</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[12px] text-stone">
              <span className="flex -space-x-1.5">
                {members.slice(-3).map((c) => (
                  <Avatar key={c.id} src={c.avatar} name={c.name} tone={c.tone} size={16} className="ring-[1.5px] ring-cream rounded-full" />
                ))}
              </span>
              <span className="live-dot ml-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
              <span className="truncate tabular-nums">
                {members.length} voices · {listeningNow(now).toLocaleString("en-GB")} listening
              </span>
            </div>
          </div>
          <Link
            href="/notifications"
            aria-label={`Notifications${unread ? `, ${unread} new` : ""}`}
            className="relative -mr-1 rounded-full p-2 text-ink hover:bg-mist"
          >
            <IconBell size={23} />
            {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-cream bg-ember" />}
          </Link>
        </div>
      </header>

      <div className="space-y-4 px-3.5 pt-5">
        <GroupIntro />
        {items.map((item) => {
          switch (item.kind) {
            case "day":
              return <DayDivider key={item.id} label={item.label} />;
            case "joined":
              return <JoinedMoment key={item.id} creator={item.creator} at={item.at} />;
            case "you-joined":
              return <YouJoined key={item.id} />;
            case "listening":
              return <ListeningLine key={item.id} count={item.count} />;
            case "archive":
              return <ArchiveBanner key={item.id} count={item.count} />;
            case "note":
              return (
                <VoiceNoteCard
                  key={item.id}
                  note={item.note}
                  creator={item.creator}
                  access={item.access}
                  sponsor={item.sponsor}
                  showHeader={item.showHeader}
                  queue={queue}
                />
              );
          }
        })}
        <AnimatePresence mode="wait">
          <PendingIndicator key={pending?.kind ?? "none"} pending={pending} />
        </AnimatePresence>
        <div ref={bottomRef} className="h-1" />
      </div>

      <AnimatePresence>
        {newArrival && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            onClick={() => {
              bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
              setNewArrival(null);
            }}
            className={cx(
              "fixed bottom-[calc(140px+env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-cream shadow-lg",
            )}
          >
            <IconArrowDown size={15} /> {newArrival}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function GroupIntro() {
  return (
    <div className="mx-auto max-w-[300px] pb-2 pt-4 text-center">
      <p className="display text-[30px]">The Group</p>
      <p className="mt-2 text-[13px] leading-relaxed text-stone">
        One conversation. The world&apos;s most interesting people drop in with thirty seconds when they have something to say.
      </p>
    </div>
  );
}
