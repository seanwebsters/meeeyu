import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActivePrompts, pickRandomPrompts } from "@/lib/db/prompts";
import { PromptsForm } from "@/components/onboarding/PromptsForm";

export default async function PromptsStep() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const all = await getActivePrompts(supabase);
  const picked = pickRandomPrompts(all, 5);

  return <PromptsForm prompts={picked} />;
}
