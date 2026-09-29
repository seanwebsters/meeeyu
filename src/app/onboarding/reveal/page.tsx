import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getCardsForProfile } from "@/lib/db/cards";
import { getOrCreateGeneralShareLink } from "@/lib/db/share";
import { getSiteUrl } from "@/lib/site";
import { ScrapbookCanvas } from "@/components/scrapbook/ScrapbookCanvas";
import { CardTile } from "@/components/scrapbook/CardTile";
import { Polaroid } from "@/components/scrapbook/Polaroid";
import { ShareBar } from "@/components/share/ShareBar";
import { LinkButton } from "@/components/ui/Button";
import { rotationFromId } from "@/lib/utils";

export default async function RevealStep() {
  const { supabase, user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding/username");
  if (!profile.onboarded) redirect("/onboarding/photo");

  const cards = await getCardsForProfile(supabase, profile.id);
  const profileUrl = `${getSiteUrl()}/${profile.username}`;

  // Non-essential: pre-creating a shareable /ask link is a convenience, not
  // something onboarding completion should ever hinge on.
  const shareLink = await getOrCreateGeneralShareLink(supabase, profile.id).catch(
    () => null
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center px-4 py-10 text-center">
      <p className="font-hand text-2xl text-pink">it&apos;s ready ♡</p>
      <h1 className="mt-1 text-2xl font-semibold">your meeeyu is coming together</h1>
      <p className="mt-2 text-sm text-ink-soft">
        this is just the start — customise it any time and watch it grow as
        friends chime in.
      </p>

      <div className="mt-6 w-full">
        <ScrapbookCanvas>
          <Polaroid
            src={profile.avatar_url}
            caption={profile.display_name ?? profile.username}
            rotation={-3}
            fallback="🙂"
          />
          {cards.slice(0, 5).map((card) => (
            <CardTile
              key={card.id}
              card={card}
              rotation={rotationFromId(card.id)}
            />
          ))}
        </ScrapbookCanvas>
      </div>

      <div className="mt-6 w-full max-w-sm space-y-3">
        <LinkButton href={`/${profile.username}/edit`} variant="secondary" className="w-full">
          customise my meeeyu
        </LinkButton>
        <ShareBar
          url={profileUrl}
          title={`${profile.display_name ?? profile.username}'s meeeyu`}
          text="come see my meeeyu — and tell me how you really see me 👀"
        />
        <LinkButton href={`/${profile.username}`} variant="ghost" className="w-full">
          view my meeeyu
        </LinkButton>
        {shareLink && (
          <p className="pt-1 text-xs text-ink-soft">
            general share link: {getSiteUrl()}/ask/{shareLink.token}
          </p>
        )}
      </div>
    </main>
  );
}
