import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";
import { getProfileByUsername } from "@/lib/db/profiles";
import { getSelfAnswers, getFriendAnswers } from "@/lib/db/answers";
import { getPromptsByIds } from "@/lib/db/prompts";
import { aggregateAnswers } from "@/lib/aggregate";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function publicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = publicClient();
  const profile = await getProfileByUsername(supabase, username);

  if (!profile) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#faf5ec",
            fontSize: 48,
            color: "#241f1a",
          }}
        >
          meeeyu
        </div>
      ),
      size
    );
  }

  const [selfAnswers, friendAnswers] = await Promise.all([
    getSelfAnswers(supabase, profile.id),
    getFriendAnswers(supabase, profile.id),
  ]);

  // Pick one prompt both sides have answered, to show the "me vs you" split.
  const sharedPromptId = selfAnswers.find((a) =>
    friendAnswers.some((f) => f.prompt_id === a.prompt_id)
  )?.prompt_id;

  let highlight: { question: string; me: string; you: string; pct: number } | null = null;
  if (sharedPromptId) {
    const [prompt] = await getPromptsByIds(supabase, [sharedPromptId]);
    const mine = selfAnswers.find((a) => a.prompt_id === sharedPromptId);
    const theirs = aggregateAnswers(
      friendAnswers.filter((f) => f.prompt_id === sharedPromptId)
    );
    if (prompt && mine && theirs[0]) {
      highlight = { question: prompt.question, me: mine.answer, you: theirs[0].answer, pct: theirs[0].percentage };
    }
  }

  const name = profile.display_name || profile.username;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf5ec",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(36,31,26,0.08) 1px, transparent 0)",
          backgroundSize: "28px 28px",
          padding: 60,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 140,
              height: 140,
              borderRadius: 999,
              background: profile.avatar_url
                ? undefined
                : "linear-gradient(135deg, #fbd9e3, #dcd0f7, #bfe8d4)",
              border: "6px solid white",
              boxShadow: "0 8px 20px rgba(36,31,26,0.2)",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
              overflow: "hidden",
            }}
          >
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                width={140}
                height={140}
                style={{ objectFit: "cover" }}
                alt=""
              />
            ) : (
              "🙂"
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 48, fontWeight: 700, color: "#241f1a" }}>
              {name}
            </div>
            <div style={{ display: "flex", fontSize: 26, color: "#6b6258" }}>
              @{profile.username}
            </div>
          </div>
        </div>

        {highlight && (
          <div
            style={{
              display: "flex",
              marginTop: 48,
              background: "#fffdf7",
              borderRadius: 28,
              padding: "32px 48px",
              boxShadow: "0 8px 24px rgba(36,31,26,0.12)",
              flexDirection: "column",
              alignItems: "center",
              maxWidth: 820,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 28,
                color: "#241f1a",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              {highlight.question}
            </div>
            <div style={{ display: "flex", gap: 60 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ display: "flex", fontSize: 20, fontWeight: 700, color: "#6b6258" }}>
                  ME
                </div>
                <div style={{ display: "flex", fontSize: 34, color: "#241f1a" }}>
                  {highlight.me}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ display: "flex", fontSize: 20, fontWeight: 700, color: "#ff6f9c" }}>
                  YOU
                </div>
                <div style={{ display: "flex", fontSize: 34, color: "#241f1a" }}>
                  {highlight.you} — {highlight.pct}%
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: 40,
            fontWeight: 700,
            color: "#241f1a",
            alignItems: "center",
            gap: 10,
          }}
        >
          meeeyu <span style={{ color: "#ff6f9c" }}>♡</span>
        </div>
      </div>
    ),
    size
  );
}
