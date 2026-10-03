"use client";

import Link from "next/link";
import type { Creator } from "@/lib/types";
import { actions, useApp } from "@/lib/store/app";
import { cx, formatCount } from "@/lib/utils";
import { Avatar } from "../ui/Avatar";
import { IconStar, Verified } from "../icons";

export function FollowButton({ creator, size = "sm" }: { creator: Creator; size?: "sm" | "md" }) {
  const following = useApp((s) => s.follows.includes(creator.id));
  return (
    <button
      onClick={() => actions.toggleFollow(creator.id)}
      aria-pressed={following}
      className={cx(
        "shrink-0 rounded-full font-semibold transition-colors active:scale-95",
        size === "sm" ? "h-8 px-3.5 text-[13px]" : "h-11 px-6 text-[15px]",
        following ? "bg-mist text-ink" : "bg-ink text-cream hover:bg-ink-2",
      )}
    >
      {following ? "following" : "follow"}
    </button>
  );
}

export function CreatorRow({ creator, meta }: { creator: Creator; meta?: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Link href={`/c/${creator.username}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar src={creator.avatar} name={creator.name} tone={creator.tone} size={48} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[15px] font-semibold">
            <span className="truncate">{creator.name}</span>
            {creator.verified && <Verified size={13} className="shrink-0 text-ink" />}
          </p>
          <p className="truncate text-[13px] text-stone">{meta ?? `${creator.role} · ${formatCount(creator.followers)} followers`}</p>
        </div>
      </Link>
      <FollowButton creator={creator} />
    </div>
  );
}

export function FoundingBadge({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full bg-mist px-2.5 py-1 text-[12px] font-medium text-ink", className)}>
      <IconStar size={11} />
      founding voice
    </span>
  );
}
