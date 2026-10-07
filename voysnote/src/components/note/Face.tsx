import type { Accessory, Brows, Character, Eyes, Mouth } from "@/lib/character";
import { cx } from "@/lib/utils";

// A tiny character drawn in black on the bubble's colour. Eyes sit at
// (24, 20) and (40, 20); the mouth is centred on (32, 32). Hats use the
// space above y = 8.

const INK = "#0c0c0b";
const line = { fill: "none", stroke: INK, strokeWidth: 2.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function EyesSvg({ eyes }: { eyes: Eyes }) {
  switch (eyes) {
    case "dots":
      return (
        <>
          <circle cx="24" cy="20" r="3.3" fill={INK} />
          <circle cx="40" cy="20" r="3.3" fill={INK} />
        </>
      );
    case "tall":
      return (
        <>
          <ellipse cx="24" cy="20" rx="2.7" ry="4.3" fill={INK} />
          <ellipse cx="40" cy="20" rx="2.7" ry="4.3" fill={INK} />
        </>
      );
    case "wide":
      return (
        <>
          <circle cx="24" cy="20" r="4.6" fill="#fff" stroke={INK} strokeWidth="2.2" />
          <circle cx="25" cy="21" r="2" fill={INK} />
          <circle cx="40" cy="20" r="4.6" fill="#fff" stroke={INK} strokeWidth="2.2" />
          <circle cx="41" cy="21" r="2" fill={INK} />
        </>
      );
    case "happy":
      return <path d="M20 22q4-5.5 8 0M36 22q4-5.5 8 0" {...line} />;
    case "wink":
      return (
        <>
          <circle cx="24" cy="20" r="3.3" fill={INK} />
          <path d="M36 21q4-5 8 0" {...line} />
        </>
      );
    case "sleepy":
      return <path d="M20 19q4 4 8 0M36 19q4 4 8 0" {...line} />;
  }
}

function MouthSvg({ mouth }: { mouth: Mouth }) {
  switch (mouth) {
    case "smile":
      return <path d="M27 30q5 5.5 10 0" {...line} />;
    case "grin":
      return <path d="M26 29h12q0 7.5-6 7.5T26 29z" fill={INK} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />;
    case "open":
      return <ellipse cx="32" cy="33" rx="3.8" ry="4.4" fill={INK} />;
    case "o":
      return <circle cx="32" cy="32.5" r="2.8" fill="none" stroke={INK} strokeWidth="2.6" />;
    case "flat":
      return <path d="M28 32h8" {...line} />;
    case "smirk":
      return <path d="M28 32.5q5 2.5 9-2.5" {...line} />;
    case "worried":
      return <path d="M27.5 34q4.5-4 9 0" {...line} />;
    case "zip":
      return <path d="M26 32h12M29 30v4M32 30v4M35 30v4" {...line} strokeWidth="2.2" />;
  }
}

function BrowsSvg({ brows }: { brows: Brows }) {
  if (brows === "raised") return <path d="M19.5 11q4.5-3.5 9 0M35.5 11q4.5-3.5 9 0" {...line} strokeWidth="2.4" />;
  if (brows === "worried") return <path d="M19.5 14l8-3M44.5 14l-8-3" {...line} strokeWidth="2.4" />;
  return null;
}

/** Drawn over the eyes and head. */
function AccessorySvg({ accessory, accent }: { accessory: Accessory; accent: string }) {
  switch (accessory) {
    case "glasses":
      return (
        <g {...line} strokeWidth="2.2">
          <circle cx="24" cy="20" r="7" />
          <circle cx="40" cy="20" r="7" />
          <path d="M31 19.5h2M17 19l-5-2M47 19l5-2" />
        </g>
      );
    case "shades":
      return (
        <g fill={INK}>
          <path d="M14.5 15h14.5v5.5a5.5 5.5 0 0 1-5.5 5.5h-3.5a5.5 5.5 0 0 1-5.5-5.5z" />
          <path d="M35 15h14.5v5.5a5.5 5.5 0 0 1-5.5 5.5h-3.5a5.5 5.5 0 0 1-5.5-5.5z" />
          <path d="M29 16.5h6" stroke={INK} strokeWidth="2.2" />
          <path d="M18 17.5h4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".7" />
        </g>
      );
    case "headphones":
      return (
        <g>
          <path d="M9 25C9 0 55 0 55 25" {...line} strokeWidth="3.2" />
          <rect x="4" y="20" width="9" height="14" rx="4" fill={INK} />
          <rect x="51" y="20" width="9" height="14" rx="4" fill={INK} />
        </g>
      );
    case "headband":
      return (
        <g>
          <rect x="11" y="7" width="42" height="7" rx="3.5" fill={INK} />
          <rect x="13" y="9.5" width="38" height="2" rx="1" fill={accent} />
          <path d="M52 10l6-4M52 11l7 1" {...line} strokeWidth="2.6" />
        </g>
      );
    case "beanie":
      return (
        <g fill={INK}>
          <path d="M13 9C13-8 51-8 51 9z" />
          <rect x="11" y="6" width="42" height="6" rx="3" />
          <circle cx="32" cy="-8.5" r="3.6" />
          <path d="M20 6V0M27 6v-8M37 6v-8M44 6V0" stroke={accent} strokeWidth="1.6" strokeLinecap="round" opacity=".55" />
        </g>
      );
    case "chef":
      return (
        <g fill="#fff" stroke={INK} strokeWidth="2.2" strokeLinejoin="round">
          <path d="M21 9V3a7 7 0 0 1 4-12 8.5 8.5 0 0 1 14 0 7 7 0 0 1 4 12v6z" />
          <path d="M21 4.5h22" fill="none" />
        </g>
      );
    case "beret":
      return (
        <g fill={INK}>
          <path d="M12 9c-1-9 15-15 30-12 9 2 13 7 10 12z" />
          <path d="M38-4.5l3-5" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
        </g>
      );
    case "bowtie":
      return (
        <g fill={INK}>
          <path d="M24 39l7 4.5-7 4.5zM40 39l-7 4.5 7 4.5z" strokeLinejoin="round" stroke={INK} strokeWidth="1.6" />
          <circle cx="32" cy="43.5" r="2.2" />
        </g>
      );
    case "none":
      return null;
  }
}

interface Props {
  character: Character;
  size?: number;
  /** Mouth flaps while the note plays. */
  talking?: boolean;
  className?: string;
}

export function Face({ character: c, size = 64, talking, className }: Props) {
  const covered = c.accessory === "shades";
  return (
    <svg width={size} height={size * (60 / 64)} viewBox="0 -12 64 60" className={cx("shrink-0 overflow-visible", className)} aria-hidden>
      {!covered && (
        <g className="face-blink" style={{ animationDelay: `${c.blinkDelay}s` }}>
          <EyesSvg eyes={c.eyes} />
        </g>
      )}
      <BrowsSvg brows={c.brows} />
      {talking ? (
        <>
          <g className="face-talk-a">
            <MouthSvg mouth="open" />
          </g>
          <g className="face-talk-b">
            <MouthSvg mouth={c.mouth === "open" ? "smile" : c.mouth} />
          </g>
        </>
      ) : (
        <MouthSvg mouth={c.mouth} />
      )}
      <AccessorySvg accessory={c.accessory} accent={c.pair.fg} />
    </svg>
  );
}
