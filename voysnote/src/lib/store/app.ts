"use client";

import { useMemo, useSyncExternalStore } from "react";
import { createStore } from "./createStore";
import { buildSeedCatalog, EMPTY_ADMIN, indexCatalog, mergeCatalog, type AdminContent } from "../catalog";
import type { Entitlements } from "../access";
import type { Catalog, Category, Collection, Creator, FeedEvent, ReactionKind, SavedNote, Series, SeriesEpisode, Sponsor, User, VoiceNote } from "../types";
import { uid } from "../utils";
import { remote, type loadRemoteUserState } from "../supabase/sync";

const STORAGE_KEY = "voysnote:v1";
const ANCHOR_KEY = "voysnote:anchor";

export interface Persisted {
  user: User | null;
  follows: string[];
  reactions: Record<string, ReactionKind>;
  saved: SavedNote[];
  collections: Collection[];
  played: { noteId: string; at: string }[];
  purchases: string[];
  seriesStartedAt: Record<string, string>;
  /** Episode ids the listener has finished. */
  completedEpisodes: string[];
  readNotifications: string[];
  notificationsSeenAt: string | null;
  settings: { autoplayNext: boolean; demoVoice: boolean };
  admin: AdminContent;
}

export interface AppState extends Persisted {
  hydrated: boolean;
  /** Session start; the demo timeline is resolved relative to it. */
  anchor: number;
  /** Catalog loaded from Supabase, when configured. */
  remoteCatalog: Catalog | null;
}

const DEFAULTS: Persisted = {
  user: null,
  follows: [],
  reactions: {},
  saved: [],
  collections: [],
  played: [],
  purchases: [],
  seriesStartedAt: {},
  completedEpisodes: [],
  readNotifications: [],
  notificationsSeenAt: null,
  settings: { autoplayNext: true, demoVoice: true },
  admin: EMPTY_ADMIN,
};

const SERVER_STATE: AppState = { ...DEFAULTS, hydrated: false, anchor: 0, remoteCatalog: null };

function load(): AppState {
  if (typeof window === "undefined") return SERVER_STATE;
  let persisted: Partial<Persisted> = {};
  try {
    persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {}
  let anchor = Date.now();
  try {
    const saved = Number(sessionStorage.getItem(ANCHOR_KEY));
    if (saved && Date.now() - saved < 6 * 3600_000) anchor = saved;
    else sessionStorage.setItem(ANCHOR_KEY, String(anchor));
  } catch {}
  return {
    ...DEFAULTS,
    ...persisted,
    settings: { ...DEFAULTS.settings, ...persisted.settings },
    admin: { ...EMPTY_ADMIN, ...persisted.admin },
    hydrated: true,
    anchor,
    remoteCatalog: null,
  };
}

export const appStore = createStore<AppState>(typeof window === "undefined" ? SERVER_STATE : load());

let persistTimer: ReturnType<typeof setTimeout> | undefined;
let warnedQuota = false;
appStore.subscribe(() => {
  if (typeof window === "undefined") return;
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    const s = appStore.get();
    const out: Persisted = {
      user: s.user,
      follows: s.follows,
      reactions: s.reactions,
      saved: s.saved,
      collections: s.collections,
      played: s.played.slice(0, 50),
      purchases: s.purchases,
      seriesStartedAt: s.seriesStartedAt,
      completedEpisodes: s.completedEpisodes,
      readNotifications: s.readNotifications.slice(-300),
      notificationsSeenAt: s.notificationsSeenAt,
      settings: s.settings,
      admin: s.admin,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
    } catch {
      // Uploaded audio can exceed the quota in demo mode; keep it in memory.
      if (!warnedQuota) console.warn("VoysNote: local storage full; large uploads won't survive a reload in demo mode.");
      warnedQuota = true;
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            ...out,
            admin: { ...out.admin, notes: out.admin.notes.map((n) => ({ ...n, audioUrl: n.audioUrl?.startsWith("data:") ? null : n.audioUrl })) },
          }),
        );
      } catch {}
    }
  }, 150);
});

export function useApp<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    appStore.subscribe,
    () => selector(appStore.get()),
    () => selector(SERVER_STATE),
  );
}

export const useHydrated = () => useApp((s) => s.hydrated);

// ---------------------------------------------------------------------------
// Derived data

export function useCatalog() {
  const anchor = useApp((s) => s.anchor);
  const admin = useApp((s) => s.admin);
  const remoteCatalog = useApp((s) => s.remoteCatalog);
  return useMemo(() => {
    const base = remoteCatalog ?? buildSeedCatalog(anchor);
    const catalog = mergeCatalog(base, admin);
    return { catalog, idx: indexCatalog(catalog) };
  }, [anchor, admin, remoteCatalog]);
}

export function useEntitlements(): Entitlements {
  const plus = useApp((s) => s.user?.subscriptionStatus === "plus");
  const purchasedSeries = useApp((s) => s.purchases);
  const seriesStartedAt = useApp((s) => s.seriesStartedAt);
  return useMemo(() => ({ plus, purchasedSeries, seriesStartedAt }), [plus, purchasedSeries, seriesStartedAt]);
}

// ---------------------------------------------------------------------------
// Actions. Optimistic locally; mirrored to Supabase when configured.

const set = appStore.set;
const now = () => new Date().toISOString();

export const actions = {
  completeOnboarding(input: { name: string; email: string | null; interests: Category[]; id?: string }) {
    const user: User = {
      id: input.id ?? uid("u"),
      name: input.name.trim() || "You",
      avatar: null,
      email: input.email,
      interests: input.interests,
      subscriptionStatus: "free",
      role: "admin", // Demo: everyone can open the dashboard. Production reads profiles.role.
      joinedAt: now(),
    };
    set((s) => ({ ...s, user }));
    remote.upsertProfile(user);
  },

  updateUser(patch: Partial<User>) {
    set((s) => (s.user ? { ...s, user: { ...s.user, ...patch } } : s));
    const u = appStore.get().user;
    if (u) remote.upsertProfile(u);
  },

  toggleFollow(creatorId: string) {
    const following = appStore.get().follows.includes(creatorId);
    set((s) => ({ ...s, follows: following ? s.follows.filter((x) => x !== creatorId) : [...s.follows, creatorId] }));
    remote.follow(creatorId, !following);
  },

  react(noteId: string, kind: ReactionKind) {
    const current = appStore.get().reactions[noteId];
    set((s) => {
      const reactions = { ...s.reactions };
      if (current === kind) delete reactions[noteId];
      else reactions[noteId] = kind;
      return { ...s, reactions };
    });
    remote.react(noteId, current === kind ? null : kind);
  },

  toggleSave(noteId: string) {
    const s0 = appStore.get();
    const saved = s0.saved.some((x) => x.noteId === noteId);
    set((s) => ({
      ...s,
      saved: saved ? s.saved.filter((x) => x.noteId !== noteId) : [{ userId: s.user?.id ?? "anon", noteId, collectionId: null, createdAt: now() }, ...s.saved],
    }));
    remote.save(noteId, !saved);
  },

  createCollection(name: string) {
    const c: Collection = { id: uid("col"), userId: appStore.get().user?.id ?? "anon", name, createdAt: now() };
    set((s) => ({ ...s, collections: [...s.collections, c] }));
    return c.id;
  },

  deleteCollection(id: string) {
    set((s) => ({
      ...s,
      collections: s.collections.filter((c) => c.id !== id),
      saved: s.saved.map((x) => (x.collectionId === id ? { ...x, collectionId: null } : x)),
    }));
  },

  moveToCollection(noteId: string, collectionId: string | null) {
    set((s) => {
      const exists = s.saved.some((x) => x.noteId === noteId);
      const saved = exists
        ? s.saved.map((x) => (x.noteId === noteId ? { ...x, collectionId } : x))
        : [{ userId: s.user?.id ?? "anon", noteId, collectionId, createdAt: now() }, ...s.saved];
      return { ...s, saved };
    });
  },

  recordPlay(noteId: string) {
    set((s) => ({ ...s, played: [{ noteId, at: now() }, ...s.played.filter((p) => p.noteId !== noteId)].slice(0, 50) }));
    remote.play(noteId);
  },

  completeEpisode(id: string) {
    set((s) => (s.completedEpisodes.includes(id) ? s : { ...s, completedEpisodes: [...s.completedEpisodes, id] }));
  },

  startSeries(seriesId: string) {
    set((s) => (s.seriesStartedAt[seriesId] ? s : { ...s, seriesStartedAt: { ...s.seriesStartedAt, [seriesId]: now() } }));
  },

  /** Called after a successful (or demo) checkout. */
  grantSeries(seriesId: string) {
    set((s) => ({
      ...s,
      purchases: s.purchases.includes(seriesId) ? s.purchases : [...s.purchases, seriesId],
      seriesStartedAt: s.seriesStartedAt[seriesId] ? s.seriesStartedAt : { ...s.seriesStartedAt, [seriesId]: now() },
    }));
  },

  setPlus(on: boolean) {
    set((s) => (s.user ? { ...s, user: { ...s.user, subscriptionStatus: on ? "plus" : "free" } } : s));
  },

  markNotificationsSeen() {
    set((s) => ({ ...s, notificationsSeenAt: now() }));
  },

  setSetting<K extends keyof Persisted["settings"]>(key: K, value: Persisted["settings"][K]) {
    set((s) => ({ ...s, settings: { ...s.settings, [key]: value } }));
  },

  applyRemoteUserState(r: NonNullable<Awaited<ReturnType<typeof loadRemoteUserState>>>) {
    set((s) => ({
      ...s,
      user: s.user ? { ...s.user, subscriptionStatus: r.subscriptionStatus, role: r.role } : s.user,
      follows: r.follows,
      purchases: r.purchases.map((p) => p.seriesId),
      seriesStartedAt: { ...s.seriesStartedAt, ...Object.fromEntries(r.purchases.map((p) => [p.seriesId, p.startedAt])) },
      saved: r.saved,
    }));
  },

  setRemoteCatalog(catalog: Catalog | null) {
    set((s) => ({ ...s, remoteCatalog: catalog }));
  },

  signOut() {
    set((s) => ({ ...s, user: null }));
    remote.signOut();
  },

  resetDemo() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(ANCHOR_KEY);
    } catch {}
    set({ ...DEFAULTS, hydrated: true, anchor: Date.now(), remoteCatalog: null });
  },

  // --- Admin ---------------------------------------------------------------
  admin: {
    upsertCreator(c: Creator) {
      set((s) => ({ ...s, admin: { ...s.admin, creators: upsert(s.admin.creators, c) } }));
      return remote.admin.upsert("creators", c);
    },
    upsertNote(n: VoiceNote) {
      set((s) => ({ ...s, admin: { ...s.admin, notes: upsert(s.admin.notes, n) } }));
      return remote.admin.upsert("voice_notes", n);
    },
    deleteNote(id: string) {
      set((s) => ({ ...s, admin: { ...s.admin, notes: s.admin.notes.filter((n) => n.id !== id) } }));
    },
    upsertSeries(series: Series, episodes: SeriesEpisode[]) {
      set((s) => ({
        ...s,
        admin: { ...s.admin, series: upsert(s.admin.series, series), episodes: episodes.reduce(upsert, s.admin.episodes) },
      }));
      return remote.admin.upsert("series", series);
    },
    upsertSponsor(sp: Sponsor) {
      set((s) => ({ ...s, admin: { ...s.admin, sponsors: upsert(s.admin.sponsors, sp) } }));
      return remote.admin.upsert("sponsors", sp);
    },
    addEvent(ev: FeedEvent) {
      set((s) => ({ ...s, admin: { ...s.admin, events: upsert(s.admin.events, ev) } }));
      return remote.admin.upsert("feed_events", ev);
    },
    deleteEvent(id: string) {
      set((s) => ({ ...s, admin: { ...s.admin, events: s.admin.events.filter((e) => e.id !== id) } }));
    },
    clear() {
      set((s) => ({ ...s, admin: EMPTY_ADMIN }));
    },
  },
};

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [...list, item];
  const next = list.slice();
  next[i] = item;
  return next;
}
