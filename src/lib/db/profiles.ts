import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Profile, Vibe } from "@/lib/types";

type DB = SupabaseClient<Database>;

export async function getProfileByUsername(supabase: DB, username: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", username)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function getProfileById(supabase: DB, id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function isUsernameAvailable(supabase: DB, username: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .maybeSingle();
  if (error) throw error;
  return !data;
}

export async function createProfile(
  supabase: DB,
  input: { id: string; username: string; display_name?: string }
) {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: input.id,
      username: input.username,
      display_name: input.display_name ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(
  supabase: DB,
  id: string,
  patch: Partial<Pick<Profile, "display_name" | "avatar_url" | "bio" | "vibe" | "onboarded">> & {
    vibe?: Vibe;
  }
) {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Profile;
}
