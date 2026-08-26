import { getCurrentProfile } from "@/lib/auth";
import { LinkButton } from "@/components/ui/Button";
import { StickyNote } from "@/components/scrapbook/StickyNote";
import { Polaroid } from "@/components/scrapbook/Polaroid";
import { TornPaper } from "@/components/scrapbook/TornPaper";
import { PinSticker } from "@/components/scrapbook/PinSticker";

export default async function Home() {
  const { user, profile } = await getCurrentProfile();
  const loggedInHref = profile?.onboarded ? `/${profile.username}` : "/onboarding";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-between px-6 py-12 text-center">
      <div />

      <div>
        <p className="font-hand text-2xl text-ink-soft">a little digital world,</p>
        <h1 className="mt-1 text-5xl font-bold tracking-tight">
          meeeyu <span className="text-pink">♡</span>
        </h1>
        <p className="mt-1 font-hand text-2xl text-ink-soft">made about you.</p>

        <div className="relative mt-10 flex h-56 items-center justify-center">
          <Polaroid
            className="absolute -left-2 top-0"
            rotation={-8}
            size="sm"
            fallback="🌙"
          />
          <StickyNote
            color="pink"
            rotation={6}
            className="absolute right-0 top-4 w-auto whitespace-nowrap"
          >
            golden retriever fr
          </StickyNote>
          <TornPaper rotation={-3} className="relative w-44">
            <PinSticker className="left-1/2 top-1 -translate-x-1/2" />
            <p className="text-xs uppercase tracking-wide text-ink-soft">on repeat</p>
            <p className="font-semibold">505 — Arctic Monkeys</p>
          </TornPaper>
        </div>

        <p className="mx-auto mt-10 max-w-xs text-sm text-ink-soft">
          make your own visual scrapbook, then find out how your friends
          <em> really </em>
          see you.
        </p>
      </div>

      <div className="w-full space-y-3">
        <LinkButton href={user ? loggedInHref : "/login"} className="w-full">
          {user ? "go to my meeeyu" : "get started"}
        </LinkButton>
        {!user && (
          <LinkButton href="/login" variant="ghost" className="w-full">
            log in
          </LinkButton>
        )}
      </div>
    </main>
  );
}
