import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getProfileByUsername } from "@/lib/db/profiles";
import { getCardsForProfile } from "@/lib/db/cards";
import { getSelfAnswers, getFriendAnswers } from "@/lib/db/answers";
import { getPromptsByIds } from "@/lib/db/prompts";
import { getReactionsForProfile, countByEmoji } from "@/lib/db/reactions";
import { getFollowCounts, isFollowing } from "@/lib/db/follows";
import { aggregateAnswers } from "@/lib/aggregate";
import { computeStreak } from "@/lib/streak";
import { getBackground } from "@/lib/backgrounds";
import { rotationFromId } from "@/lib/utils";
import { getSiteUrl } from "@/lib/site";

import { Polaroid } from "@/components/scrapbook/Polaroid";
import { ScrapbookCanvas } from "@/components/scrapbook/ScrapbookCanvas";
import { CardTile } from "@/components/scrapbook/CardTile";
import { MemoriesBoard } from "@/components/scrapbook/MemoriesBoard";
import { ReactionBar } from "@/components/profile/ReactionBar";
import { FollowButton } from "@/components/profile/FollowButton";
import { PromptRow } from "@/components/profile/PromptRow";
import { StreakBadge } from "@/components/profile/StreakBadge";
import { ShareBar } from "@/components/share/ShareBar";
import { ShareImageButton } from "@/components/share/ShareImageButton";
import { LinkButton } from "@/components/ui/Button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const profile = await getProfileByUsername(supabase, username);
  if (!profile) return {};
  const name = profile.display_name || profile.username;
  const title = `${name} (@${profile.username}) — meeeyu`;
  const description = profile.bio || `See how ${name}'s friends really see them, on meeeyu.`;
  const imageUrl = `${getSiteUrl()}/${profile.username}/card`;

  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: imageUrl, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const { supabase, user } = await getCurrentUser();

  const profile = await getProfileByUsername(supabase, username);
  if (!profile || !profile.onboarded) notFound();

  const isOwner = user?.id === profile.id;

  const [cards, selfAnswers, friendAnswers, reactions, counts, viewerFollows] =
    await Promise.all([
      getCardsForProfile(supabase, profile.id),
      getSelfAnswers(supabase, profile.id),
      getFriendAnswers(supabase, profile.id),
      getReactionsForProfile(supabase, profile.id),
      getFollowCounts(supabase, profile.id),
      user && !isOwner ? isFollowing(supabase, user.id, profile.id) : Promise.resolve(false),
    ]);

  const promptIds = Array.from(
    new Set([
      ...selfAnswers.map((a) => a.prompt_id),
      ...friendAnswers.map((a) => a.prompt_id),
    ])
  );
  const prompts = await getPromptsByIds(supabase, promptIds);
  const promptById = new Map(prompts.map((p) => [p.id, p]));
  const selfByPrompt = new Map(selfAnswers.map((a) => [a.prompt_id, a.answer]));
  const friendsByPrompt = new Map<string, typeof friendAnswers>();
  for (const fa of friendAnswers) {
    const list = friendsByPrompt.get(fa.prompt_id) ?? [];
    list.push(fa);
    friendsByPrompt.set(fa.prompt_id, list);
  }

  const name = profile.display_name || profile.username;
  const reactionCounts = Object.fromEntries(countByEmoji(reactions));

  // "me + you" activity streak: consecutive days someone — owner or friend —
  // has added to this meeeyu (a card, a prompt answer, or a reaction).
  const streak = computeStreak([
    ...cards.flatMap((c) => [c.created_at, c.updated_at]),
    ...selfAnswers.map((a) => a.created_at),
    ...friendAnswers.map((a) => a.created_at),
    ...reactions.map((r) => r.created_at),
  ]);

  const theme = getBackground(profile.background);
  const gridCards = cards.filter((c) => c.type !== "memory");
  const memoryCards = cards.filter((c) => c.type === "memory");

  return (
    <main
      className="mx-auto min-h-dvh w-full max-w-2xl bg-paper text-ink pb-16"
      style={theme.vars}
    >
      <header className="flex flex-col items-center px-6 pt-10 text-center">
        <Polaroid
          src={profile.avatar_url}
          rotation={-2}
          size="md"
          fallback="🙂"
        />
        <h1 className="mt-4 text-2xl font-semibold">{name}</h1>
        <p className="text-sm text-ink-soft">@{profile.username}</p>
        {profile.bio && <p className="mt-2 max-w-sm text-sm">{profile.bio}</p>}

        {streak > 0 && (
          <div className="mt-3">
            <StreakBadge days={streak} />
          </div>
        )}

        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <span className="font-semibold">{cards.length}</span>{" "}
            <span className="text-ink-soft">things</span>
          </div>
          <div>
            <span className="font-semibold">{counts.followers}</span>{" "}
            <span className="text-ink-soft">followers</span>
          </div>
          <div>
            <span className="font-semibold">{counts.following}</span>{" "}
            <span className="text-ink-soft">following</span>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          {isOwner ? (
            <LinkButton href={`/${profile.username}/edit`} variant="secondary">
              customise
            </LinkButton>
          ) : (
            <FollowButton
              targetId={profile.id}
              viewerId={user?.id ?? null}
              initiallyFollowing={viewerFollows}
            />
          )}
        </div>

        <div className="mt-5 w-full max-w-xs space-y-2">
          <ShareBar
            url={`${getSiteUrl()}/${profile.username}`}
            title={`${name}'s meeeyu`}
            text={`come see ${name}'s meeeyu ♡`}
          />
          <ShareImageButton
            imageUrl={`${getSiteUrl()}/${profile.username}/card`}
            fileName={`${profile.username}-meeeyu.png`}
            title={`${name}'s meeeyu`}
            text={`come see ${name}'s meeeyu ♡`}
          />
        </div>

        <div className="mt-5">
          <ReactionBar
            profileId={profile.id}
            viewerId={user?.id ?? null}
            initialCounts={reactionCounts}
          />
        </div>
      </header>

      <section className="mt-8">
        <ScrapbookCanvas>
          {gridCards.map((card) => (
            <CardTile key={card.id} card={card} rotation={rotationFromId(card.id)} />
          ))}
        </ScrapbookCanvas>
        {cards.length === 0 && (
          <p className="text-center text-sm text-ink-soft">
            {isOwner ? "your scrapbook is empty — go add some things!" : "nothing here yet."}
          </p>
        )}
      </section>

      {memoryCards.length > 0 && (
        <section className="mt-10 px-4">
          <h2 className="mb-3 px-1 text-center font-hand text-3xl text-ink">
            memories
          </h2>
          <MemoriesBoard cards={memoryCards} />
        </section>
      )}

      {promptIds.length > 0 && (
        <section className="mt-10 space-y-3 px-4">
          <h2 className="px-1 text-center font-hand text-3xl text-ink">
            me <span className="text-pink">vs</span> you
          </h2>
          {promptIds.map((id) => {
            const prompt = promptById.get(id);
            if (!prompt) return null;
            const friends = friendsByPrompt.get(id) ?? [];
            return (
              <PromptRow
                key={id}
                profileId={profile.id}
                username={profile.username}
                promptId={id}
                question={prompt.question}
                selfAnswer={selfByPrompt.get(id) ?? null}
                aggregated={aggregateAnswers(friends)}
                friendCount={friends.length}
                isOwner={isOwner}
                viewerId={user?.id ?? null}
              />
            );
          })}
        </section>
      )}
    </main>
  );
}
