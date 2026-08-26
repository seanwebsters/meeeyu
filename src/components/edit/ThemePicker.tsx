"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/db/profiles";
import { BACKGROUNDS } from "@/lib/backgrounds";
import type { BackgroundKey, Profile } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const THEME_KEYS = Object.keys(BACKGROUNDS) as BackgroundKey[];

export function ThemePicker({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const [background, setBackground] = useState(profile.background);
  const [isPremium, setIsPremium] = useState(profile.is_premium);
  const [unlocking, setUnlocking] = useState(false);

  async function selectTheme(key: BackgroundKey) {
    const theme = BACKGROUNDS[key];
    if (theme.premium && !isPremium) return;
    setBackground(key);
    await updateProfile(supabase, profile.id, { background: key });
  }

  async function unlockPremium() {
    setUnlocking(true);
    try {
      // NOTE: no payment processor is wired up yet — this just flips the
      // flag so the feature is testable end-to-end. Before a real launch,
      // move this behind a server-verified purchase instead of a client
      // write (see supabase/migrations/0002_premium_themes.sql).
      await updateProfile(supabase, profile.id, { is_premium: true });
      setIsPremium(true);
    } finally {
      setUnlocking(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-soft">
        pick a background and colour theme for your whole meeeyu.
      </p>

      {!isPremium && (
        <div className="scrapbook-shadow space-y-3 rounded-2xl bg-gradient-to-br from-pink-soft via-lavender to-mint p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <p className="font-semibold">meeeyu premium</p>
          </div>
          <p className="text-sm text-ink/80">
            unlock every background &amp; colour theme — dreamy lilac, midnight,
            sunset, fresh mint, y2k chrome — and reskin your whole scrapbook.
          </p>
          <Button onClick={unlockPremium} disabled={unlocking} className="w-full">
            {unlocking ? "unlocking…" : "unlock premium"}
          </Button>
          <p className="text-center text-[11px] text-ink/60">
            demo mode — this unlocks instantly, no payment wired up yet
          </p>
        </div>
      )}

      {isPremium && (
        <div className="scrapbook-shadow flex items-center gap-2 rounded-2xl bg-paper-card p-3 text-sm font-semibold">
          <span>✨</span> premium unlocked — every theme is yours
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {THEME_KEYS.map((key) => {
          const theme = BACKGROUNDS[key];
          const locked = theme.premium && !isPremium;
          const selected = background === key;
          const [paper, pink, ink] = theme.swatch;
          return (
            <button
              key={key}
              type="button"
              onClick={() => selectTheme(key)}
              disabled={locked}
              className={cn(
                "scrapbook-shadow flex flex-col items-center gap-2 rounded-2xl p-3 transition-transform",
                selected ? "ring-2 ring-pink ring-offset-2 ring-offset-paper" : "",
                locked ? "cursor-not-allowed opacity-70" : "active:scale-95"
              )}
              style={{ background: paper }}
            >
              <span className="relative flex h-9 w-9 items-center justify-center">
                <span
                  className="absolute inset-0 rounded-full"
                  style={{ background: `conic-gradient(${pink} 0deg 180deg, ${ink} 180deg 360deg)` }}
                />
                {locked && (
                  <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-sm">
                    🔒
                  </span>
                )}
              </span>
              <span className="text-xs font-semibold" style={{ color: ink }}>
                {theme.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
