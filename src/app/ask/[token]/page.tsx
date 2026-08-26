import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getShareLinkByToken } from "@/lib/db/share";
import { getProfileById } from "@/lib/db/profiles";
import { getPromptById, getActivePrompts, pickRandomPrompts } from "@/lib/db/prompts";
import { getCardsForProfile } from "@/lib/db/cards";
import { AskFlow } from "@/components/ask/AskFlow";

export default async function AskPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const shareLink = await getShareLinkByToken(supabase, token);
  if (!shareLink) notFound();

  const profile = await getProfileById(supabase, shareLink.profile_id);
  if (!profile) notFound();

  const prompt = shareLink.prompt_id
    ? await getPromptById(supabase, shareLink.prompt_id)
    : pickRandomPrompts(await getActivePrompts(supabase), 1)[0];
  if (!prompt) notFound();

  const cards = await getCardsForProfile(supabase, profile.id);

  return (
    <AskFlow
      profile={profile}
      prompt={prompt}
      shareToken={token}
      teaserCards={cards.slice(0, 4)}
    />
  );
}
