import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProfileByUsername } from "@/lib/db/profiles";
import { getCardsForProfile } from "@/lib/db/cards";
import { getActivePrompts } from "@/lib/db/prompts";
import { getSelfAnswers } from "@/lib/db/answers";
import { EditBoard } from "@/components/edit/EditBoard";

export default async function EditPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfileByUsername(supabase, username);
  if (!profile) redirect("/onboarding");
  if (profile.id !== user.id) redirect(`/${username}`);

  const [cards, prompts, selfAnswers] = await Promise.all([
    getCardsForProfile(supabase, profile.id),
    getActivePrompts(supabase),
    getSelfAnswers(supabase, profile.id),
  ]);

  return (
    <EditBoard
      profile={profile}
      initialCards={cards}
      allPrompts={prompts}
      initialSelfAnswers={selfAnswers}
    />
  );
}
