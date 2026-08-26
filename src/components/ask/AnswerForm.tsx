"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { addFriendAnswer } from "@/lib/db/answers";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

export function AnswerForm({
  profileId,
  promptId,
  shareToken,
  displayName,
  onDone,
}: {
  profileId: string;
  promptId: string;
  shareToken: string;
  displayName: string;
  onDone: () => void;
}) {
  const supabase = createClient();

  const [answer, setAnswer] = useState("");
  const [responderName, setResponderName] = useState("");
  const [stayAnonymous, setStayAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!answer.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await addFriendAnswer(supabase, {
        profile_id: profileId,
        prompt_id: promptId,
        answer: answer.trim(),
        share_token: shareToken,
        responder_name: stayAnonymous ? undefined : responderName.trim() || undefined,
        is_anonymous: stayAnonymous,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "couldn't submit — try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        rows={3}
        maxLength={280}
        required
        autoFocus
        placeholder="be honest (be nice) 👀"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={stayAnonymous}
          onChange={(e) => setStayAnonymous(e.target.checked)}
          className="h-4 w-4 accent-pink"
        />
        answer anonymously
      </label>
      {!stayAnonymous && (
        <Input
          placeholder="your name"
          value={responderName}
          onChange={(e) => setResponderName(e.target.value)}
          maxLength={40}
        />
      )}
      {error && <p className="text-sm text-pink">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "sending…" : `tell ${displayName}`}
      </Button>
    </form>
  );
}
