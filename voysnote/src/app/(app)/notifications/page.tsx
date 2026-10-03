"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { buildNotifications } from "@/lib/notifications";
import { actions, useApp, useCatalog } from "@/lib/store/app";
import { useNow } from "@/lib/store/clock";
import { cx, relativeShort } from "@/lib/utils";
import type { NotificationKind } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { IconBack } from "@/components/icons";

const LABEL: Record<NotificationKind, string> = {
  joined: "Joined",
  dropped: "New voice",
  followed_dropped: "Following",
  exclusive: "Exclusive",
  series: "Series",
};

export default function NotificationsPage() {
  const router = useRouter();
  const { catalog, idx } = useCatalog();
  const follows = useApp((s) => s.follows);
  const now = useNow();
  // Freeze "last seen" for this visit so new items stay highlighted.
  const lastSeen = useApp((s) => s.notificationsSeenAt);
  const [highlightBefore] = useState(() => lastSeen);

  const items = useMemo(() => buildNotifications(catalog, follows, now), [catalog, follows, now]);

  useEffect(() => {
    actions.markNotificationsSeen();
  }, [items.length]);

  return (
    <div className="pb-40">
      <header className="sticky top-0 z-20 flex items-center gap-2 bg-cream/85 px-3 pb-3 pt-[max(14px,env(safe-area-inset-top))] backdrop-blur-xl">
        <button onClick={() => (history.length > 1 ? router.back() : router.push("/"))} aria-label="Back" className="rounded-full p-2 hover:bg-mist">
          <IconBack size={20} />
        </button>
        <h1 className="text-[17px] font-semibold">Notifications</h1>
      </header>

      {follows.length === 0 && (
        <div className="mx-5 mb-2 rounded-[20px] bg-paper p-4 text-[13px] leading-relaxed text-ink-2 ring-1 ring-line">
          Follow a few voices and we&apos;ll tell you when <b>someone you follow has something to say</b>.
        </div>
      )}

      <ul className="px-3">
        {items.map((n) => {
          const c = idx.creators.get(n.creatorId)!;
          const fresh = !highlightBefore || new Date(n.at) > new Date(highlightBefore);
          const href = n.seriesId ? `/series/${n.seriesId}` : n.noteId && n.kind !== "joined" ? `/n/${n.noteId}` : `/c/${c.username}`;
          return (
            <li key={n.id}>
              <Link href={href} className={cx("flex items-center gap-3 rounded-[20px] px-2 py-3", fresh && "bg-paper")}>
                <span className="relative">
                  <Avatar src={c.avatar} name={c.name} tone={c.tone} size={46} />
                  {fresh && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-cream bg-ember" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] leading-snug text-ink">{n.text}</p>
                  <p className="mt-0.5 text-[12px] text-stone">
                    {LABEL[n.kind]} · {relativeShort(n.at, now)}
                  </p>
                </div>
                {n.kind === "exclusive" && (
                  <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cream">Plus</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
