// Entitlements. One place decides what a listener can hear, so web, native
// and the server (RLS mirrors this) agree.

import type { Series, SeriesEpisode, VoiceNote } from "./types";
import { TIME } from "./utils";

export const FREE_ARCHIVE_DAYS = 7;

export interface Entitlements {
  plus: boolean;
  purchasedSeries: string[];
  /** When a listener started each series (daily unlocks count from here). */
  seriesStartedAt: Record<string, string>;
}

export type NoteAccess = { state: "open"; early?: boolean } | { state: "locked"; reason: "plus" | "early" | "archive" } | { state: "hidden" };

export function noteAccess(note: VoiceNote, e: Entitlements, now: number): NoteAccess {
  const published = new Date(note.publishedAt).getTime();
  if (published > now) return { state: "hidden" };
  // VoysNote+ means no sponsored drops in the main group.
  if (note.sponsorId && e.plus) return { state: "hidden" };

  const early = note.earlyAccessUntil ? new Date(note.earlyAccessUntil).getTime() > now : false;
  if (early) return e.plus ? { state: "open", early: true } : { state: "locked", reason: "early" };
  if (note.premium && !e.plus) return { state: "locked", reason: "plus" };
  if (!e.plus && now - published > FREE_ARCHIVE_DAYS * TIME.DAY) return { state: "locked", reason: "archive" };
  return { state: "open" };
}

export function ownsSeries(series: Series, e: Entitlements) {
  return series.price === 0 || e.purchasedSeries.includes(series.id);
}

/** How many episodes are unlocked today (1-based day count). */
export function unlockedEpisodes(series: Series, e: Entitlements, now: number) {
  if (!ownsSeries(series, e) || !e.seriesStartedAt[series.id]) return 0;
  if (series.unlockCadence === "all") return series.episodeCount;
  const started = new Date(e.seriesStartedAt[series.id]);
  started.setHours(0, 0, 0, 0);
  const days = Math.floor((now - started.getTime()) / TIME.DAY) + 1;
  return Math.max(1, Math.min(series.episodeCount, days));
}

export function episodeAccess(ep: SeriesEpisode, series: Series, e: Entitlements, now: number) {
  // The first episode is always a free taste.
  if (ep.day === 1) return "open" as const;
  if (!ownsSeries(series, e)) return "purchase" as const;
  return ep.day <= unlockedEpisodes(series, e, now) ? ("open" as const) : ("upcoming" as const);
}
