import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Reaction } from "@/lib/types";

type DB = SupabaseClient<Database>;

export async function getReactionsForProfile(supabase: DB, profileId: string) {
  const { data, error } = await supabase
    .from("reactions")
    .select("*")
    .eq("profile_id", profileId);
  if (error) throw error;
  return (data ?? []) as Reaction[];
}

export async function addReaction(
  supabase: DB,
  input: {
    profile_id: string;
    emoji: string;
    card_id?: string | null;
    reactor_id?: string | null;
  }
) {
  const { data, error } = await supabase
    .from("reactions")
    .insert({
      profile_id: input.profile_id,
      emoji: input.emoji,
      card_id: input.card_id ?? null,
      reactor_id: input.reactor_id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Reaction;
}

export function countByEmoji(reactions: Reaction[]) {
  const counts = new Map<string, number>();
  for (const r of reactions) {
    counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);
  }
  return counts;
}
