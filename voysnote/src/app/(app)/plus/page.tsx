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
import { IconArrowRight, IconBack, IconCheck, IconClock, IconGrid } from "@/components/icons";
import { toast } from "@/components/ui/Toast";

const FEATURES = [
  "exclusive notes and creator series",
  "early access to new drops",
  "the full archive, back to the first note",
  "saved collections",
  "longer special drops",
  "no sponsored drops",
  "support independent voices",
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
        <h1 className="wordmark text-[48px] leading-none">voysnote+</h1>
        <p className="mt-4 max-w-[300px] text-[20px] leading-snug tracking-[-0.01em] text-stone">
          go deeper. exclusive voices. original series. a closer group.
        </p>
        <div className="mt-5 flex items-center gap-2">
          <div className="flex -space-x-2">
            {faces.map((c) => (
              <Avatar key={c.id} src={c.avatar} name={c.name} tone={c.tone} size={30} className="rounded-full ring-2 ring-cream" />
            ))}
          </div>
          <span className="text-[12px] text-stone">members hear them first</span>
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
              <span className="flex h-5 w-5 shrink-0 items-center justify-center text-live">
                <IconCheck size={16} strokeWidth={2.2} />
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
          <h2 className="mb-3 text-[13px] font-medium lowercase text-stone">featured series</h2>
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
