import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";
import { getProfileByUsername } from "@/lib/db/profiles";
import { getSelfAnswers, getFriendAnswers } from "@/lib/db/answers";
import { getPromptById } from "@/lib/db/prompts";
import { aggregateAnswers } from "@/lib/aggregate";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function publicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function fallbackImage() {
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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string; promptId: string }> }
) {
  const { username, promptId } = await params;
  const supabase = publicClient();

  const profile = await getProfileByUsername(supabase, username);
  if (!profile) return fallbackImage();

  const prompt = await getPromptById(supabase, promptId);
  if (!prompt) return fallbackImage();

  const [selfAnswers, friendAnswers] = await Promise.all([
    getSelfAnswers(supabase, profile.id),
    getFriendAnswers(supabase, profile.id),
  ]);

  const mine = selfAnswers.find((a) => a.prompt_id === promptId);
  const theirs = aggregateAnswers(friendAnswers.filter((f) => f.prompt_id === promptId));
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
        <div style={{ fontSize: 26, color: "#ff6f9c", display: "flex" }}>
          {name} wants to know…
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: "#241f1a",
            textAlign: "center",
            maxWidth: 900,
            marginTop: 10,
            display: "flex",
          }}
        >
          {prompt.question}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 56,
            background: "#fffdf7",
            borderRadius: 28,
            padding: "40px 64px",
            boxShadow: "0 8px 24px rgba(36,31,26,0.12)",
            gap: 80,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: "#6b6258" }}>
              ME
            </div>
            <div style={{ display: "flex", fontSize: 40, color: "#241f1a", marginTop: 8 }}>
              {mine?.answer ?? "no answer yet"}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: "#ff6f9c" }}>
              YOU
            </div>
            <div style={{ display: "flex", fontSize: 40, color: "#241f1a", marginTop: 8 }}>
              {theirs[0] ? `${theirs[0].answer} — ${theirs[0].percentage}%` : "no answers yet"}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: 36,
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
