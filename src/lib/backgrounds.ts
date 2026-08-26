import type { BackgroundKey } from "@/lib/types";
import type { CSSProperties } from "react";

export type BackgroundTheme = {
  key: BackgroundKey;
  label: string;
  premium: boolean;
  /** Overrides for the design-system's CSS variables (see globals.css)
   * so the whole scrapbook — cards, sticky notes, buttons — reskins
   * without any component needing to know about themes. */
  vars: CSSProperties;
  /** paper / pink / ink, used to render a little swatch preview. */
  swatch: [string, string, string];
};

export const BACKGROUNDS: Record<BackgroundKey, BackgroundTheme> = {
  classic: {
    key: "classic",
    label: "classic",
    premium: false,
    vars: {},
    swatch: ["#faf5ec", "#ff6f9c", "#241f1a"],
  },
  dreamy: {
    key: "dreamy",
    label: "dreamy lilac",
    premium: true,
    vars: {
      "--paper": "#f4eefc",
      "--paper-card": "#fdfaff",
      "--ink": "#33284a",
      "--ink-soft": "#7c6f95",
      "--pink": "#b98af0",
      "--pink-soft": "#e9d9fb",
      "--yellow": "#ffe29a",
      "--mint": "#c9ecdb",
      "--lavender": "#d9c8f7",
      "--line": "#e4d6f7",
    } as CSSProperties,
    swatch: ["#f4eefc", "#b98af0", "#33284a"],
  },
  midnight: {
    key: "midnight",
    label: "midnight",
    premium: true,
    vars: {
      "--paper": "#171320",
      "--paper-card": "#241e33",
      "--ink": "#f3eefc",
      "--ink-soft": "#a89bc4",
      "--pink": "#ff6f9c",
      "--pink-soft": "#4a2f3d",
      "--yellow": "#ffd866",
      "--mint": "#7fd9b0",
      "--lavender": "#8f7fd9",
      "--line": "#332a44",
    } as CSSProperties,
    swatch: ["#171320", "#ff6f9c", "#f3eefc"],
  },
  sunset: {
    key: "sunset",
    label: "sunset",
    premium: true,
    vars: {
      "--paper": "#fff1e6",
      "--paper-card": "#fffaf4",
      "--ink": "#4a2a1a",
      "--ink-soft": "#8a6650",
      "--pink": "#ff7a59",
      "--pink-soft": "#ffd8c2",
      "--yellow": "#ffcf6b",
      "--mint": "#8fd6c1",
      "--lavender": "#f2b8d4",
      "--line": "#f4ddc8",
    } as CSSProperties,
    swatch: ["#fff1e6", "#ff7a59", "#4a2a1a"],
  },
  mint: {
    key: "mint",
    label: "fresh mint",
    premium: true,
    vars: {
      "--paper": "#eefaf3",
      "--paper-card": "#ffffff",
      "--ink": "#163328",
      "--ink-soft": "#5f8877",
      "--pink": "#ff6f9c",
      "--pink-soft": "#d8f3e6",
      "--yellow": "#ffe29a",
      "--mint": "#6fd6ac",
      "--lavender": "#cfe9ff",
      "--line": "#d8ecdf",
    } as CSSProperties,
    swatch: ["#eefaf3", "#6fd6ac", "#163328"],
  },
  y2k: {
    key: "y2k",
    label: "y2k chrome",
    premium: true,
    vars: {
      "--paper": "#eef3fb",
      "--paper-card": "#ffffff",
      "--ink": "#1a2a4a",
      "--ink-soft": "#6b7a99",
      "--pink": "#ff5fae",
      "--pink-soft": "#dbe8ff",
      "--yellow": "#fff275",
      "--mint": "#b8f2e6",
      "--lavender": "#cdb4ff",
      "--line": "#dce6f7",
    } as CSSProperties,
    swatch: ["#eef3fb", "#ff5fae", "#1a2a4a"],
  },
};

export function getBackground(key: BackgroundKey | null | undefined): BackgroundTheme {
  return BACKGROUNDS[key ?? "classic"] ?? BACKGROUNDS.classic;
}
