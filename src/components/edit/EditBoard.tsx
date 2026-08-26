"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { createCard, reorderCards } from "@/lib/db/cards";
import { upsertSelfAnswer } from "@/lib/db/answers";
import { updateProfile } from "@/lib/db/profiles";
import { CARD_META } from "@/components/scrapbook/CardTile";
import { CardEditorRow } from "@/components/edit/CardEditorRow";
import { rotationFromId, cn } from "@/lib/utils";
import type { CardType, Profile, ProfileCard, Prompt, PromptSelfAnswer, Vibe } from "@/lib/types";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

const CARD_TYPES = Object.keys(CARD_META) as CardType[];
const VIBES: Vibe[] = ["soft", "bold", "dreamy", "retro", "minimal", "playful", "indie", "y2k", "cute"];

type Tab = "cards" | "prompts" | "profile";

export function EditBoard({
  profile,
  initialCards,
  allPrompts,
  initialSelfAnswers,
}: {
  profile: Profile;
  initialCards: ProfileCard[];
  allPrompts: Prompt[];
  initialSelfAnswers: PromptSelfAnswer[];
}) {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("cards");
  const [cards, setCards] = useState(initialCards);
  const [newType, setNewType] = useState<CardType>("thing");
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(initialSelfAnswers.map((a) => [a.prompt_id, a.answer]))
  );
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [vibe, setVibe] = useState<Vibe>(profile.vibe);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const fileInput = useRef<HTMLInputElement>(null);

  function updateCardInState(updated: ProfileCard) {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  async function addCard() {
    const created = await createCard(supabase, {
      profile_id: profile.id,
      type: newType,
      position: cards.length,
      rotation: rotationFromId(`${profile.id}-${newType}-${cards.length}`),
    });
    setCards((prev) => [...prev, created]);
  }

  async function moveCard(id: string, direction: "up" | "down") {
    const index = cards.findIndex((c) => c.id === id);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= cards.length) return;
    const next = [...cards];
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    setCards(next);
    await reorderCards(
      supabase,
      next.map((c, i) => ({ id: c.id, position: i }))
    );
  }

  async function saveAnswer(promptId: string, value: string) {
    if (!value.trim()) return;
    await upsertSelfAnswer(supabase, {
      profile_id: profile.id,
      prompt_id: promptId,
      answer: value.trim(),
    });
  }

  async function saveProfile(patch: Partial<Pick<Profile, "display_name" | "bio">>) {
    await updateProfile(supabase, profile.id, patch);
  }

  async function saveVibe(v: Vibe) {
    setVibe(v);
    await updateProfile(supabase, profile.id, { vibe: v });
  }

  async function handleAvatar(file: File) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${profile.id}/avatar-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) return;
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(publicUrl);
    await updateProfile(supabase, profile.id, { avatar_url: publicUrl });
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">customise your meeeyu</h1>
        <LinkButton href={`/${profile.username}`} variant="ghost" className="px-3 py-2 text-sm">
          done
        </LinkButton>
      </div>

      <div className="mb-6 flex gap-2">
        {(["cards", "prompts", "profile"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold capitalize",
              tab === t ? "bg-ink text-paper" : "bg-paper-card text-ink-soft"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "cards" && (
        <div className="space-y-3">
          {cards.map((card, i) => (
            <CardEditorRow
              key={card.id}
              card={card}
              profileId={profile.id}
              onChange={updateCardInState}
              onRemove={() => setCards((prev) => prev.filter((c) => c.id !== card.id))}
              onMove={(dir) => moveCard(card.id, dir)}
              isFirst={i === 0}
              isLast={i === cards.length - 1}
            />
          ))}

          <div className="scrapbook-shadow flex items-center gap-2 rounded-2xl border-2 border-dashed border-ink/15 bg-transparent p-3">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as CardType)}
              className="flex-1 rounded-xl border-2 border-ink/10 bg-paper-card px-3 py-2 text-sm"
            >
              {CARD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {CARD_META[t].icon} {CARD_META[t].label || t}
                </option>
              ))}
            </select>
            <Button onClick={addCard} className="px-4 py-2 text-sm">
              add
            </Button>
          </div>
        </div>
      )}

      {tab === "prompts" && (
        <div className="space-y-4">
          <p className="text-sm text-ink-soft">
            answer prompts as yourself — friends answer these about you on your profile.
          </p>
          {allPrompts.map((p) => (
            <div key={p.id}>
              <label className="mb-1 block text-sm font-semibold">{p.question}</label>
              <Textarea
                rows={2}
                maxLength={280}
                defaultValue={answers[p.id] ?? ""}
                onBlur={(e) => {
                  setAnswers((a) => ({ ...a, [p.id]: e.target.value }));
                  saveAnswer(p.id, e.target.value);
                }}
              />
            </div>
          ))}
        </div>
      )}

      {tab === "profile" && (
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-pink-soft via-lavender to-mint"
            >
              {avatarUrl && (
                <Image src={avatarUrl} alt="" fill className="object-cover" unoptimized />
              )}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleAvatar(f);
              }}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="text-sm text-pink underline"
            >
              change photo
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
              name
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={() => saveProfile({ display_name: displayName })}
              maxLength={40}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
              bio
            </label>
            <Textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              onBlur={() => saveProfile({ bio })}
              maxLength={160}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
              your vibe
            </label>
            <div className="flex flex-wrap gap-2">
              {VIBES.map((v) => (
                <button
                  key={v}
                  onClick={() => saveVibe(v)}
                  className={cn(
                    "rounded-full border-2 px-3.5 py-2 text-sm capitalize",
                    vibe === v ? "border-ink bg-ink text-paper" : "border-ink/10 bg-paper-card"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <Link href={`/${profile.username}`} className="block text-center text-sm text-ink-soft underline">
            view public profile
          </Link>
        </div>
      )}
    </main>
  );
}
