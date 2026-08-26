import type { SupabaseClient } from "@supabase/supabase-js";
import type { CardContent, CardType, Database, ProfileCard } from "@/lib/types";

type DB = SupabaseClient<Database>;

export async function getCardsForProfile(supabase: DB, profileId: string) {
  const { data, error } = await supabase
    .from("profile_cards")
    .select("*")
    .eq("profile_id", profileId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ProfileCard[];
}

export async function createCard(
  supabase: DB,
  input: {
    profile_id: string;
    type: CardType;
    title?: string;
    content?: CardContent;
    position?: number;
    rotation?: number;
  }
) {
  const { data, error } = await supabase
    .from("profile_cards")
    .insert({
      profile_id: input.profile_id,
      type: input.type,
      title: input.title ?? null,
      content: input.content ?? {},
      position: input.position ?? 0,
      rotation: input.rotation ?? 0,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ProfileCard;
}

export async function updateCard(
  supabase: DB,
  id: string,
  patch: Partial<Pick<ProfileCard, "title" | "content" | "position" | "rotation">>
) {
  const { data, error } = await supabase
    .from("profile_cards")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as ProfileCard;
}

export async function deleteCard(supabase: DB, id: string) {
  const { error } = await supabase.from("profile_cards").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderCards(
  supabase: DB,
  updates: { id: string; position: number }[]
) {
  await Promise.all(
    updates.map((u) =>
      supabase.from("profile_cards").update({ position: u.position }).eq("id", u.id)
    )
  );
}
