import type { Catalog, Creator, FeedEvent, Series, SeriesEpisode, Sponsor, VoiceNote } from "./types";
import { SEED_CREATORS, SEED_EPISODES, SEED_NOTES, SEED_SERIES, SEED_SPONSORS, creatorFromSeed, seedReactions, speechSeconds } from "./demo/seed";
import { makeWaveform } from "./utils";

/** Content created in the admin dashboard (demo mode keeps it locally). */
export interface AdminContent {
  creators: Creator[];
  notes: VoiceNote[];
  series: Series[];
  episodes: SeriesEpisode[];
  sponsors: Sponsor[];
  events: FeedEvent[];
}

export const EMPTY_ADMIN: AdminContent = {
  creators: [],
  notes: [],
  series: [],
  episodes: [],
  sponsors: [],
  events: [],
};

/** Resolves the relative seed timeline against a session anchor. */
export function buildSeedCatalog(anchor: number): Catalog {
  const at = (minutesAgo: number) => new Date(anchor - minutesAgo * 60_000).toISOString();

  const creators = SEED_CREATORS.map((c) => creatorFromSeed(c, at(c.joinedMinutesAgo)));
  const events: FeedEvent[] = SEED_CREATORS.map((c) => ({
    id: `ev_join_${c.id}`,
    type: "joined",
    creatorId: c.id,
    at: at(c.joinedMinutesAgo),
  }));

  const notes: VoiceNote[] = SEED_NOTES.map((n, i) => {
    const followers = SEED_CREATORS.find((c) => c.id === n.creatorId)?.followers ?? 10_000;
    const minutesAgo = n.minutesAgo;
    return {
      id: n.id,
      creatorId: n.creatorId,
      audioUrl: null,
      duration: speechSeconds(n.transcript),
      waveformData: makeWaveform(n.id),
      title: n.title,
      transcript: n.transcript,
      createdAt: at(minutesAgo + 30),
      publishedAt: at(minutesAgo),
      // Fresh notes start small and visibly climb; older ones have settled.
      reactions: minutesAgo < 0 ? {} : seedReactions(Math.round(followers / 97) + i * 131),
      premium: !!n.premium,
      earlyAccessUntil: n.earlyAccessMinutes ? at(minutesAgo - n.earlyAccessMinutes) : null,
      sponsorId: n.sponsorId ?? null,
      seriesId: n.seriesId ?? null,
    };
  });

  const episodes: SeriesEpisode[] = SEED_EPISODES.map((e) => ({ ...e, waveformData: makeWaveform(e.id) }));

  return { creators, notes, series: SEED_SERIES, episodes, sponsors: SEED_SPONSORS, events };
}

function mergeById<T extends { id: string }>(base: T[], extra: T[]) {
  if (!extra.length) return base;
  const map = new Map(base.map((x) => [x.id, x]));
  for (const x of extra) map.set(x.id, x);
  return [...map.values()];
}

export function mergeCatalog(base: Catalog, admin: AdminContent): Catalog {
  return {
    creators: mergeById(base.creators, admin.creators),
    notes: mergeById(base.notes, admin.notes),
    series: mergeById(base.series, admin.series),
    episodes: mergeById(base.episodes, admin.episodes),
    sponsors: mergeById(base.sponsors, admin.sponsors),
    events: mergeById(base.events, admin.events),
  };
}

/** Index helpers. Cheap enough to rebuild per catalog. */
export function indexCatalog(c: Catalog) {
  const creators = new Map(c.creators.map((x) => [x.id, x]));
  const byUsername = new Map(c.creators.map((x) => [x.username, x]));
  const notes = new Map(c.notes.map((x) => [x.id, x]));
  const series = new Map(c.series.map((x) => [x.id, x]));
  const sponsors = new Map(c.sponsors.map((x) => [x.id, x]));
  return { creators, byUsername, notes, series, sponsors };
}
export type CatalogIndex = ReturnType<typeof indexCatalog>;

export function isLive(iso: string, now: number) {
  return new Date(iso).getTime() <= now;
}

/** Creators who have joined by `now`. */
export function joinedCreators(c: Catalog, now: number) {
  return c.creators.filter((x) => isLive(x.joinedAt, now));
}

export function publishedNotes(c: Catalog, now: number) {
  return c.notes.filter((n) => isLive(n.publishedAt, now)).sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
}

export function totalReactions(n: VoiceNote) {
  return Object.values(n.reactions).reduce((a, b) => a + (b ?? 0), 0);
}
