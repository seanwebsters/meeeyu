// Builds The Group: one chronological conversation of joins, notes and
// quiet system lines. Oldest at the top, newest at the bottom, like a chat.

import { indexCatalog, isLive } from "./catalog";
import { noteAccess, type Entitlements, type NoteAccess } from "./access";
import type { Catalog, Creator, Sponsor, VoiceNote } from "./types";
import { LISTENING_BASE } from "./demo/seed";
import { dayLabel, seeded, TIME } from "./utils";

export type FeedItem =
  | { kind: "day"; id: string; label: string }
  | { kind: "joined"; id: string; creator: Creator; at: string }
  | { kind: "you-joined"; id: string; at: string }
  | { kind: "note"; id: string; note: VoiceNote; creator: Creator; access: NoteAccess; sponsor: Sponsor | null; showHeader: boolean }
  | { kind: "listening"; id: string; count: number }
  | { kind: "archive"; id: string; count: number };

export type Pending = { kind: "joining"; at: string } | { kind: "recording"; creator: Creator; at: string } | { kind: "scheduled"; at: string } | null;

interface Ctx {
  now: number;
  entitlements: Entitlements;
  userJoinedAt: string | null;
}

type Raw =
  | { t: number; kind: "joined"; creator: Creator; id: string }
  | { t: number; kind: "note"; note: VoiceNote; creator: Creator; access: NoteAccess; id: string }
  | { t: number; kind: "you-joined"; id: string };

export function buildFeed(catalog: Catalog, ctx: Ctx): { items: FeedItem[]; pending: Pending; playable: VoiceNote[] } {
  const idx = indexCatalog(catalog);
  const raw: Raw[] = [];
  let archived = 0;

  for (const ev of catalog.events) {
    const creator = idx.creators.get(ev.creatorId);
    if (!creator || !isLive(ev.at, ctx.now)) continue;
    const t = new Date(ev.at).getTime();
    if (!ctx.entitlements.plus && ctx.now - t > 7 * TIME.DAY) continue;
    raw.push({ t, kind: "joined", creator, id: ev.id });
  }

  for (const note of catalog.notes) {
    const creator = idx.creators.get(note.creatorId);
    if (!creator) continue;
    const access = noteAccess(note, ctx.entitlements, ctx.now);
    if (access.state === "hidden") continue;
    if (access.state === "locked" && access.reason === "archive") {
      archived++;
      continue;
    }
    raw.push({ t: new Date(note.publishedAt).getTime(), kind: "note", note, creator, access, id: note.id });
  }

  if (ctx.userJoinedAt) raw.push({ t: new Date(ctx.userJoinedAt).getTime(), kind: "you-joined", id: "you" });

  raw.sort((a, b) => a.t - b.t);

  const items: FeedItem[] = [];
  if (archived) items.push({ kind: "archive", id: "archive", count: archived });

  let lastDay = "";
  let lastSpeaker = "";
  let sinceSystem = 0;
  const rnd = seeded("listening");
  for (const r of raw) {
    const label = dayLabel(new Date(r.t).toISOString(), ctx.now);
    if (label !== lastDay) {
      items.push({ kind: "day", id: `day_${label}`, label });
      lastDay = label;
      lastSpeaker = "";
    }
    if (r.kind === "joined") {
      items.push({ kind: "joined", id: r.id, creator: r.creator, at: new Date(r.t).toISOString() });
      lastSpeaker = "";
    } else if (r.kind === "you-joined") {
      items.push({ kind: "you-joined", id: r.id, at: new Date(r.t).toISOString() });
      lastSpeaker = "";
    } else {
      items.push({
        kind: "note",
        id: r.id,
        note: r.note,
        creator: r.creator,
        access: r.access,
        sponsor: r.note.sponsorId ? (idx.sponsors.get(r.note.sponsorId) ?? null) : null,
        // Consecutive notes from one person group like chat bubbles.
        showHeader: lastSpeaker !== r.creator.id,
      });
      lastSpeaker = r.creator.id;
      sinceSystem++;
      if (sinceSystem >= 7) {
        items.push({ kind: "listening", id: `listening_${r.id}`, count: Math.round(LISTENING_BASE * (0.7 + rnd() * 0.6)) });
        sinceSystem = 0;
        lastSpeaker = "";
      }
    }
  }

  const playable = items.flatMap((i) => (i.kind === "note" && i.access.state === "open" ? [i.note] : []));
  return { items, pending: pendingMoment(catalog, ctx.now), playable };
}

/** What's about to happen: drives the typing indicator and the teaser. */
export function pendingMoment(catalog: Catalog, now: number): Pending {
  const idx = indexCatalog(catalog);
  const upcomingJoins = catalog.events.filter((e) => !isLive(e.at, now)).sort((a, b) => +new Date(a.at) - +new Date(b.at));
  const upcomingNotes = catalog.notes.filter((n) => !isLive(n.publishedAt, now)).sort((a, b) => +new Date(a.publishedAt) - +new Date(b.publishedAt));

  const join = upcomingJoins[0];
  const note = upcomingNotes[0];

  if (join && new Date(join.at).getTime() - now < 25_000) return { kind: "joining", at: join.at };
  if (note) {
    const creator = idx.creators.get(note.creatorId);
    const joined = creator && isLive(creator.joinedAt, now);
    if (creator && joined && new Date(note.publishedAt).getTime() - now < 18_000) return { kind: "recording", creator, at: note.publishedAt };
  }
  if (join && new Date(join.at).getTime() - now < 2 * TIME.DAY) return { kind: "scheduled", at: join.at };
  return null;
}

/** A gently drifting audience number for the header. */
export function listeningNow(now: number) {
  const minute = Math.floor(now / 7000);
  const r = seeded(String(minute))();
  return LISTENING_BASE + Math.round((r - 0.4) * 160);
}
