"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { actions, useApp, useCatalog } from "@/lib/store/app";
import { grant, startCheckout } from "@/lib/checkout";
import { useNow } from "@/lib/store/clock";
import { PLUS_PRICE_PENCE } from "@/lib/pricing";
import { supabaseConfigured } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { IconBack, IconCheck, IconSpark } from "@/components/icons";
import { toast } from "@/components/ui/Toast";

const FEATURES: [string, string][] = [
  ["The full archive", "Scroll all the way back to the first note ever posted."],
  ["Exclusive notes", "Things creators only say to members."],
  ["Early access", "Hear new drops hours before everyone else."],
  ["A personalised feed", "The group, tuned to what you care about."],
  ["Saved collections", "Your own playlists of thirty-second moments."],
  ["Longer special drops", "Occasional extended notes, up to three minutes."],
  ["No sponsored drops", "Just the voices."],
];

export default function PlusPage() {
  const router = useRouter();
  const plus = useApp((s) => s.user?.subscriptionStatus === "plus");
  const { catalog } = useCatalog();
  const [busy, setBusy] = useState(false);
  const now = useNow();
  const faces = catalog.creators.filter((c) => new Date(c.joinedAt).getTime() <= now).slice(0, 6);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get("checkout") === "success") {
      grant({ kind: "plus" });
      toast("Welcome to VoysNote+", "✨");
      history.replaceState(null, "", location.pathname);
    }
  }, []);

  return (
    <div className="min-h-dvh bg-ink pb-44 text-cream">
      <header className="flex items-center px-3 pt-[max(14px,env(safe-area-inset-top))]">
        <button
          onClick={() => (history.length > 1 ? router.back() : router.push("/"))}
          aria-label="Back"
          className="rounded-full p-2 text-cream hover:bg-cream/10"
        >
          <IconBack size={20} />
        </button>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="px-6 pt-6"
      >
        <div className="flex items-center gap-2 text-cream/70">
          <IconSpark size={20} />
          <span className="wordmark text-[20px] text-cream">voysnote+</span>
        </div>
        <h1 className="display mt-6 text-[60px]">
          Hear everything.
          <br />
          <em>First.</em>
        </h1>
        <div className="mt-7 flex -space-x-3">
          {faces.map((c, i) => (
            <motion.span key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }}>
              <Avatar src={c.avatar} name={c.name} tone={c.tone} size={46} className="rounded-full ring-[3px] ring-ink" />
            </motion.span>
          ))}
        </div>
      </motion.section>

      <section className="px-6 pt-10">
        <ul className="space-y-5">
          {FEATURES.map(([title, body], i) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              className="flex gap-3.5"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream text-ink">
                <IconCheck size={14} strokeWidth={2.4} />
              </span>
              <span>
                <span className="block text-[16px] font-semibold">{title}</span>
                <span className="block text-[14px] text-cream/60">{body}</span>
              </span>
            </motion.li>
          ))}
        </ul>
      </section>

      <div className="pb-safe fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 mx-auto max-w-[460px] bg-gradient-to-t from-ink via-ink to-transparent px-5 pb-4 pt-8">
        {plus ? (
          <div className="text-center">
            <p className="text-[15px] font-semibold">You&apos;re a VoysNote+ member.</p>
            {supabaseConfigured ? (
              <p className="mt-2 text-[13px] text-cream/50">Manage billing from the receipt Stripe emailed you.</p>
            ) : (
              <button
                onClick={() => {
                  actions.setPlus(false);
                  toast("Membership cancelled");
                }}
                className="mt-2 text-[13px] text-cream/50 underline underline-offset-2"
              >
                Cancel membership (demo)
              </button>
            )}
          </div>
        ) : (
          <>
            <Button
              size="lg"
              variant="cream"
              className="w-full"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const r = await startCheckout({ kind: "plus" });
                setBusy(false);
                if (r === "granted") toast("Welcome to VoysNote+", "✨");
                if (r === "error") toast("Couldn't start checkout. Try again.");
              }}
            >
              Join VoysNote+ · {formatPrice(PLUS_PRICE_PENCE)}/month
            </Button>
            <p className="mt-2.5 text-center text-[12px] text-cream/50">Cancel anytime. Prices in GBP.</p>
          </>
        )}
      </div>
    </div>
  );
}
