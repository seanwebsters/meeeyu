import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PromptFriendAnswer, PromptSelfAnswer } from "@/lib/types";

type DB = SupabaseClient<Database>;

export async function getSelfAnswers(supabase: DB, profileId: string) {
  const { data, error } = await supabase
    .from("prompt_self_answers")
    .select("*")
    .eq("profile_id", profileId);
  if (error) throw error;
  return (data ?? []) as PromptSelfAnswer[];
}

export async function upsertSelfAnswer(
  supabase: DB,
  input: { profile_id: string; prompt_id: string; answer: string }
) {
  const { data, error } = await supabase
    .from("prompt_self_answers")
    .upsert(input, { onConflict: "profile_id,prompt_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as PromptSelfAnswer;
}

export async function getFriendAnswers(supabase: DB, profileId: string) {
  const { data, error } = await supabase
    .from("prompt_friend_answers")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PromptFriendAnswer[];
}

export async function addFriendAnswer(
  supabase: DB,
  input: {
    profile_id: string;
    prompt_id: string;
    answer: string;
    share_token?: string;
    responder_name?: string;
    responder_id?: string;
    is_anonymous?: boolean;
  }
) {
  const { data, error } = await supabase
    .from("prompt_friend_answers")
    .insert({
      profile_id: input.profile_id,
      prompt_id: input.prompt_id,
      answer: input.answer,
      share_token: input.share_token ?? null,
      responder_name: input.responder_name ?? null,
      responder_id: input.responder_id ?? null,
      is_anonymous: input.is_anonymous ?? true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as PromptFriendAnswer;
}
