"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { actions, useApp, useCatalog } from "@/lib/store/app";
import { grant, startCheckout } from "@/lib/checkout";
import { useNow } from "@/lib/store/clock";
import { PLUS_PRICE_PENCE } from "@/lib/pricing";
import { supabaseConfigured } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { Avatar, Portrait } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { IconArrowRight, IconBack, IconCheck, IconClock, IconCrown, IconGrid } from "@/components/icons";
import { toast } from "@/components/ui/Toast";

const FEATURES = [
  "Exclusive creator series and notes",
  "Early access drops",
  "The full archive, back to the first note",
  "Saved collections",
  "Longer special drops",
  "Ad-free listening: no sponsored drops",
  "Support independent voices",
];

export default function PlusPage() {
  const router = useRouter();
  const plus = useApp((s) => s.user?.subscriptionStatus === "plus");
  const { catalog, idx } = useCatalog();
  const now = useNow();
  const [busy, setBusy] = useState(false);
  const faces = catalog.creators.filter((c) => new Date(c.joinedAt).getTime() <= now).slice(0, 5);
  const featured = catalog.series.find((s) => s.price > 0);
  const fc = featured ? idx.creators.get(featured.creatorId) : undefined;

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get("checkout") === "success") {
      grant({ kind: "plus" });
      toast("Welcome to VoysNote+", "✨");
      history.replaceState(null, "", location.pathname);
    }
  }, []);

  const join = async () => {
    setBusy(true);
    const r = await startCheckout({ kind: "plus" });
    setBusy(false);
    if (r === "granted") toast("Welcome to VoysNote+", "✨");
    if (r === "error") toast("Couldn't start checkout. Try again.");
  };

  return (
    <div className="relative min-h-dvh overflow-hidden pb-40">
      {/* Organic shapes, quiet and warm. */}
      <svg className="pointer-events-none absolute -right-24 -top-16 h-[360px] w-[360px] text-accent-soft" viewBox="0 0 200 200" aria-hidden>
        <path
          fill="currentColor"
          d="M44 -63C57 -52 67 -38 72 -21 77 -4 77 15 69 30 61 45 45 56 28 63 11 70 -8 73 -27 68 -45 63 -63 50 -71 33 -79 16 -77 -5 -69 -23 -62 -41 -49 -56 -33 -66 -17 -76 1 -80 17 -77 33 -74 31 -74 44 -63Z"
          transform="translate(100 100)"
        />
      </svg>
      <svg className="pointer-events-none absolute -left-28 top-[300px] h-[260px] w-[260px] text-gold-soft" viewBox="0 0 200 200" aria-hidden>
        <path
          fill="currentColor"
          d="M39 -51C50 -41 58 -27 63 -11 67 6 67 24 58 37 49 50 31 57 13 62 -5 67 -24 69 -39 61 -54 53 -64 35 -68 16 -72 -3 -70 -23 -60 -38 -50 -53 -32 -63 -14 -66 4 -69 27 -61 39 -51Z"
          transform="translate(100 100)"
        />
      </svg>

      <header className="relative flex items-center px-3 pt-[max(14px,env(safe-area-inset-top))]">
        <button onClick={() => (history.length > 1 ? router.back() : router.push("/"))} aria-label="Back" className="rounded-full p-2 hover:bg-mist">
          <IconBack size={20} />
        </button>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative px-6 pt-4"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-soft text-gold">
            <IconCrown size={20} />
          </span>
          <h1 className="text-[34px] font-semibold tracking-[-0.03em]">VoysNote+</h1>
        </div>
        <p className="mt-3 max-w-[300px] text-[18px] leading-snug text-ink-2">Go deeper. Exclusive voices. Original series. A closer group.</p>
        <div className="mt-5 flex items-center gap-2">
          <div className="flex -space-x-2">
            {faces.map((c) => (
              <Avatar key={c.id} src={c.avatar} name={c.name} tone={c.tone} size={30} className="rounded-full ring-2 ring-cream" />
            ))}
          </div>
          <span className="text-[12px] text-stone">Members hear them first</span>
        </div>

        <ul className="mt-6 space-y-3">
          {FEATURES.map((f, i) => (
            <motion.li
              key={f}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.04 }}
              className="flex items-center gap-3 text-[15px]"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-cream">
                <IconCheck size={12} strokeWidth={2.6} />
              </span>
              {f}
            </motion.li>
          ))}
        </ul>

        <div className="mt-7">
          {plus ? (
            <div className="rounded-[20px] bg-accent-soft p-4 text-center">
              <p className="text-[15px] font-semibold text-accent">You&apos;re a VoysNote+ member.</p>
              {supabaseConfigured ? (
                <p className="mt-1 text-[13px] text-stone">Manage billing from the receipt Stripe emailed you.</p>
              ) : (
                <button
                  onClick={() => {
                    actions.setPlus(false);
                    toast("Membership cancelled");
                  }}
                  className="mt-1 text-[13px] text-stone underline underline-offset-2"
                >
                  Cancel membership (demo)
                </button>
              )}
            </div>
          ) : (
            <>
              <Button size="lg" className="w-full justify-between px-7" disabled={busy} onClick={join}>
                <span>Join VoysNote+</span>
                <span className="font-medium opacity-90">{formatPrice(PLUS_PRICE_PENCE)}/month</span>
              </Button>
              <p className="mt-2 text-center text-[12px] text-stone">Cancel anytime. Prices in GBP.</p>
            </>
          )}
        </div>
      </motion.section>

      {featured && fc && (
        <section className="relative px-5 pt-9">
          <h2 className="mb-3 text-[16px] font-semibold">Featured Creator Series</h2>
          <Link href={`/series/${featured.id}`} className="card relative flex min-h-[190px] overflow-hidden">
            <div className="relative z-10 flex w-[62%] flex-col p-4">
              <h3 className="text-[22px] font-semibold leading-[1.1] tracking-[-0.02em]">{featured.title}</h3>
              <p className="mt-2 line-clamp-3 text-[12px] leading-snug text-stone">{featured.description}</p>
              <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-[11px] text-stone">
                <span className="flex items-center gap-1">
                  <IconClock size={13} /> {featured.episodeCount} VoysNotes
                </span>
                <span className="flex items-center gap-1">
                  <IconGrid size={13} /> One a day
                </span>
              </div>
            </div>
            <div className="absolute inset-y-0 right-0 w-[45%]">
              <Portrait src={fc.portrait ?? fc.avatar} name={fc.name} tone={fc.tone} className="h-full w-full" />
              <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-paper to-transparent" />
            </div>
            <span className="absolute bottom-3 right-3 z-10 rounded-full bg-accent px-4 py-1.5 text-[13px] font-semibold text-cream">
              {formatPrice(featured.price)}
            </span>
          </Link>
          <Link href={`/series/${featured.id}`} className="mx-auto mt-3 flex w-fit items-center gap-1 text-[13px] font-medium text-accent">
            Preview series <IconArrowRight size={14} />
          </Link>
        </section>
      )}
    </div>
  );
}
