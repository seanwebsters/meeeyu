"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { addReaction } from "@/lib/db/reactions";
import { cn } from "@/lib/utils";

const EMOJIS = ["❤️", "😂", "😮", "🔥", "👀"];

export function ReactionBar({
  profileId,
  viewerId,
  initialCounts,
}: {
  profileId: string;
  viewerId: string | null;
  initialCounts: Record<string, number>;
}) {
  const supabase = createClient();
  const [counts, setCounts] = useState(initialCounts);
  const [justPopped, setJustPopped] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function react(emoji: string) {
    if (sending) return;
    setSending(true);
    setCounts((c) => ({ ...c, [emoji]: (c[emoji] ?? 0) + 1 }));
    setJustPopped(emoji);
    setTimeout(() => setJustPopped(null), 350);
    try {
      await addReaction(supabase, {
        profile_id: profileId,
        emoji,
        reactor_id: viewerId ?? undefined,
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => react(emoji)}
          className={cn(
            "scrapbook-shadow flex items-center gap-1.5 rounded-full bg-paper-card px-3 py-1.5 text-base",
            justPopped === emoji && "reaction-pop"
          )}
        >
          <span>{emoji}</span>
          {counts[emoji] ? (
            <span className="text-xs font-semibold text-ink-soft">
              {counts[emoji]}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
