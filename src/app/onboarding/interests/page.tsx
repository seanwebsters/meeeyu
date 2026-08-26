"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createCard } from "@/lib/db/cards";
import { CARD_META } from "@/components/scrapbook/CardTile";
import { rotationFromId } from "@/lib/utils";
import type { CardType } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StepHeader } from "@/components/onboarding/StepHeader";
import { cn } from "@/lib/utils";

const CHOICES: { type: CardType; placeholder: string }[] = [
  { type: "music", placeholder: "e.g. 505 by Arctic Monkeys" },
  { type: "film", placeholder: "e.g. Amélie" },
  { type: "book", placeholder: "e.g. Norwegian Wood" },
  { type: "place", placeholder: "e.g. Lisbon" },
  { type: "food", placeholder: "e.g. ramen" },
  { type: "outfit", placeholder: "e.g. oversized denim jacket" },
  { type: "person", placeholder: "e.g. my grandma" },
  { type: "thing", placeholder: "e.g. my film camera" },
  { type: "memory", placeholder: "e.g. that summer road trip" },
  { type: "obsession", placeholder: "e.g. cottagecore pinterest boards" },
  { type: "quote", placeholder: "a quote you live by" },
  { type: "fact", placeholder: "a random fact about you" },
  { type: "mood", placeholder: "how you're feeling lately" },
];

const MIN_SELECTED = 3;

export default function InterestsStep() {
  const router = useRouter();
  const supabase = createClient();

  const [selected, setSelected] = useState<Set<CardType>>(new Set());
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(type: CardType) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  const chosenList = CHOICES.filter((c) => selected.has(c.type));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const filled = chosenList.filter((c) => values[c.type]?.trim());
    if (filled.length < MIN_SELECTED) {
      setError(`fill in at least ${MIN_SELECTED} to keep going`);
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("not signed in");

      await Promise.all(
        filled.map((c, i) => {
          const meta = CARD_META[c.type];
          const value = values[c.type].trim();
          return createCard(supabase, {
            profile_id: user.id,
            type: c.type,
            title: meta.note === "sticky" ? undefined : value,
            content: meta.note === "sticky" ? { text: value } : {},
            position: i,
            rotation: rotationFromId(`${user.id}-${c.type}`),
          });
        })
      );
      router.push("/onboarding/prompts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <StepHeader
        step={3}
        total={5}
        title="let's fill your meeeyu"
        subtitle="pick a few of your favourite things — you can always add more later"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {CHOICES.map(({ type }) => {
          const meta = CARD_META[type];
          const active = selected.has(type);
          return (
            <button
              type="button"
              key={type}
              onClick={() => toggle(type)}
              className={cn(
                "rounded-full border-2 px-3.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-ink bg-ink text-paper"
                  : "border-ink/10 bg-paper-card text-ink"
              )}
            >
              {meta.icon} {meta.label || type}
            </button>
          );
        })}
      </div>

      {chosenList.length > 0 && (
        <div className="mb-4 space-y-3">
          {chosenList.map((c) => {
            const meta = CARD_META[c.type];
            return (
              <div key={c.type}>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  {meta.icon} {meta.label || c.type}
                </label>
                <Input
                  placeholder={c.placeholder}
                  value={values[c.type] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [c.type]: e.target.value }))
                  }
                  maxLength={120}
                />
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="mb-2 text-sm text-pink">{error}</p>}

      <div className="flex-1" />
      <p className="mb-3 text-center text-xs text-ink-soft">
        you can always add more later!
      </p>
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "saving…" : "next"}
      </Button>
    </form>
  );
}
