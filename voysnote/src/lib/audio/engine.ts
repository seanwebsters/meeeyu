"use client";

// The single, app-wide player. Only one note plays at a time; playback
// survives navigation and scrolling because the engine lives outside React.
//
// Notes with an audioUrl play through an <audio> element. Demo notes have no
// recording, so the engine speaks the transcript with the Web Speech API
// (or plays silently with captions) while a clock drives the same UI.

import { useSyncExternalStore } from "react";
import { createStore } from "../store/createStore";
import { MAX_NOTE_SECONDS } from "../types";

export interface Playable {
  id: string;
  title: string;
  creatorName: string;
  avatar?: string;
  duration: number;
  audioUrl: string | null;
  transcript: string;
  voice?: { pitch: number; rate?: number };
}

export interface PlayerState {
  current: Playable | null;
  status: "idle" | "playing" | "paused" | "ended";
  /** Seconds. */
  position: number;
  /** Stop early (share previews). */
  limit: number | null;
  previewEnded: boolean;
  queue: Playable[];
}

const initial: PlayerState = { current: null, status: "idle", position: 0, limit: null, previewEnded: false, queue: [] };
const store = createStore<PlayerState>(initial);

const config = { autoplayNext: true, voice: true };
type Hook = (p: Playable) => void;
const hooks = { started: new Set<Hook>(), ended: new Set<Hook>() };

let audio: HTMLAudioElement | null = null;
let raf = 0;
let lastTick = 0;
let mode: "audio" | "voice" = "voice";
let advanceTimer: ReturnType<typeof setTimeout> | undefined;

const cap = (p: Playable) => Math.min(p.duration || MAX_NOTE_SECONDS, MAX_NOTE_SECONDS);
const endAt = (s: PlayerState) => (s.current ? Math.min(cap(s.current), s.limit ?? Infinity) : 0);

function getAudio() {
  if (!audio) {
    audio = new Audio();
    audio.preload = "auto";
    audio.addEventListener("ended", () => finish());
    audio.addEventListener("error", () => {
      // Missing or blocked file: fall back to the voice so the moment isn't lost.
      const s = store.get();
      if (s.current && mode === "audio" && s.status === "playing") {
        mode = "voice";
        lastTick = performance.now();
        speakFrom(s.current, s.position);
      }
    });
  }
  return audio;
}

// --- Speech -----------------------------------------------------------------

const synth = () => (typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null);

function pickVoice(pitch: number) {
  const voices = synth()?.getVoices() ?? [];
  const en = voices.filter((v) => v.lang?.toLowerCase().startsWith("en"));
  if (!en.length) return undefined;
  const fem = /female|samantha|serena|kate|victoria|karen|moira|tessa|fiona|libby|sonia|hazel|susan|zira|aria|jenny/i;
  const masc = /\bmale\b|daniel|arthur|oliver|alex|fred|tom|rishi|ryan|guy|george|david|mark/i;
  const gb = en.filter((v) => /en[-_]gb/i.test(v.lang));
  const pool = gb.length ? gb : en;
  const want = pitch >= 1 ? fem : masc;
  return pool.find((v) => want.test(v.name)) ?? pool[0];
}

function sentencesFrom(transcript: string, fraction: number) {
  const words = transcript.split(/\s+/);
  const start = Math.min(words.length - 1, Math.max(0, Math.floor(words.length * fraction)));
  const rest = words.slice(start).join(" ");
  // Short utterances avoid Chrome cutting long ones off mid-way.
  return (
    rest
      .match(/[^.!?]+[.!?]*/g)
      ?.map((s) => s.trim())
      .filter(Boolean) ?? [rest]
  );
}

function speakFrom(p: Playable, position: number) {
  const s = synth();
  if (!s) return;
  s.cancel();
  if (!config.voice) return;
  const words = p.transcript.split(/\s+/).length;
  const rate = Math.max(0.85, Math.min(1.3, words / cap(p) / 2.55)) * (p.voice?.rate ?? 1);
  const voice = pickVoice(p.voice?.pitch ?? 1);
  for (const sentence of sentencesFrom(p.transcript, position / cap(p))) {
    const u = new SpeechSynthesisUtterance(sentence);
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? "en-GB";
    u.rate = rate;
    u.pitch = p.voice?.pitch ?? 1;
    s.speak(u);
  }
}

function stopSpeech() {
  synth()?.cancel();
}

// --- Clock ------------------------------------------------------------------

function tick(t: number) {
  const s = store.get();
  if (s.status !== "playing" || !s.current) return;
  let position: number;
  if (mode === "audio" && audio) position = audio.currentTime;
  else {
    position = s.position + (t - lastTick) / 1000;
    lastTick = t;
  }
  const end = endAt(s);
  if (position >= end) {
    store.set({ ...s, position: end });
    finish();
    return;
  }
  store.set({ ...s, position });
  raf = requestAnimationFrame(tick);
}

function startClock() {
  cancelAnimationFrame(raf);
  lastTick = performance.now();
  raf = requestAnimationFrame(tick);
}

function finish() {
  cancelAnimationFrame(raf);
  audio?.pause();
  stopSpeech();
  const s = store.get();
  if (!s.current) return;
  const preview = s.limit != null && s.limit < cap(s.current);
  store.set({ ...s, status: "ended", position: endAt(s), previewEnded: preview });
  hooks.ended.forEach((h) => h(s.current!));
  setMediaState("paused");

  if (!preview && config.autoplayNext && s.queue.length) {
    const i = s.queue.findIndex((q) => q.id === s.current!.id);
    const next = i >= 0 ? s.queue[i + 1] : undefined;
    if (next) advanceTimer = setTimeout(() => player.play(next, { queue: s.queue }), 900);
  }
}

// --- Media Session (lock screen / headphones) --------------------------------

function setMediaState(state: "playing" | "paused") {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  navigator.mediaSession.playbackState = state;
}

function setMediaMetadata(p: Playable) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: p.title,
    artist: p.creatorName,
    album: "VoysNote",
    artwork: p.avatar ? [{ src: p.avatar, sizes: "240x240" }] : [],
  });
  navigator.mediaSession.setActionHandler("play", () => player.resume());
  navigator.mediaSession.setActionHandler("pause", () => player.pause());
}

// --- Public API -------------------------------------------------------------

export const player = {
  play(p: Playable, opts: { queue?: Playable[]; limit?: number; from?: number } = {}) {
    clearTimeout(advanceTimer);
    cancelAnimationFrame(raf);
    stopSpeech();
    audio?.pause();

    const position = opts.from ?? 0;
    mode = p.audioUrl ? "audio" : "voice";
    store.set({ current: p, status: "playing", position, limit: opts.limit ?? null, previewEnded: false, queue: opts.queue ?? [] });

    if (mode === "audio") {
      const a = getAudio();
      if (a.src !== p.audioUrl) a.src = p.audioUrl!;
      a.currentTime = position;
      a.play().catch(() => {
        mode = "voice";
        lastTick = performance.now();
        speakFrom(p, position);
      });
    } else {
      speakFrom(p, position);
    }
    startClock();
    setMediaMetadata(p);
    setMediaState("playing");
    hooks.started.forEach((h) => h(p));
  },

  pause() {
    const s = store.get();
    if (s.status !== "playing") return;
    cancelAnimationFrame(raf);
    audio?.pause();
    stopSpeech();
    store.set({ ...s, status: "paused" });
    setMediaState("paused");
  },

  resume() {
    const s = store.get();
    if (!s.current) return;
    if (s.status === "ended") return player.play(s.current, { queue: s.queue, limit: s.limit ?? undefined });
    if (s.status !== "paused") return;
    store.set({ ...s, status: "playing" });
    if (mode === "audio")
      getAudio()
        .play()
        .catch(() => {});
    else speakFrom(s.current, s.position);
    startClock();
    setMediaState("playing");
  },

  toggle(p: Playable, opts: { queue?: Playable[]; limit?: number } = {}) {
    const s = store.get();
    if (s.current?.id === p.id) {
      if (s.status === "playing") return player.pause();
      return player.resume();
    }
    player.play(p, opts);
  },

  /** Seek to a 0..1 fraction of the note. */
  seek(fraction: number) {
    const s = store.get();
    if (!s.current) return;
    const position = Math.max(0, Math.min(endAt(s) - 0.05, fraction * cap(s.current)));
    store.set({ ...s, position, status: s.status === "ended" ? "paused" : s.status });
    if (mode === "audio" && audio) audio.currentTime = position;
    if (store.get().status === "playing") {
      if (mode === "voice") speakFrom(s.current, position);
      lastTick = performance.now();
    }
  },

  stop() {
    clearTimeout(advanceTimer);
    cancelAnimationFrame(raf);
    audio?.pause();
    stopSpeech();
    store.set(initial);
  },

  configure(next: Partial<typeof config>) {
    Object.assign(config, next);
    if (next.voice === false) stopSpeech();
  },

  on(event: keyof typeof hooks, fn: Hook) {
    hooks[event].add(fn);
    return () => hooks[event].delete(fn);
  },

  get: store.get,
};

export function usePlayer<T>(selector: (s: PlayerState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(initial),
  );
}

/** The sentence being spoken at a given point, for live captions. */
export function captionAt(transcript: string, fraction: number) {
  const sentences = transcript.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()) ?? [transcript];
  const total = transcript.length;
  let acc = 0;
  for (const s of sentences) {
    acc += s.length + 1;
    if (acc / total >= fraction) return s;
  }
  return sentences[sentences.length - 1];
}

// Voices load asynchronously in Chrome; touching the list warms it up.
if (typeof window !== "undefined") synth()?.getVoices();
