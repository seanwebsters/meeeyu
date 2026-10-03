import type { Reply, VoiceNote } from "./types";
import { totalReactions } from "./catalog";
import { seeded } from "./utils";

const NAMES = ["Jordan", "Priya", "Mateo", "Hannah", "Kofi", "Lucía", "Ben", "Aisha", "Tom", "Mei", "Olu", "Freya", "Sami", "Rosa", "Callum", "Nadia"];
const LINES = [
  "Needed this today.",
  "Saving this one for Monday morning.",
  "This is such a good point 👏",
  "Played it three times on the bus.",
  "The last line got me.",
  "Thirty seconds and I feel different. How?",
  "Sending this to my sister.",
  "More of this please.",
  "I'm going to try this tomorrow.",
  "Didn't expect to tear up at 8am.",
  "Okay this changed how I see it.",
  "Short, true, perfect.",
];

/** Demo replies: a believable count plus a few visible ones. */
export function replyCount(note: VoiceNote) {
  const r = seeded(`rc${note.id}`)();
  return Math.round(totalReactions(note) * (0.04 + r * 0.05));
}

export function seedReplies(note: VoiceNote, now: number): Reply[] {
  if (!replyCount(note)) return [];
  const rnd = seeded(`r${note.id}`);
  const published = new Date(note.publishedAt).getTime();
  return Array.from({ length: 4 }, (_, i) => ({
    id: `${note.id}_r${i}`,
    noteId: note.id,
    userName: NAMES[Math.floor(rnd() * NAMES.length)],
    text: LINES[Math.floor(rnd() * LINES.length)],
    // Spread across the time since posting, earliest first.
    at: new Date(published + Math.max(0, now - published) * ((i + rnd() * 0.8) / 4.2)).toISOString(),
  }));
}

/** Listener presence for the live "is joining…" lines. */
export function listenerName(seed: number) {
  return NAMES[seed % NAMES.length];
}
