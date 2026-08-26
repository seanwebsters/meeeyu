import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Prompt } from "@/lib/types";

type DB = SupabaseClient<Database>;

export async function getActivePrompts(supabase: DB) {
  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Prompt[];
}

export async function getPromptById(supabase: DB, id: string) {
  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Prompt | null;
}

export async function getPromptsByIds(supabase: DB, ids: string[]) {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("prompts").select("*").in("id", ids);
  if (error) throw error;
  return (data ?? []) as Prompt[];
}

export function pickRandomPrompts(prompts: Prompt[], count: number): Prompt[] {
  const shuffled = [...prompts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
