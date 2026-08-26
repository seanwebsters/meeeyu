"use client";

import { useState } from "react";
import Link from "next/link";
import { Polaroid } from "@/components/scrapbook/Polaroid";
import { CardTile } from "@/components/scrapbook/CardTile";
import { ScrapbookCanvas } from "@/components/scrapbook/ScrapbookCanvas";
import { AnswerForm } from "@/components/ask/AnswerForm";
import { LinkButton } from "@/components/ui/Button";
import { rotationFromId } from "@/lib/utils";
import type { Profile, ProfileCard, Prompt } from "@/lib/types";

export function AskFlow({
  profile,
  prompt,
  shareToken,
  teaserCards,
}: {
  profile: Profile;
  prompt: Prompt;
  shareToken: string;
  teaserCards: ProfileCard[];
}) {
  const [answered, setAnswered] = useState(false);
  const name = profile.display_name || profile.username;

  if (!answered) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center px-6 py-12 text-center">
        <Polaroid
          src={profile.avatar_url}
          caption={`@${profile.username}`}
          rotation={-3}
          size="sm"
          fallback="🙂"
        />
        <p className="mt-6 font-hand text-2xl text-pink">
          {name} wants to know…
        </p>
        <h1 className="mt-1 text-2xl font-semibold leading-snug">
          {prompt.question}
        </h1>
        <div className="mt-6 w-full">
          <AnswerForm
            profileId={profile.id}
            promptId={prompt.id}
            shareToken={shareToken}
            displayName={name}
            onDone={() => setAnswered(true)}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center px-4 py-12 text-center">
      <p className="font-hand text-2xl text-pink">sent! ♡</p>
      <h1 className="mt-1 text-2xl font-semibold">
        here&apos;s a peek at {name}&apos;s meeeyu
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        a scrapbook of who they are — part them, part everyone who knows them.
      </p>

      <div className="mt-4 w-full">
        <ScrapbookCanvas>
          {teaserCards.map((card) => (
            <CardTile key={card.id} card={card} rotation={rotationFromId(card.id)} />
          ))}
        </ScrapbookCanvas>
      </div>

      <div className="mt-4 w-full max-w-sm space-y-3">
        <LinkButton href={`/${profile.username}`} variant="secondary" className="w-full">
          see {name}&apos;s full meeeyu
        </LinkButton>
        <LinkButton href="/login" variant="pink" className="w-full">
          make your own meeeyu
        </LinkButton>
      </div>

      <p className="mt-8 text-xs text-ink-soft">
        already have an account? <Link href="/login" className="underline">log in</Link>
      </p>
    </main>
  );
}
