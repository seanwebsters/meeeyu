import { createClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/db/profiles";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getCurrentProfile() {
  const { supabase, user } = await getCurrentUser();
  if (!user) return { supabase, user: null, profile: null };
  const profile = await getProfileById(supabase, user.id);
  return { supabase, user, profile };
}
