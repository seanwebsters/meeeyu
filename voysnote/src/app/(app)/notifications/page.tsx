"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildNotifications } from "@/lib/notifications";
import { noteToPlayable } from "@/lib/audio/playable";
import { player, usePlayer } from "@/lib/audio/engine";
import { actions, useApp, useCatalog } from "@/lib/store/app";
import { useNow } from "@/lib/store/clock";
import { ago, cx, dayLabel, seeded, TIME } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { IconCrown, IconHeartFill, IconLock, IconPause, IconPlay, IconSettings } from "@/components/icons";

type Item = AppNotification | { id: string; kind: "reply_likes"; at: string; text: string; sub: string };

export default function NotificationsPage() {
  const { catalog } = useCatalog();
  const follows = useApp((s) => s.follows);
  const replies = useApp((s) => s.replies);
  const now = useNow();
  // Freeze "last seen" for this visit so new items stay highlighted.
  const lastSeen = useApp((s) => s.notificationsSeenAt);
  const [highlightBefore] = useState(() => lastSeen);

  const items = useMemo<Item[]>(() => {
    const base: Item[] = buildNotifications(catalog, follows, now);
    // Your own replies collect a few likes after a while.
    for (const r of replies) {
      const at = new Date(r.at).getTime() + 3 * TIME.MIN;
      if (at > now) continue;
      const likes = 2 + Math.floor(seeded(r.id)() * 40);
      base.push({ id: `rl_${r.id}`, kind: "reply_likes", at: new Date(at).toISOString(), text: `Your reply got ${likes} likes`, sub: `“${r.text}”` });
    }
    return base.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [catalog, follows, replies, now]);

  const groups = useMemo(() => {
    const out: { label: string; items: Item[] }[] = [];
    for (const n of items) {
      const d = dayLabel(n.at, now);
      const label = d === "Today" || d === "Yesterday" ? d : "Earlier";
      const g = out.at(-1);
      if (g?.label === label) g.items.push(n);
      else out.push({ label, items: [n] });
    }
    return out;
  }, [items, now]);

  useEffect(() => {
    actions.markNotificationsSeen();
  }, [items.length]);

  return (
    <div className="pb-40">
      <header className="sticky top-0 z-20 bg-cream/90 px-5 pt-[max(14px,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex h-10 items-center">
          <span className="wordmark flex-1 text-[22px]">VoysNote</span>
          <Link href="/profile" aria-label="Settings" className="-mr-2 rounded-full p-2 hover:bg-mist">
            <IconSettings size={22} />
          </Link>
        </div>
        <h1 className="display pb-2 pt-3 text-[28px]">Notifications</h1>
      </header>

      {follows.length === 0 && (
        <div className="mx-5 mb-2 mt-2 rounded-[18px] bg-accent-soft p-4 text-[13px] leading-relaxed text-ink-2">
          Follow a few voices and we&apos;ll tell you when <b>someone you follow has something to say</b>.
        </div>
      )}

      {groups.map((g) => (
        <section key={g.label} className="px-5 pt-3">
          <h2 className="pb-1 text-[14px] font-semibold">{g.label}</h2>
          <ul className="divide-y divide-line/60">
            {g.items.map((n) => (
              <Row key={n.id} n={n} fresh={!highlightBefore || new Date(n.at) > new Date(highlightBefore)} now={now} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Row({ n, fresh, now }: { n: Item; fresh: boolean; now: number }) {
  const { idx } = useCatalog();
  const following = useApp((s) => ("creatorId" in n ? s.follows.includes(n.creatorId) : true));
  const status = usePlayer((s) => ("noteId" in n && s.current?.id === n.noteId ? s.status : "idle"));

  if (n.kind === "reply_likes") {
    return (
      <li className="flex items-center gap-3 py-3">
        <IconCircle className="bg-heart/10 text-heart">
          <IconHeartFill size={18} />
        </IconCircle>
        <Body title={n.text} sub={n.sub} time={ago(n.at, now)} fresh={fresh} />
      </li>
    );
  }

  const c = idx.creators.get(n.creatorId)!;
  const note = n.noteId ? idx.notes.get(n.noteId) : undefined;
  const href = n.seriesId ? `/series/${n.seriesId}` : n.kind === "exclusive" ? "/plus" : n.kind === "joined" ? `/c/${c.username}` : `/n/${n.noteId}`;
  const title =
    n.kind === "joined"
      ? `${c.name.replace(/^Dr /, "")} joined the group`
      : n.kind === "exclusive"
        ? "Exclusive drop unlocked"
        : n.kind === "series"
          ? n.text
          : n.kind === "followed_dropped"
            ? `${c.name.replace(/^Dr /, "")} has something to say`
            : `New VoysNote from ${c.name.replace(/^Dr /, "")}`;
  const sub = n.kind === "exclusive" ? `${c.name} posted something for VoysNote+ members.` : note ? note.title : c.role;

  return (
    <li className="flex items-center gap-3 py-3">
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
        {n.kind === "exclusive" ? (
          <IconCircle className="bg-gold-soft text-gold">
            <IconLock size={18} />
          </IconCircle>
        ) : n.kind === "series" ? (
          <IconCircle className="bg-accent-soft text-accent">
            <IconCrown size={18} />
          </IconCircle>
        ) : (
          <Avatar src={c.avatar} name={c.name} tone={c.tone} size={42} />
        )}
        <Body title={title} sub={sub} time={ago(n.at, now)} fresh={fresh} />
      </Link>
      {note && (n.kind === "dropped" || n.kind === "followed_dropped") && (
        <button
          onClick={() => player.toggle(noteToPlayable(note, c))}
          aria-label={status === "playing" ? "Pause" : "Play"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-cream"
        >
          {status === "playing" ? <IconPause size={13} /> : <IconPlay size={13} className="translate-x-[1px]" />}
        </button>
      )}
      {n.kind === "joined" && !following && (
        <button onClick={() => actions.toggleFollow(c.id)} className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-[12px] font-semibold text-cream">
          Follow
        </button>
      )}
    </li>
  );
}

function IconCircle({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={cx("flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full", className)}>{children}</span>;
}

function Body({ title, sub, time, fresh }: { title: string; sub: string; time: string; fresh: boolean }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="flex items-center gap-1.5 truncate text-[14px] font-semibold leading-tight">
        <span className="truncate">{title}</span>
        {fresh && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
      </p>
      <p className="mt-0.5 truncate text-[12px] text-stone">{sub}</p>
      <p className="text-[11px] text-stone-2">{time}</p>
    </div>
  );
}
