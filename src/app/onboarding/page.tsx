import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function OnboardingIndex() {
  const { user, profile } = await getCurrentProfile();

  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding/username");
  if (profile.onboarded) redirect(`/${profile.username}`);
  redirect("/onboarding/photo");
}
