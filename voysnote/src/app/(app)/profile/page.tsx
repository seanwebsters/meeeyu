"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { actions, useApp, useCatalog } from "@/lib/store/app";
import { supabaseConfigured } from "@/lib/supabase/client";
import { initials } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { IconBell, IconChevron, IconGrid, IconCrown } from "@/components/icons";
import { toast } from "@/components/ui/Toast";
import { Toggle } from "@/components/ui/Toggle";

export default function ProfilePage() {
  const router = useRouter();
  const user = useApp((s) => s.user)!;
  const follows = useApp((s) => s.follows);
  const purchases = useApp((s) => s.purchases);
  const settings = useApp((s) => s.settings);
  const savedCount = useApp((s) => s.saved.length);
  const playedCount = useApp((s) => s.played.length);
  const { idx } = useCatalog();
  const plus = user.subscriptionStatus === "plus";

  return (
    <div className="pb-40">
      <header className="flex items-center justify-between px-5 pt-[max(20px,env(safe-area-inset-top))]">
        <div className="flex items-center gap-1.5">
          <span className="wordmark text-[22px]">VoysNote</span>
        </div>
        <Link href="/notifications" className="rounded-full p-2 hover:bg-mist" aria-label="Notifications">
          <IconBell />
        </Link>
      </header>

      <section className="px-5 pt-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-cream">
          <span className="display text-[30px]">{initials(user.name)}</span>
        </div>
        <h1 className="display mt-4 text-[30px]">{user.name}</h1>
        <p className="mt-1 text-[14px] text-stone">
          In the group since {new Date(user.joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
          {plus && " · VoysNote+"}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {user.interests.map((i) => (
            <span key={i} className="rounded-full border border-line px-3 py-1 text-[12px] font-medium text-ink-2">
              {i}
            </span>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-3 divide-x divide-line rounded-[22px] bg-paper py-4 text-center ring-1 ring-line">
          <Stat n={follows.length} label="Following" />
          <Stat n={savedCount} label="Saved" />
          <Stat n={playedCount} label="Played" />
        </div>
      </section>

      <section className="px-5 pt-6">
        {plus ? (
          <Link href="/plus" className="card flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-soft text-gold">
              <IconCrown size={20} />
            </span>
            <div className="flex-1">
              <p className="text-[15px] font-semibold">VoysNote+ member</p>
              <p className="text-[13px] text-stone">Full archive, exclusives, early access</p>
            </div>
            <IconChevron size={18} />
          </Link>
        ) : (
          <div className="relative overflow-hidden rounded-[24px] bg-accent-soft p-5">
            <span className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gold-soft" />
            <p className="relative flex items-center gap-1.5 text-[13px] font-semibold text-gold">
              <IconCrown size={16} /> VoysNote+
            </p>
            <p className="display relative mt-2 text-[24px]">Go deeper. Hear everything first.</p>
            <p className="relative mt-1.5 text-[13px] text-ink-2">The full archive, exclusive notes and early access. £5.99/month.</p>
            <ButtonLink href="/plus" size="sm" className="relative mt-4">
              Explore VoysNote+
            </ButtonLink>
          </div>
        )}
      </section>

      {follows.length > 0 && (
        <section className="px-5 pt-8">
          <h2 className="mb-3 text-[16px] font-semibold">Following</h2>
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
            {follows.map((id) => {
              const c = idx.creators.get(id);
              if (!c) return null;
              return (
                <Link key={id} href={`/c/${c.username}`} className="flex w-16 shrink-0 flex-col items-center">
                  <Avatar src={c.avatar} name={c.name} tone={c.tone} size={56} />
                  <span className="mt-1 w-full truncate text-center text-[11px]">{c.name.split(" ").at(-1)}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {purchases.length > 0 && (
        <section className="px-5 pt-8">
          <h2 className="mb-1 text-[16px] font-semibold">Your series</h2>
          {purchases.map((id) => {
            const s = idx.series.get(id);
            if (!s) return null;
            return (
              <Row key={id} href={`/series/${id}`}>
                {s.title}
              </Row>
            );
          })}
        </section>
      )}

      <section className="px-5 pt-8">
        <h2 className="mb-1 text-[16px] font-semibold">Listening</h2>
        <Toggle
          label="Autoplay next note"
          hint="Keep the group playing, one voice after another"
          on={settings.autoplayNext}
          onChange={(v) => actions.setSetting("autoplayNext", v)}
        />
        <Toggle
          label="Demo voice"
          hint="Demo notes have no recordings, so a synthesised voice reads them aloud. Off = captions only."
          on={settings.demoVoice}
          onChange={(v) => actions.setSetting("demoVoice", v)}
        />
      </section>

      <section className="px-5 pt-8">
        <h2 className="mb-1 text-[16px] font-semibold">More</h2>
        <Row href="/notifications">Notifications</Row>
        <Row href="/admin">
          <span className="flex items-center gap-2">
            <IconGrid size={18} /> Creator &amp; admin dashboard
          </span>
        </Row>
        <button
          onClick={() => {
            actions.signOut();
            router.replace("/welcome");
          }}
          className="flex w-full items-center justify-between border-b border-line/60 py-4 text-left text-[15px]"
        >
          Sign out
        </button>
        {!supabaseConfigured && (
          <button
            onClick={() => {
              actions.resetDemo();
              toast("Demo reset");
              router.replace("/welcome");
            }}
            className="w-full py-4 text-left text-[15px] text-accent"
          >
            Reset demo
          </button>
        )}
      </section>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <p className="text-[20px] font-semibold tabular-nums">{n}</p>
      <p className="text-[12px] text-stone">{label}</p>
    </div>
  );
}

function Row({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center justify-between border-b border-line/60 py-4 text-[15px]">
      {children}
      <IconChevron size={18} className="text-stone" />
    </Link>
  );
}
