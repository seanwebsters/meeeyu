import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

type DB = SupabaseClient<Database>;

export async function getFollowCounts(supabase: DB, profileId: string) {
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profileId),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profileId),
  ]);
  return { followers: followers ?? 0, following: following ?? 0 };
}

export async function isFollowing(supabase: DB, followerId: string, followingId: string) {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}
