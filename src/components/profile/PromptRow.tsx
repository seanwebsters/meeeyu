"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createShareLink } from "@/lib/db/share";
import { addFriendAnswer } from "@/lib/db/answers";
import { getSiteUrl } from "@/lib/site";
import type { AggregatedAnswer } from "@/lib/aggregate";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { ShareBar } from "@/components/share/ShareBar";

export function PromptRow({
  profileId,
  promptId,
  question,
  selfAnswer,
  aggregated,
  friendCount,
  isOwner,
  viewerId,
}: {
  profileId: string;
  promptId: string;
  question: string;
  selfAnswer: string | null;
  aggregated: AggregatedAnswer[];
  friendCount: number;
  isOwner: boolean;
  viewerId: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"idle" | "answering" | "sharing" | "done">("idle");
  const [answer, setAnswer] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const top = aggregated[0];

  async function handleShare() {
    setBusy(true);
    setError(null);
    try {
      const link = await createShareLink(supabase, {
        profile_id: profileId,
        prompt_id: promptId,
      });
      setShareUrl(`${getSiteUrl()}/ask/${link.token}`);
      setMode("sharing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "couldn't create link");
    } finally {
      setBusy(false);
    }
  }

  async function handleAnswer() {
    if (!viewerId) {
      router.push("/login");
      return;
    }
    if (!answer.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await addFriendAnswer(supabase, {
        profile_id: profileId,
        prompt_id: promptId,
        answer: answer.trim(),
        responder_id: viewerId,
        is_anonymous: false,
      });
      setMode("done");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "couldn't submit");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="scrapbook-shadow rounded-2xl bg-paper-card p-4">
      <p className="text-sm font-semibold">{question}</p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">me</p>
          <p className="mt-0.5 font-hand text-xl leading-snug text-ink">
            {selfAnswer || <span className="text-ink-soft">no answer yet</span>}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-pink">you</p>
          {top ? (
            <>
              <p className="mt-0.5 font-hand text-xl leading-snug text-ink">
                {top.answer}
              </p>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full bg-pink"
                  style={{ width: `${top.percentage}%` }}
                />
              </div>
              <p className="mt-0.5 text-xs text-ink-soft">
                {top.percentage}% of {friendCount} {friendCount === 1 ? "friend" : "friends"}
              </p>
            </>
          ) : (
            <p className="mt-0.5 text-ink-soft">no answers yet</p>
          )}
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-pink">{error}</p>}

      <div className="mt-3">
        {mode === "idle" && isOwner && (
          <Button variant="secondary" onClick={handleShare} disabled={busy} className="w-full py-2 text-xs">
            {busy ? "creating link…" : "ask friends this question"}
          </Button>
        )}
        {mode === "sharing" && shareUrl && (
          <ShareBar url={shareUrl} title="answer a question about me" />
        )}
        {mode === "idle" && !isOwner && (
          <Button variant="secondary" onClick={() => setMode("answering")} className="w-full py-2 text-xs">
            answer this about them
          </Button>
        )}
        {mode === "answering" && (
          <div className="space-y-2">
            <Textarea
              rows={2}
              maxLength={280}
              autoFocus
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="your honest answer…"
            />
            <Button onClick={handleAnswer} disabled={busy} className="w-full py-2 text-xs">
              {busy ? "sending…" : "submit"}
            </Button>
          </div>
        )}
        {mode === "done" && (
          <p className="text-center text-xs font-semibold text-emerald-600">
            thanks for answering! ✓
          </p>
        )}
      </div>
    </div>
  );
}
