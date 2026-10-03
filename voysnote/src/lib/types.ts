// Domain model. Plain types with no framework coupling, so a native client
// (Expo / Capacitor) can reuse them as-is. Mirrors supabase/migrations.

export const CATEGORIES = ["Creativity", "Business", "Music", "Sport", "Life", "Confidence", "Culture", "Wellness"] as const;
export type Category = (typeof CATEGORIES)[number];

export const MAX_NOTE_SECONDS = 30;

export type SubscriptionStatus = "free" | "plus";

export interface User {
  id: string;
  name: string;
  avatar: string | null;
  email: string | null;
  interests: Category[];
  subscriptionStatus: SubscriptionStatus;
  role: "member" | "admin";
  joinedAt: string;
}

export interface Creator {
  id: string;
  name: string;
  username: string;
  avatar: string;
  /** Tall editorial portrait for the profile hero. Falls back to avatar. */
  portrait?: string;
  bio: string;
  /** One-line descriptor shown under the name, e.g. "Novelist". */
  role: string;
  category: Category;
  verified: boolean;
  foundingVoice: boolean;
  followers: number;
  joinedAt: string;
  /** Tints the monogram fallback when the portrait can't load. */
  tone?: string;
  /** Pitch/rate for the demo text-to-speech voice. */
  voice?: { pitch: number; rate?: number };
}

export interface VoiceNote {
  id: string;
  creatorId: string;
  /** Real audio when present; demo notes fall back to a synthesised voice. */
  audioUrl: string | null;
  /** Seconds, capped at MAX_NOTE_SECONDS. */
  duration: number;
  /** 0..1 amplitudes, ~48 bars. */
  waveformData: number[];
  title: string;
  transcript: string;
  createdAt: string;
  publishedAt: string;
  reactions: ReactionCounts;
  premium: boolean;
  /** VoysNote+ members hear it before this moment; everyone after. */
  earlyAccessUntil?: string | null;
  sponsorId: string | null;
  seriesId?: string | null;
}

export const REACTIONS = ["🔥", "❤️", "🙌", "🤯", "💭"] as const;
export type ReactionKind = (typeof REACTIONS)[number];
export type ReactionCounts = Partial<Record<ReactionKind, number>>;

export interface Follow {
  userId: string;
  creatorId: string;
  createdAt: string;
}

export interface Reaction {
  userId: string;
  noteId: string;
  kind: ReactionKind;
  createdAt: string;
}

export interface SavedNote {
  userId: string;
  noteId: string;
  collectionId: string | null;
  createdAt: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface Play {
  noteId: string;
  playedAt: string;
}

export interface Series {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  /** Pence. 0 = free (e.g. sponsored). */
  price: number;
  currency: "GBP";
  billing: "one_off" | "subscription";
  coverImage: string;
  sponsorId: string | null;
  episodeCount: number;
  /** Episodes unlock one per day after purchase/start. */
  unlockCadence: "daily" | "all";
  stripePriceId?: string | null;
}

export interface SeriesEpisode {
  id: string;
  seriesId: string;
  day: number;
  title: string;
  transcript: string;
  duration: number;
  audioUrl: string | null;
  waveformData: number[];
}

export interface Sponsor {
  id: string;
  name: string;
  /** Rendered quietly: "Presented by {name}". */
  tagline: string;
  url: string;
}

/** Things that happen in The Group besides notes. */
export interface FeedEvent {
  id: string;
  type: "joined";
  creatorId: string;
  at: string;
}

export type NotificationKind = "joined" | "dropped" | "followed_dropped" | "exclusive" | "series";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  creatorId: string;
  noteId?: string;
  seriesId?: string;
  at: string;
  text: string;
}

export interface Catalog {
  creators: Creator[];
  notes: VoiceNote[];
  series: Series[];
  episodes: SeriesEpisode[];
  sponsors: Sponsor[];
  events: FeedEvent[];
}
