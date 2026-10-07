"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { buildFeed, listeningNow } from "@/lib/feed";
import { joinedCreators } from "@/lib/catalog";
import { buildNotifications } from "@/lib/notifications";
import { noteToPlayable } from "@/lib/audio/playable";
import { GROUP_SIZE } from "@/lib/demo/seed";
import { useApp, useCatalog, useEntitlements } from "@/lib/store/app";
import { useNow } from "@/lib/store/clock";
import type { Creator } from "@/lib/types";
import { cx, firstName, formatCount } from "@/lib/utils";
import { CreatorRow } from "../creator/CreatorRow";
import { IconArrowDown, IconBell, IconDiscover } from "../icons";
import { VoiceNoteCard } from "../note/VoiceNoteCard";
import { ArchiveBanner, DayDivider, JoinedMoment, ListeningLine, PendingIndicator, YouJoined } from "./SystemItems";

type Tab = "group" | "following" | "foryou";
const TABS: [Tab, string][] = [
  ["group", "group"],
  ["following", "following"],
  ["foryou", "for you"],
];

export function GroupScreen() {
  const { catalog, idx } = useCatalog();
  const entitlements = useEntitlements();
  const userJoinedAt = useApp((s) => s.user?.joinedAt ?? null);
  const interests = useApp((s) => s.user?.interests);
  const follows = useApp((s) => s.follows);
  const seenAt = useApp((s) => s.notificationsSeenAt);
  const now = useNow();
  const [tab, setTab] = useState<Tab>("group");

  // Rebuild only when something actually becomes live, not every second.
  const liveKey = useMemo(() => {
    const times = [...catalog.events.map((e) => e.at), ...catalog.notes.map((n) => n.publishedAt), ...catalog.notes.map((n) => n.earlyAccessUntil ?? "")];
    return times.filter((t) => t && new Date(t).getTime() <= now).length + ":" + Math.floor(now / 5000);
  }, [catalog, now]);

  const only = useMemo<((c: Creator) => boolean) | undefined>(() => {
    if (tab === "following") return (c) => follows.includes(c.id);
    if (tab === "foryou") return (c) => !interests?.length || interests.includes(c.category);
    return undefined;
  }, [tab, follows, interests]);

  const { items, pending, playable } = useMemo(
    () => buildFeed(catalog, { now, entitlements, userJoinedAt, only }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- liveKey stands in for `now`
    [catalog, entitlements, userJoinedAt, liveKey, only],
  );

  const queue = useMemo(() => playable.map((n) => noteToPlayable(n, idx.creators.get(n.creatorId)!)), [playable, idx]);
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

  const toBottom = (smooth = false) => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: smooth ? "smooth" : "auto" });

  useLayoutEffect(() => {
    if (!first.current) return;
    first.current = false;
    toBottom();
    // Navigation resets scroll after mount; settle on the latest message.
    const raf = requestAnimationFrame(() => toBottom());
    const t = setTimeout(() => toBottom(), 120);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (first.current) return;
    const nearBottom = window.innerHeight + window.scrollY > document.documentElement.scrollHeight - 480;
    if (nearBottom) {
      requestAnimationFrame(() => toBottom(true));
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

  const switchTab = (t: Tab) => {
    setTab(t);
    requestAnimationFrame(() => toBottom());
  };

  const noteCount = items.filter((i) => i.kind === "note").length;

  return (
    <div className="pb-44">
      <header className="sticky top-0 z-30 bg-cream/[0.97] backdrop-blur-xl">
        <div className="flex items-center gap-1 px-5 pb-0.5 pt-[max(14px,env(safe-area-inset-top))]">
          <h1 className="wordmark flex-1 text-[30px]">VoysNote</h1>
          <Link href="/discover?search=1" aria-label="Search" className="rounded-full p-2 text-ink">
            <IconDiscover size={21} />
          </Link>
          <Link href="/notifications" aria-label={`Notifications${unread ? `, ${unread} new` : ""}`} className="relative -mr-2 rounded-full p-2 text-ink">
            <IconBell size={21} />
            {unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-heart" />}
          </Link>
        </div>

        <p className="flex items-center gap-1.5 px-5 text-[12px] text-stone">
          <span className="live-dot h-2 w-2 rounded-full bg-live" />
          {formatCount(GROUP_SIZE)} in the chat · {listeningNow(now).toLocaleString("en-GB")} tuned in
        </p>

        <nav className="flex gap-1 px-4 pb-3 pt-3">
          {TABS.map(([k, label]) => (
            <button
              key={k}
              onClick={() => switchTab(k)}
              className={cx("relative h-9 rounded-full px-4 text-[14px] font-semibold transition-colors", tab === k ? "text-cream" : "text-stone")}
            >
              {tab === k && (
                <motion.span
                  layoutId="group-tab"
                  className="absolute inset-0 rounded-full bg-ink"
                  transition={{ type: "spring", damping: 28, stiffness: 400 }}
                />
              )}
              <span className="relative">{label}</span>
            </button>
          ))}
        </nav>
      </header>

      <div className="space-y-7 px-5 pt-3">
        {tab !== "group" && noteCount === 0 && <EmptyTab tab={tab} />}
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
              return <VoiceNoteCard key={item.id} note={item.note} creator={item.creator} access={item.access} sponsor={item.sponsor} queue={queue} />;
          }
        })}
        {tab === "group" && (
          <AnimatePresence mode="wait">
            <PendingIndicator key={pending?.kind ?? "none"} pending={pending} />
          </AnimatePresence>
        )}
        <div ref={bottomRef} className="h-1" />
      </div>

      <AnimatePresence>
        {newArrival && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            onClick={() => {
              toBottom(true);
              setNewArrival(null);
            }}
            className="fixed bottom-[calc(140px+env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-black shadow-lg"
          >
            <IconArrowDown size={15} /> {newArrival}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyTab({ tab }: { tab: Tab }) {
  const { catalog } = useCatalog();
  const now = useNow();
  const follows = useApp((s) => s.follows);
  const suggestions = joinedCreators(catalog, now)
    .filter((c) => !follows.includes(c.id))
    .slice(-4)
    .reverse();
  return (
    <div className="card px-4 py-5">
      <p className="text-[16px] font-semibold">{tab === "following" ? "Follow a few voices" : "Nothing here yet"}</p>
      <p className="mt-1 text-[13px] text-stone">
        {tab === "following" ? "Their notes will gather here, in order, like a smaller group chat." : "Add more interests in your profile to tune this tab."}
      </p>
      {tab === "following" && (
        <div className="mt-3 divide-y divide-line/70">
          {suggestions.map((c) => (
            <CreatorRow key={c.id} creator={c} meta={c.role} />
          ))}
        </div>
      )}
    </div>
  );
}
