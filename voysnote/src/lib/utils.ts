export { clsx as cx } from "clsx";

/** Deterministic PRNG so waveforms and counters are stable across renders. */
export function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A speech-shaped waveform: phrases of energy separated by short breaths. */
export function makeWaveform(seed: string, bars = 44): number[] {
  const rnd = seeded(seed);
  const out: number[] = [];
  let phrase = 0;
  for (let i = 0; i < bars; i++) {
    if (phrase <= 0) {
      phrase = 4 + Math.floor(rnd() * 7);
      out.push(0.08 + rnd() * 0.08);
      continue;
    }
    phrase--;
    const base = 0.35 + rnd() * 0.5;
    out.push(Math.min(1, base * (0.75 + Math.sin(i * 0.9) * 0.15 + rnd() * 0.25)));
  }
  return out;
}

export function formatDuration(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export function formatPrice(pence: number) {
  return pence === 0 ? "Free" : `£${(pence / 100).toFixed(2)}`;
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Chat-style timestamp: "14:02". */
export function clockTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** "now", "4m", "3h", "2d" */
export function relativeShort(iso: string, now: number) {
  const d = now - new Date(iso).getTime();
  if (d < MIN) return "now";
  if (d < HOUR) return `${Math.floor(d / MIN)}m`;
  if (d < DAY) return `${Math.floor(d / HOUR)}h`;
  if (d < 7 * DAY) return `${Math.floor(d / DAY)}d`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** "in 3h", "tonight at 21:00" for scheduled drops. */
export function relativeFuture(iso: string, now: number) {
  const d = new Date(iso).getTime() - now;
  if (d < MIN) return "any second now";
  if (d < HOUR) return `in ${Math.ceil(d / MIN)} min`;
  const t = new Date(iso);
  const sameDay = new Date(now).toDateString() === t.toDateString();
  if (sameDay) return `${t.getHours() >= 18 ? "tonight" : "today"} at ${clockTime(iso)}`;
  if (d < 2 * DAY) return `tomorrow at ${clockTime(iso)}`;
  return t.toLocaleDateString("en-GB", { weekday: "long" }) + ` at ${clockTime(iso)}`;
}

/** Day separator label, as in a chat: Today / Yesterday / Tuesday / 28 Sept. */
export function dayLabel(iso: string, now: number) {
  const t = new Date(iso);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - new Date(t).setHours(0, 0, 0, 0)) / DAY);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return t.toLocaleDateString("en-GB", { weekday: "long" });
  return t.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

export function firstName(name: string) {
  const parts = name.split(" ");
  return /^(dr|prof|sir|dame)\.?$/i.test(parts[0]) && parts[1] ? parts[1] : parts[0];
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export const TIME = { MIN, HOUR, DAY };

/** "just now", "3m ago", "2d ago", "24 Sept" */
export function ago(iso: string, now: number) {
  const s = relativeShort(iso, now);
  if (s === "now") return "just now";
  return /^\d+[mhd]$/.test(s) ? `${s} ago` : s;
}
