"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { upsertSelfAnswer } from "@/lib/db/answers";
import { updateProfile } from "@/lib/db/profiles";
import type { Prompt } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { StepHeader } from "@/components/onboarding/StepHeader";

export function PromptsForm({ prompts }: { prompts: Prompt[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answeredCount = prompts.filter((p) => answers[p.id]?.trim()).length;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (answeredCount < prompts.length) {
      setError("answer all 5 to generate your scrapbook");
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("not signed in");

      await Promise.all(
        prompts.map((p) =>
          upsertSelfAnswer(supabase, {
            profile_id: user.id,
            prompt_id: p.id,
            answer: answers[p.id].trim(),
          })
        )
      );
      await updateProfile(supabase, user.id, { onboarded: true });
      router.push("/onboarding/reveal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <StepHeader
        step={4}
        total={5}
        title="5 quick questions"
        subtitle="answer as yourself — your friends will get a chance to answer these about you too."
      />

      <div className="space-y-5">
        {prompts.map((p, i) => (
          <div key={p.id}>
            <label className="mb-1 block text-sm font-semibold">
              {i + 1}. {p.question}
            </label>
            <Textarea
              rows={2}
              maxLength={280}
              value={answers[p.id] ?? ""}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, [p.id]: e.target.value }))
              }
            />
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-pink">{error}</p>}

      <div className="flex-1" />
      <p className="my-3 text-center text-xs text-ink-soft">
        {answeredCount}/{prompts.length} answered
      </p>
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "generating your meeeyu…" : "generate my meeeyu"}
      </Button>
    </form>
  );
}
