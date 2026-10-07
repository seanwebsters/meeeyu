import { ImageResponse } from "next/og";
import { makeWaveform } from "@/lib/utils";

// Renders the shareable card. format=story → 1080×1920 (Instagram/TikTok
// Stories); format=og → 1200×630 (link previews). It's a tease: name, hook
// and duration only, never the audio or what was said.

const CREAM = "#0c0c0b";
const INK = "#f5f3ee";
const MOSS = "#d9f34f";
const STONE = "#8a8378";

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))]).catch(() => null);
}

async function googleFont(family: string, weight: number, text: string) {
  const css = await withTimeout(
    fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`).then((r) => r.text()),
    2500,
  );
  const url = css?.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!url) return null;
  return withTimeout(
    fetch(url).then((r) => r.arrayBuffer()),
    2500,
  );
}

async function avatarData(src: string | null) {
  if (!src || !/^https:\/\//.test(src)) return null;
  const res = await withTimeout(fetch(src), 3000);
  if (!res?.ok) return null;
  const type = res.headers.get("content-type") ?? "image/jpeg";
  if (!type.startsWith("image/")) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${type};base64,${buf.toString("base64")}`;
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const headline = (q.get("headline") ?? "Someone joined the group").slice(0, 60).toUpperCase();
  const name = (q.get("name") ?? "VoysNote").slice(0, 40);
  const dur = Math.min(30, Math.max(1, Number(q.get("dur")) || 27));
  const og = q.get("format") === "og";
  const W = og ? 1200 : 1080;
  const H = og ? 630 : 1920;
  const s = og ? 0.55 : 1; // scale factor for the og layout

  const allText = `${headline}${name}voysnoteTHE GROUPListen on VoysNote0123456789:30 seconds a day from the world's most interesting people`;
  const [serif, sans, avatar] = await Promise.all([googleFont("Inter", 600, allText), googleFont("Inter", 700, allText), avatarData(q.get("avatar"))]);
  const fonts = [
    ...(serif ? [{ name: "Inter", data: serif, weight: 600 as const, style: "normal" as const }] : []),
    ...(sans ? [{ name: "Inter", data: sans, weight: 700 as const, style: "normal" as const }] : []),
  ];

  const bars = makeWaveform(q.get("seed") ?? name, 30);
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  const mm = `0:${String(dur).padStart(2, "0")}`;

  const avatarSize = 300 * s;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        background: CREAM,
        color: INK,
        padding: `${140 * s}px ${90 * s}px ${120 * s}px`,
        fontFamily: "Inter",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 * s }}>
        <svg width={56 * s} height={56 * s} viewBox="0 0 32 32">
          <path d="M6 9.5 16 24 26 9.5" fill="none" stroke={MOSS} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12.2 9.5v4.2M16 7v6.5M19.8 9.5v4.2" fill="none" stroke={MOSS} strokeWidth={2.2} strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 56 * s, fontWeight: 700, letterSpacing: -3 * s }}>VoysNote</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- rendered by satori, not the browser
          <img src={avatar} width={avatarSize} height={avatarSize} style={{ borderRadius: 9999, objectFit: "cover" }} alt="" />
        ) : (
          <div
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: 9999,
              background: MOSS,
              color: CREAM,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 130 * s,
              fontWeight: 700,
            }}
          >
            {initials}
          </div>
        )}
        <span style={{ marginTop: 70 * s, fontSize: 28 * s, letterSpacing: 8 * s, color: STONE, fontWeight: 700 }}>THE GROUP</span>
        <span
          style={{
            marginTop: 22 * s,
            fontSize: (og ? 110 : 96) * s,
            lineHeight: 1,
            letterSpacing: -3 * s,
            fontWeight: 700,
            maxWidth: og ? 1100 : 900,
            textAlign: "center",
          }}
        >
          {headline}
        </span>
        <div
          style={{
            marginTop: 70 * s,
            display: "flex",
            alignItems: "center",
            gap: 26 * s,
            background: MOSS,
            color: CREAM,
            borderRadius: 9999,
            padding: `${30 * s}px ${44 * s}px`,
            width: 780 * s,
          }}
        >
          <svg width={46 * s} height={46 * s} viewBox="0 0 24 24">
            <rect x="9" y="3.5" width="6" height="11" rx="3" fill={CREAM} />
            <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" fill="none" stroke={CREAM} strokeWidth={1.8} strokeLinecap="round" />
          </svg>
          <div style={{ display: "flex", alignItems: "center", gap: 6 * s, flex: 1, height: 60 * s }}>
            {bars.map((v, i) => (
              <div key={i} style={{ flex: 1, height: `${Math.max(18, v * 100)}%`, background: "rgba(12,12,11,0.7)", borderRadius: 99 }} />
            ))}
          </div>
          <span style={{ fontSize: 40 * s, fontWeight: 700 }}>{mm}</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ fontSize: 46 * s, fontWeight: 700, color: MOSS }}>Listen on VoysNote</span>
        {!og && <span style={{ marginTop: 14, fontSize: 28, color: STONE }}>30 seconds a day from the world&apos;s most interesting people</span>}
      </div>
    </div>,
    {
      width: W,
      height: H,
      fonts: fonts.length ? fonts : undefined,
      headers: { "cache-control": "public, max-age=86400, immutable" },
    },
  );
}
