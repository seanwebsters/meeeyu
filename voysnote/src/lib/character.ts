// Every voice note is a speech bubble with a little character in it. The
// character is built from the creator (their colour pair, what they do, a
// bit of personality) and its expression reacts to what the note says.

import type { Creator, VoiceNote } from "./types";
import { pairFor, type Pair } from "./palette";

export type Eyes = "dots" | "tall" | "wide" | "happy" | "wink" | "sleepy";
export type Mouth = "smile" | "grin" | "open" | "o" | "flat" | "smirk" | "worried" | "zip";
export type Brows = "none" | "raised" | "worried";
export type Accessory = "none" | "glasses" | "shades" | "headphones" | "headband" | "beanie" | "chef" | "beret" | "bowtie";

export interface Character {
  pair: Pair;
  shape: "box" | "pill";
  eyes: Eyes;
  mouth: Mouth;
  brows: Brows;
  accessory: Accessory;
  /** Seconds; staggers blinking so the group doesn't blink in unison. */
  blinkDelay: number;
}

function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

const pick = <T>(list: readonly T[], seed: string) => list[hash(seed) % list.length];

// What they do decides what they wear. First match wins.
const BY_ROLE: [RegExp, Accessory][] = [
  [/producer|dj|singer|songwriter|musician|rapper|composer/i, "headphones"],
  [/chef|cook|baker/i, "chef"],
  [/hurdler|runner|athlete|captain|coach|footballer|boxer|swimmer|cyclist/i, "headband"],
  [/mountaineer|explorer|climber|sailor|adventurer/i, "beanie"],
  [/architect|artist|designer|photographer|painter|illustrator/i, "beret"],
  [/actor|actress|model|presenter/i, "shades"],
  [/founder|investor|ceo|banker/i, "bowtie"],
  [/novelist|writer|psycholog|scientist|professor|historian|doctor|poet/i, "glasses"],
];

const BY_CATEGORY: Record<string, Accessory> = {
  Music: "headphones",
  Sport: "headband",
  Business: "bowtie",
  Creativity: "beret",
  Culture: "glasses",
};

/** The creator's resting character. */
export function characterFor(creator: Pick<Creator, "id" | "name" | "role" | "category">): Character {
  const seed = creator.id;
  let accessory = BY_ROLE.find(([re]) => re.test(creator.role))?.[1];
  if (!accessory && /^dr\.? /i.test(creator.name)) accessory = "glasses";
  accessory ??= BY_CATEGORY[creator.category] ?? "none";

  let eyes = pick<Eyes>(["dots", "tall", "wide", "dots"], seed + "e");
  let mouth = pick<Mouth>(["smile", "smile", "smirk", "open"], seed + "m");
  if (/comedian|comic/i.test(creator.role)) [eyes, mouth] = ["wink", "grin"];
  if (/sleep/i.test(creator.role)) eyes = "sleepy";

  return {
    pair: pairFor(creator.id),
    shape: hash(seed + "s") % 3 === 0 ? "pill" : "box",
    eyes,
    mouth,
    brows: "none",
    accessory,
    blinkDelay: (hash(seed + "b") % 40) / 10,
  };
}

const WORRIED = /\b(bad|hard|fail\w*|scared|fear|afraid|lost|sorry|grief|tired|wrong|alone|anxious|worry|panic|quit|mistake)\b/i;
const HAPPY = /\b(love|joy|win\w*|best|yes|laugh\w*|fun|free|happy|celebrate|good)\b|!/i;

/** The character, reacting to one note. Locked notes keep their lips zipped. */
export function characterForNote(creator: Creator, note: Pick<VoiceNote, "title">, locked = false): Character {
  const base = characterFor(creator);
  if (locked) return { ...base, eyes: base.eyes === "wink" ? "dots" : base.eyes, mouth: "zip", brows: "none" };
  const t = note.title;
  if (t.trim().endsWith("?")) return { ...base, mouth: "o", brows: "raised" };
  if (WORRIED.test(t)) return { ...base, mouth: "worried", brows: "worried" };
  if (HAPPY.test(t)) return { ...base, eyes: base.eyes === "sleepy" ? "sleepy" : "happy", mouth: "grin" };
  return base;
}
