// Mirrors local, optimistic state changes to Supabase and loads the shared
// catalog. Every function is a no-op in demo mode, so callers never branch.

import { getSupabase } from "./client";
import type { Catalog, Creator, FeedEvent, ReactionKind, Series, SeriesEpisode, Sponsor, User, VoiceNote } from "../types";

async function userId() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user?.id ?? null;
}

function quietly(p: PromiseLike<{ error: unknown }>) {
  Promise.resolve(p).then(({ error }) => {
    if (error) console.warn("VoysNote sync:", error);
  });
}

// ---------------------------------------------------------------------------
// Row <-> domain mapping

/* eslint-disable @typescript-eslint/no-explicit-any */
const toCreator = (r: any): Creator => ({
  id: r.id,
  name: r.name,
  username: r.username,
  avatar: r.avatar_url,
  portrait: r.portrait_url ?? undefined,
  bio: r.bio ?? "",
  role: r.role_line ?? "",
  category: r.category,
  verified: r.verified,
  foundingVoice: r.founding_voice,
  followers: r.followers_count ?? 0,
  joinedAt: r.joined_at,
  tone: r.tone ?? undefined,
});

const toNote = (r: any): VoiceNote => ({
  id: r.id,
  creatorId: r.creator_id,
  audioUrl: r.audio_url,
  duration: Number(r.duration),
  waveformData: r.waveform ?? [],
  title: r.title ?? "",
  transcript: r.transcript ?? "",
  createdAt: r.created_at,
  publishedAt: r.published_at,
  reactions: r.reaction_counts ?? {},
  premium: r.premium,
  earlyAccessUntil: r.early_access_until,
  sponsorId: r.sponsor_id,
  seriesId: r.series_id,
});

const toSeries = (r: any): Series => ({
  id: r.id,
  creatorId: r.creator_id,
  title: r.title,
  description: r.description ?? "",
  price: r.price_pence,
  currency: "GBP",
  billing: r.billing,
  coverImage: r.cover_image_url,
  sponsorId: r.sponsor_id,
  episodeCount: r.episode_count,
  unlockCadence: r.unlock_cadence,
  stripePriceId: r.stripe_price_id,
});

const toEpisode = (r: any): SeriesEpisode => ({
  id: r.id,
  seriesId: r.series_id,
  day: r.day,
  title: r.title,
  transcript: r.transcript ?? "",
  duration: Number(r.duration),
  audioUrl: r.audio_url,
  waveformData: r.waveform ?? [],
});
/* eslint-enable @typescript-eslint/no-explicit-any */

const fromDomain = {
  creators: (c: Creator) => ({
    id: c.id,
    name: c.name,
    username: c.username,
    avatar_url: c.avatar,
    portrait_url: c.portrait ?? null,
    bio: c.bio,
    role_line: c.role,
    category: c.category,
    verified: c.verified,
    founding_voice: c.foundingVoice,
    joined_at: c.joinedAt,
    tone: c.tone ?? null,
  }),
  voice_notes: (n: VoiceNote) => ({
    id: n.id,
    creator_id: n.creatorId,
    audio_url: n.audioUrl,
    duration: n.duration,
    waveform: n.waveformData,
    title: n.title,
    transcript: n.transcript,
    published_at: n.publishedAt,
    premium: n.premium,
    early_access_until: n.earlyAccessUntil ?? null,
    sponsor_id: n.sponsorId,
    series_id: n.seriesId ?? null,
  }),
  series: (s: Series) => ({
    id: s.id,
    creator_id: s.creatorId,
    title: s.title,
    description: s.description,
    price_pence: s.price,
    billing: s.billing,
    cover_image_url: s.coverImage,
    sponsor_id: s.sponsorId,
    episode_count: s.episodeCount,
    unlock_cadence: s.unlockCadence,
    stripe_price_id: s.stripePriceId ?? null,
  }),
  sponsors: (s: Sponsor) => ({ id: s.id, name: s.name, tagline: s.tagline, url: s.url }),
  feed_events: (e: FeedEvent) => ({ id: e.id, type: e.type, creator_id: e.creatorId, at: e.at }),
};

export async function loadRemoteCatalog(): Promise<Catalog | null> {
  const sb = getSupabase();
  if (!sb) return null;
  // Scheduled rows are included on purpose: the client times their arrival.
  const [creators, notes, series, episodes, sponsors, events] = await Promise.all([
    sb.from("creators").select("*"),
    sb.from("voice_notes").select("*"),
    sb.from("series").select("*"),
    sb.from("series_episodes").select("*"),
    sb.from("sponsors").select("*"),
    sb.from("feed_events").select("*"),
  ]);
  if (creators.error || notes.error) {
    console.warn("VoysNote: couldn't load catalog from Supabase, staying on demo content.", creators.error ?? notes.error);
    return null;
  }
  if (!creators.data?.length) return null; // empty project: keep demo content
  return {
    creators: creators.data.map(toCreator),
    notes: (notes.data ?? []).map(toNote),
    series: (series.data ?? []).map(toSeries),
    episodes: (episodes.data ?? []).map(toEpisode),
    sponsors: (sponsors.data ?? []) as Sponsor[],
    events: (events.data ?? []).map((r) => ({ id: r.id, type: r.type, creatorId: r.creator_id, at: r.at })),
  };
}

/** The signed-in listener's server-side state: entitlements win over local. */
export async function loadRemoteUserState() {
  const sb = getSupabase();
  const id = await userId();
  if (!sb || !id) return null;
  const [profile, follows, purchases, saved] = await Promise.all([
    sb.from("profiles").select("*").eq("id", id).maybeSingle(),
    sb.from("follows").select("creator_id").eq("user_id", id),
    sb.from("series_purchases").select("series_id, started_at").eq("user_id", id),
    sb.from("saved_notes").select("*").eq("user_id", id),
  ]);
  if (!profile.data) return null;
  return {
    subscriptionStatus: profile.data.subscription_status as User["subscriptionStatus"],
    role: profile.data.role as User["role"],
    follows: (follows.data ?? []).map((r) => r.creator_id as string),
    purchases: (purchases.data ?? []).map((r) => ({ seriesId: r.series_id as string, startedAt: r.started_at as string })),
    saved: (saved.data ?? []).map((r) => ({
      userId: id,
      noteId: r.note_id as string,
      collectionId: r.collection_id as string | null,
      createdAt: r.created_at as string,
    })),
  };
}

type AdminTable = keyof typeof fromDomain;

export const remote = {
  async upsertProfile(u: User) {
    const sb = getSupabase();
    const id = await userId();
    if (!sb || !id) return;
    quietly(sb.from("profiles").upsert({ id, name: u.name, avatar_url: u.avatar, email: u.email, interests: u.interests }));
  },
  async follow(creatorId: string, on: boolean) {
    const sb = getSupabase();
    const id = await userId();
    if (!sb || !id) return;
    quietly(on ? sb.from("follows").upsert({ user_id: id, creator_id: creatorId }) : sb.from("follows").delete().match({ user_id: id, creator_id: creatorId }));
  },
  async react(noteId: string, kind: ReactionKind | null) {
    const sb = getSupabase();
    const id = await userId();
    if (!sb || !id) return;
    quietly(kind ? sb.from("reactions").upsert({ user_id: id, note_id: noteId, kind }) : sb.from("reactions").delete().match({ user_id: id, note_id: noteId }));
  },
  async save(noteId: string, on: boolean) {
    const sb = getSupabase();
    const id = await userId();
    if (!sb || !id) return;
    quietly(on ? sb.from("saved_notes").upsert({ user_id: id, note_id: noteId }) : sb.from("saved_notes").delete().match({ user_id: id, note_id: noteId }));
  },
  async reply(noteId: string, text: string) {
    const sb = getSupabase();
    const id = await userId();
    if (!sb || !id) return;
    quietly(sb.from("replies").insert({ user_id: id, note_id: noteId, text }));
  },
  async play(noteId: string) {
    const sb = getSupabase();
    const id = await userId();
    if (!sb || !id) return;
    quietly(sb.from("plays").insert({ user_id: id, note_id: noteId }));
  },
  async signOut() {
    await getSupabase()?.auth.signOut();
  },
  admin: {
    async upsert<T extends AdminTable>(table: T, row: Parameters<(typeof fromDomain)[T]>[0]) {
      const sb = getSupabase();
      if (!sb) return { ok: true, remote: false };
      const { error } = await sb.from(table).upsert((fromDomain[table] as (x: typeof row) => object)(row));
      return { ok: !error, remote: true, error: error?.message };
    },
    /** Uploads to Storage and returns a public URL. Demo mode: data URL. */
    async upload(bucket: "avatars" | "audio" | "covers", file: File): Promise<string> {
      const sb = getSupabase();
      if (!sb) return fileToDataUrl(file);
      const path = `${Date.now()}-${file.name.replace(/[^a-z0-9.]+/gi, "-")}`;
      const { error } = await sb.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    },
  },
};

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
