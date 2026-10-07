import { ImageResponse } from "next/og";

/** Red square, light-green V drawn as a single waveform stroke. */
export function renderMark(px: number) {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#EB4213" }}>
      <svg width={px * 0.62} height={px * 0.62} viewBox="0 0 32 32">
        <path d="M6 9.5 16 24 26 9.5" fill="none" stroke="#D8F382" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12.2 9.5v4.2M16 7v6.5M19.8 9.5v4.2" fill="none" stroke="#D8F382" strokeWidth={2.2} strokeLinecap="round" />
      </svg>
    </div>,
    { width: px, height: px },
  );
}
