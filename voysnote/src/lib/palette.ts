// The brand palette: four flat colours, each with a partner that sits on it.
// Partners are for big display type and graphics (the asterisk). Small text
// on these fills stays black for legibility.

export const PALETTE = {
  red: "#EB4213",
  pink: "#FF99DC",
  purple: "#826DEE",
  green: "#D8F382",
} as const;

export type PaletteName = keyof typeof PALETTE;

export interface Pair {
  name: PaletteName;
  bg: string;
  fg: string;
}

export const PAIRS: Pair[] = [
  { name: "red", bg: PALETTE.red, fg: PALETTE.green },
  { name: "pink", bg: PALETTE.pink, fg: PALETTE.red },
  { name: "purple", bg: PALETTE.purple, fg: PALETTE.pink },
  { name: "green", bg: PALETTE.green, fg: PALETTE.purple },
];

/** A stable pair for anything with an id (creators, categories, notes). */
export function pairFor(id: string): Pair {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return PAIRS[Math.abs(h) % PAIRS.length];
}

/** The partner colour for a palette fill, if it is one. */
export function partnerOf(bg: string | undefined): string | undefined {
  return PAIRS.find((p) => p.bg.toLowerCase() === bg?.toLowerCase())?.fg;
}

const CATEGORY_ORDER: PaletteName[] = ["red", "pink", "purple", "green"];
export function categoryColor(index: number) {
  return PALETTE[CATEGORY_ORDER[index % CATEGORY_ORDER.length]];
}
