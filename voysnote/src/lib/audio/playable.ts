"use client";

import { useSyncExternalStore } from "react";
import type { Creator, SeriesEpisode, VoiceNote } from "../types";
import type { Playable } from "./engine";
import { createStore } from "../store/createStore";

export function noteToPlayable(note: VoiceNote, creator: Creator): Playable {
  return {
    id: note.id,
    title: note.title,
    creatorName: creator.name,
    avatar: creator.avatar,
    tone: creator.tone,
    duration: note.duration,
    audioUrl: note.audioUrl,
    transcript: note.transcript,
    voice: creator.voice,
  };
}

export function episodeToPlayable(ep: SeriesEpisode, creator: Creator): Playable {
  return {
    id: ep.id,
    title: `Day ${ep.day} · ${ep.title}`,
    creatorName: creator.name,
    avatar: creator.avatar,
    tone: creator.tone,
    duration: ep.duration,
    audioUrl: ep.audioUrl,
    transcript: ep.transcript,
    voice: creator.voice,
  };
}

// Which note cards are on screen; the mini player hides when the playing
// card is visible so there's never two of the same thing.
const visible = createStore<Set<string>>(new Set());

export function setNoteVisible(id: string, on: boolean) {
  visible.set((s) => {
    if (on === s.has(id)) return s;
    const next = new Set(s);
    if (on) next.add(id);
    else next.delete(id);
    return next;
  });
}

export function useNoteVisible(id: string | undefined) {
  return useSyncExternalStore(
    visible.subscribe,
    () => (id ? visible.get().has(id) : false),
    () => false,
  );
}
