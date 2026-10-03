"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { buildFeed } from "@/lib/feed";
import { joinedCreators } from "@/lib/catalog";
import { buildNotifications } from "@/lib/notifications";
import { noteToPlayable } from "@/lib/audio/playable";
import { GROUP_SIZE } from "@/lib/demo/seed";
import { useApp, useCatalog, useEntitlements } from "@/lib/store/app";
import { useNow } from "@/lib/store/clock";
import type { Creator } from "@/lib/types";
import { cx, firstName, formatCount } from "@/lib/utils";
import { Avatar } from "../ui/Avatar";
import { CreatorRow } from "../creator/CreatorRow";
import { IconArrowDown, IconBell, IconDiscover } from "../icons";
import { VoiceNoteCard } from "../note/VoiceNoteCard";
import { ArchiveBanner, DayDivider, JoinedMoment, ListeningLine, PendingIndicator, YouJoined } from "./SystemItems";

type Tab = "group" | "following" | "foryou";
const TABS: [Tab, string][] = [
  ["group", "Group"],
  ["following", "Following"],
  ["foryou", "For You"],
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
      <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-5 pb-1 pt-[max(14px,env(safe-area-inset-top))]">
          <h1 className="wordmark flex-1 text-[22px]">VoysNote</h1>
          <Link href="/discover?search=1" aria-label="Search" className="rounded-full p-2 text-ink hover:bg-mist">
            <IconDiscover size={22} />
          </Link>
          <Link
            href="/notifications"
            aria-label={`Notifications${unread ? `, ${unread} new` : ""}`}
            className="relative -mr-2 rounded-full p-2 text-ink hover:bg-mist"
          >
            <IconBell size={22} />
            {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-cream bg-heart" />}
          </Link>
        </div>

        <div className="flex items-center gap-2 px-5 pb-3 pt-1.5">
          <div className="flex -space-x-2">
            {members
              .slice(-6)
              .reverse()
              .map((c) => (
                <Link key={c.id} href={`/c/${c.username}`}>
                  <Avatar src={c.avatar} name={c.name} tone={c.tone} size={30} className="rounded-full ring-2 ring-cream" />
                </Link>
              ))}
          </div>
          <span className="text-[12px] text-stone">+{formatCount(GROUP_SIZE)} in the group</span>
        </div>

        <nav className="flex gap-6 border-b border-line px-5">
          {TABS.map(([k, label]) => (
            <button
              key={k}
              onClick={() => switchTab(k)}
              className={cx("relative pb-2.5 text-[14px] font-medium transition-colors", tab === k ? "text-ink" : "text-stone")}
            >
              {label}
              {tab === k && <motion.span layoutId="group-tab" className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-accent" />}
            </button>
          ))}
        </nav>
      </header>

      <div className="space-y-3 px-4 pt-4">
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
            className="fixed bottom-[calc(140px+env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-cream shadow-lg"
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
