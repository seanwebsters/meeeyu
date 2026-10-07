// A small, consistent line-icon set (1.6px strokes, 24px grid).

type P = React.SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 22, children, ...rest }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconPlay = ({ size = 18, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M8 5.6v12.8c0 .9 1 1.4 1.7.9l9.6-6.4a1.1 1.1 0 0 0 0-1.8L9.7 4.7C9 4.2 8 4.7 8 5.6Z" />
  </svg>
);

export const IconPause = ({ size = 18, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <rect x="6.5" y="5" width="3.8" height="14" rx="1.2" />
    <rect x="13.7" y="5" width="3.8" height="14" rx="1.2" />
  </svg>
);

export const IconGroup = (p: P) => (
  <Svg {...p}>
    <path d="M20 11.5c0 4.1-3.6 7.5-8 7.5-1.2 0-2.3-.2-3.3-.6L4 20l1.3-3.6A7.2 7.2 0 0 1 4 11.5C4 7.4 7.6 4 12 4s8 3.4 8 7.5Z" />
  </Svg>
);
export const IconGroupFill = (p: P) => (
  <Svg {...p} fill="currentColor">
    <path d="M20 11.5c0 4.1-3.6 7.5-8 7.5-1.2 0-2.3-.2-3.3-.6L4 20l1.3-3.6A7.2 7.2 0 0 1 4 11.5C4 7.4 7.6 4 12 4s8 3.4 8 7.5Z" />
  </Svg>
);

export const IconDiscover = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Svg>
);

export const IconBookmark = (p: P) => (
  <Svg {...p}>
    <path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.8L6 20V5.5a1 1 0 0 1 1-1Z" />
  </Svg>
);
export const IconBookmarkFill = (p: P) => (
  <Svg {...p} fill="currentColor">
    <path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.8L6 20V5.5a1 1 0 0 1 1-1Z" />
  </Svg>
);

export const IconUser = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M4.8 20c.9-3.6 3.8-5.6 7.2-5.6s6.3 2 7.2 5.6" />
  </Svg>
);

export const IconShare = (p: P) => (
  <Svg {...p}>
    <path d="M12 15V4m0 0L8 8m4-4 4 4" />
    <path d="M7 11H6a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 18 11h-1" />
  </Svg>
);

export const IconBell = (p: P) => (
  <Svg {...p}>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15L6 16.5Z" />
    <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
  </Svg>
);

export const IconClose = (p: P) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const IconBack = (p: P) => (
  <Svg {...p}>
    <path d="M15 5 8 12l7 7" />
  </Svg>
);

export const IconChevron = (p: P) => (
  <Svg {...p}>
    <path d="m9 5 7 7-7 7" />
  </Svg>
);

export const IconLock = (p: P) => (
  <Svg {...p}>
    <rect x="5.5" y="10.5" width="13" height="9" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </Svg>
);

export const IconCheck = (p: P) => (
  <Svg {...p}>
    <path d="m5 12.5 4.2 4L19 7" />
  </Svg>
);

export const IconPlus = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconMic = (p: P) => (
  <Svg {...p}>
    <rect x="9" y="3.5" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" />
  </Svg>
);

export const IconLink = (p: P) => (
  <Svg {...p}>
    <path d="M10 14a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7L11.5 6.8" />
    <path d="M14 10a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.3-1.3" />
  </Svg>
);

export const IconDownload = (p: P) => (
  <Svg {...p}>
    <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19.5h14" />
  </Svg>
);

export const IconSettings = (p: P) => (
  <Svg {...p}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </Svg>
);

export const IconSpark = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5c.5 4.3 2.2 6 6.5 6.5-4.3.5-6 2.2-6.5 6.5-.5-4.3-2.2-6-6.5-6.5 4.3-.5 6-2.2 6.5-6.5Z" />
    <path d="M18.5 15.5c.2 1.6.8 2.2 2.5 2.5-1.7.3-2.3.9-2.5 2.5-.2-1.6-.8-2.2-2.5-2.5 1.7-.3 2.3-.9 2.5-2.5Z" />
  </Svg>
);

export const IconGrid = (p: P) => (
  <Svg {...p}>
    <rect x="4.5" y="4.5" width="6" height="6" rx="1.5" />
    <rect x="13.5" y="4.5" width="6" height="6" rx="1.5" />
    <rect x="4.5" y="13.5" width="6" height="6" rx="1.5" />
    <rect x="13.5" y="13.5" width="6" height="6" rx="1.5" />
  </Svg>
);

export const IconArrowDown = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14m0 0 5-5m-5 5-5-5" />
  </Svg>
);

/** Verified: a soft, filled seal rather than a loud blue tick. */
export function Verified({ size = 15, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-label="Verified" role="img">
      <path
        fill="currentColor"
        d="M12 2.5l2.1 1.6 2.6-.3 1 2.4 2.4 1-.3 2.6L21.5 12l-1.6 2.1.3 2.6-2.4 1-1 2.4-2.6-.3L12 21.5l-2.1-1.6-2.6.3-1-2.4-2.4-1 .3-2.6L2.5 12l1.6-2.1-.3-2.6 2.4-1 1-2.4 2.6.3L12 2.5Z"
      />
      <path d="m8.3 12.2 2.4 2.3 5-5" fill="none" stroke="var(--cream)" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The brand mark: a V drawn as a single waveform stroke. */
export function VMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M6 9.5 16 24 26 9.5" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.2 9.5v4.2M16 7v6.5M19.8 9.5v4.2" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" />
    </svg>
  );
}

export const IconHome = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 10.5 12 4.5l7.5 6V19a1 1 0 0 1-1 1h-4v-5.5h-5V20h-4a1 1 0 0 1-1-1v-8.5Z" />
  </Svg>
);
export const IconHomeFill = (p: P) => (
  <Svg {...p} fill="currentColor">
    <path d="M4.5 10.5 12 4.5l7.5 6V19a1 1 0 0 1-1 1h-4v-5.5h-5V20h-4a1 1 0 0 1-1-1v-8.5Z" />
  </Svg>
);

export const IconHeart = (p: P) => (
  <Svg {...p}>
    <path d="M12 19.5s-7-4.3-7-9.6A4 4 0 0 1 12 7.6a4 4 0 0 1 7 2.3c0 5.3-7 9.6-7 9.6Z" />
  </Svg>
);
export const IconHeartFill = (p: P) => (
  <Svg {...p} fill="currentColor" stroke="none">
    <path d="M12 19.5s-7-4.3-7-9.6A4 4 0 0 1 12 7.6a4 4 0 0 1 7 2.3c0 5.3-7 9.6-7 9.6Z" />
  </Svg>
);

export const IconComment = (p: P) => (
  <Svg {...p}>
    <path d="M5 6.5A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4 3.5V16h0a1 1 0 0 1-1-1V6.5Z" />
  </Svg>
);

export const IconMore = ({ size = 20, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <circle cx="5.5" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="18.5" cy="12" r="1.6" />
  </svg>
);

export const IconArrowRight = (p: P) => (
  <Svg {...p}>
    <path d="M5 12h14m0 0-5-5m5 5-5 5" />
  </Svg>
);

export const IconCrown = (p: P) => (
  <Svg {...p} fill="currentColor" stroke="none">
    <path d="M4 8.5 8 12l4-6 4 6 4-3.5-1.6 9.5H5.6L4 8.5Z" />
    <rect x="5.6" y="18.8" width="12.8" height="1.6" rx="0.8" />
  </Svg>
);

export const IconStar = (p: P) => (
  <Svg {...p} fill="currentColor" stroke="none">
    <path d="m12 4 2.3 4.9 5.2.6-3.9 3.6 1 5.2L12 15.7l-4.6 2.6 1-5.2L4.5 9.5l5.2-.6L12 4Z" />
  </Svg>
);

export const IconClock = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="7.5" />
    <path d="M12 8v4.3l2.8 1.7" />
  </Svg>
);

// --- Category glyphs ---------------------------------------------------------

export const CATEGORY_ICONS: Record<string, (p: P) => React.ReactElement> = {
  Creativity: (p) => (
    <Svg {...p}>
      <path d="M12 4.5a7.5 7.5 0 1 0 0 15c1.2 0 1.6-.9 1.3-1.7-.4-1 .3-2 1.4-2h1.6a3.2 3.2 0 0 0 3.2-3.2c0-4.4-3.4-8.1-7.5-8.1Z" />
      <circle cx="8.4" cy="11" r="1" fill="currentColor" />
      <circle cx="11" cy="7.9" r="1" fill="currentColor" />
      <circle cx="15" cy="8.6" r="1" fill="currentColor" />
    </Svg>
  ),
  Business: (p) => (
    <Svg {...p}>
      <path d="M5 19.5h14M7 19.5v-5M11 19.5V9.5M15 19.5v-7M19 19.5V5" />
    </Svg>
  ),
  Music: (p) => (
    <Svg {...p}>
      <path d="M9.5 17.5V6l9-1.5v11" />
      <circle cx="7.5" cy="17.5" r="2" />
      <circle cx="16.5" cy="15.5" r="2" />
    </Svg>
  ),
  Sport: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="7.5" />
      <path d="m12 8.3 3 2.2-1.1 3.6h-3.8L9 10.5l3-2.2ZM12 4.5v3.8M15 10.5l3.9-1.3M13.9 14.1l2.3 3.3M10.1 14.1l-2.3 3.3M9 10.5 5.1 9.2" />
    </Svg>
  ),
  Life: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6" />
    </Svg>
  ),
  Confidence: (p) => (
    <Svg {...p}>
      <path d="M12 18.5c-2.5-1.6-4-4.2-4-7 0-2.3 1.6-4.5 4-6 2.4 1.5 4 3.7 4 6 0 2.8-1.5 5.4-4 7Z" />
      <path d="M12 18.5c-3.4 0-6.8-1.8-8-5 1.6-.6 3.3-.6 4.6 0M12 18.5c3.4 0 6.8-1.8 8-5-1.6-.6-3.3-.6-4.6 0" />
    </Svg>
  ),
  Culture: (p) => (
    <Svg {...p}>
      <path d="M4.5 9 12 4.5 19.5 9h-15ZM5 19.5h14M6.5 11v6.5M10 11v6.5M14 11v6.5M17.5 11v6.5" />
    </Svg>
  ),
  Wellness: (p) => (
    <Svg {...p}>
      <path d="M6 18c0-7 4.5-11.5 13-12.5C18.5 13.5 14 18 7 18" />
      <path d="M6 18c2.5-3.5 5-5.8 8.5-7.5" />
    </Svg>
  ),
};

/** The brand asterisk: eight chunky arms. Colour it with currentColor. */
export function Asterisk({ size = 48, className = "", style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} style={style} aria-hidden>
      <g fill="currentColor">
        {[0, 45, 90, 135].map((r) => (
          <rect key={r} x="41" y="0" width="18" height="100" transform={`rotate(${r} 50 50)`} />
        ))}
      </g>
    </svg>
  );
}
