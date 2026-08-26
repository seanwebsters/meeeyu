import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ShareLink } from "@/lib/types";

type DB = SupabaseClient<Database>;

export async function createShareLink(
  supabase: DB,
  input: { profile_id: string; prompt_id?: string | null }
) {
  const { data, error } = await supabase
    .from("share_links")
    .insert({ profile_id: input.profile_id, prompt_id: input.prompt_id ?? null })
    .select("*")
    .single();
  if (error) throw error;
  return data as ShareLink;
}

export async function getOrCreateGeneralShareLink(supabase: DB, profileId: string) {
  const { data: existing, error: fetchError } = await supabase
    .from("share_links")
    .select("*")
    .eq("profile_id", profileId)
    .is("prompt_id", null)
    .limit(1)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (existing) return existing as ShareLink;
  return createShareLink(supabase, { profile_id: profileId, prompt_id: null });
}

export async function getShareLinkByToken(supabase: DB, token: string) {
  const { data, error } = await supabase
    .from("share_links")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;
  return data as ShareLink | null;
}
