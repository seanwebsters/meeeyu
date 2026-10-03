"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, type Category } from "@/lib/types";
import { actions, useApp, useCatalog } from "@/lib/store/app";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import { LISTENING_BASE } from "@/lib/demo/seed";
import { useNow } from "@/lib/store/clock";
import { cx, formatDuration } from "@/lib/utils";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Waveform } from "../ui/Waveform";
import { IconBack, IconCheck, IconPlay, VMark, Verified } from "../icons";
import { toast } from "../ui/Toast";

type Step = "intro" | "auth" | "profile" | "joining";

const ease = [0.22, 1, 0.36, 1] as const;
const screen = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3, ease } },
};

export function Onboarding() {
  const params = useSearchParams();
  const [step, setStep] = useState<Step>(() => (params.get("step") === "profile" ? "profile" : "intro"));
  const [email, setEmail] = useState<string | null>(null);
  const hasUser = useApp((s) => !!s.user);
  const hydrated = useApp((s) => s.hydrated);
  const router = useRouter();

  useEffect(() => {
    if (hydrated && hasUser && step !== "joining") router.replace("/");
  }, [hydrated, hasUser, step, router]);

  // Returning from an OAuth redirect.
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? null);
        setStep((s) => (s === "intro" ? "profile" : s));
      }
    });
  }, []);

  return (
    <AnimatePresence mode="wait">
      {step === "intro" && <Intro key="intro" onNext={() => setStep("auth")} />}
      {step === "auth" && (
        <Auth
          key="auth"
          onBack={() => setStep("intro")}
          onDone={(e) => {
            setEmail(e);
            setStep("profile");
          }}
        />
      )}
      {step === "profile" && <Profile key="profile" email={email} onBack={() => setStep("auth")} onDone={() => setStep("joining")} />}
      {step === "joining" && <Joining key="joining" />}
    </AnimatePresence>
  );
}

// --- 1. Intro: the group, already in motion -----------------------------------

function Intro({ onNext }: { onNext: () => void }) {
  const { idx } = useCatalog();
  const maya = idx.creators.get("c_maya")!;
  const jonah = idx.creators.get("c_jonah")!;
  const [beat, setBeat] = useState(0);
  useEffect(() => {
    const ts = [700, 1500, 2500, 3600].map((t, i) => setTimeout(() => setBeat(i + 1), t));
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...screen} className="flex min-h-dvh flex-col px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(28px,env(safe-area-inset-top))]">
      <div className="flex items-center gap-2">
        <VMark size={26} />
        <span className="wordmark text-[24px]">voysnote</span>
      </div>

      <div className="mt-10">
        <h1 className="display text-[54px] leading-[0.92]">
          30 seconds a day from the world&apos;s most <em>interesting</em> people.
        </h1>
      </div>

      {/* A living preview of the group */}
      <div className="mt-8 flex-1 space-y-3">
        <AnimatePresence>
          {beat >= 1 && (
            <motion.div
              key="b1"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 text-[13px] text-ink-2"
            >
              <Avatar src={maya.avatar} name={maya.name} tone={maya.tone} size={22} />
              <span>
                <b className="font-semibold text-ink">Maya</b> joined the group
              </span>
            </motion.div>
          )}
          {beat >= 2 && (
            <motion.div
              key="b2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 22 }}
              className="flex gap-2.5"
            >
              <Avatar src={maya.avatar} name={maya.name} tone={maya.tone} size={34} />
              <div>
                <p className="mb-1 flex items-center gap-1 text-[13px] font-semibold">
                  Maya Okafor <Verified size={13} />
                </p>
                <div className="flex w-[250px] items-center gap-2.5 rounded-[20px] rounded-tl-[8px] border border-line/70 bg-paper p-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-cream">
                    <IconPlay size={13} className="translate-x-[1px]" />
                  </span>
                  <Waveform data={[0.2, 0.5, 0.8, 0.6, 0.9, 0.4, 0.7, 0.3, 0.6, 0.85, 0.5, 0.3, 0.7, 0.9, 0.55, 0.35, 0.6, 0.2]} progress={0} height={22} />
                  <span className="text-[11px] tabular-nums text-stone">{formatDuration(27)}</span>
                </div>
              </div>
            </motion.div>
          )}
          {beat >= 3 && (
            <motion.div
              key="b3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 text-[13px] text-ink-2"
            >
              <Avatar src={jonah.avatar} name={jonah.name} tone={jonah.tone} size={22} />
              <span>
                <b className="font-semibold text-ink">Jonah</b> joined the group
              </span>
            </motion.div>
          )}
          {beat >= 4 && (
            <motion.div key="b4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 text-[13px] text-stone">
              Someone new is joining
              <span className="flex gap-[3px]">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-stone" style={{ animationDelay: `${i * 0.18}s` }} />
                ))}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 space-y-3">
        <Button size="lg" className="w-full" onClick={onNext}>
          Join the group
        </Button>
        <p className="text-center text-[12px] text-stone">
          <span className="live-dot mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-ember align-middle" />
          {LISTENING_BASE.toLocaleString("en-GB")} people are listening right now
        </p>
      </div>
    </motion.div>
  );
}

// --- 2. Sign in ----------------------------------------------------------------

function Auth({ onBack, onDone }: { onBack: () => void; onDone: (email: string | null) => void }) {
  const [mode, setMode] = useState<"choose" | "email">("choose");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const oauth = async (provider: "apple" | "google") => {
    const sb = getSupabase();
    if (!sb) return onDone(null); // demo mode
    setBusy(true);
    const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: `${location.origin}/welcome?step=profile` } });
    if (error) {
      toast(error.message);
      setBusy(false);
    }
  };

  const emailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return onDone(email);
    setBusy(true);
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/welcome?step=profile` } });
    setBusy(false);
    if (error) return toast(error.message);
    toast("Check your inbox for a sign-in link", "✉️");
  };

  return (
    <motion.div {...screen} className="flex min-h-dvh flex-col px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))]">
      <button onClick={onBack} className="-ml-2 self-start rounded-full p-2 text-ink" aria-label="Back">
        <IconBack />
      </button>
      <div className="mt-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-stone">You&apos;ve been invited</p>
        <h1 className="display mt-3 text-[46px]">Join the world&apos;s most interesting group chat.</h1>
        <p className="mt-4 max-w-[320px] text-[15px] leading-relaxed text-ink-2">
          Founders, musicians, athletes, actors and experts. They post when they have something worth thirty seconds.
        </p>
      </div>

      <div className="mt-auto space-y-3 pt-10">
        {mode === "choose" ? (
          <>
            <Button size="lg" className="w-full" disabled={busy} onClick={() => oauth("apple")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.6ZM14.2 5.6c.6-.8 1.1-1.8 1-2.9-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.8 1 .1 2.1-.5 2.7-1.3Z" />
              </svg>
              Continue with Apple
            </Button>
            <Button size="lg" variant="outline" className="w-full bg-paper" disabled={busy} onClick={() => oauth("google")}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8Z" />
                <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23Z" />
                <path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.6-2.8Z" />
                <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7.1l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4Z" />
              </svg>
              Continue with Google
            </Button>
            <Button size="lg" variant="ghost" className="w-full" onClick={() => setMode("email")}>
              Continue with email
            </Button>
          </>
        ) : (
          <form onSubmit={emailSignIn} className="space-y-3">
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-14 w-full rounded-full border border-line bg-paper px-6 text-[16px] outline-none placeholder:text-stone-2 focus:border-ink/40"
            />
            <Button size="lg" className="w-full" disabled={busy || !email}>
              {supabaseConfigured ? "Send me a link" : "Continue"}
            </Button>
            <button type="button" onClick={() => setMode("choose")} className="w-full py-2 text-[13px] text-stone">
              Other options
            </button>
          </form>
        )}
        <p className="px-4 pt-1 text-center text-[11px] leading-relaxed text-stone">
          By joining you agree to the Terms and Privacy Policy.
          {!supabaseConfigured && " Demo mode: no account is created."}
        </p>
      </div>
    </motion.div>
  );
}

// --- 3. Name + interests -------------------------------------------------------

function Profile({ email, onBack, onDone }: { email: string | null; onBack: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<Category[]>([]);
  const toggle = (c: Category) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  const ready = name.trim().length > 0 && picked.length >= 3;

  return (
    <motion.div {...screen} className="flex min-h-dvh flex-col px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))]">
      <button onClick={onBack} className="-ml-2 self-start rounded-full p-2 text-ink" aria-label="Back">
        <IconBack />
      </button>
      <h1 className="display mt-6 text-[44px]">What should the group call you?</h1>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your first name"
        autoComplete="given-name"
        maxLength={40}
        className="mt-6 border-b border-line bg-transparent pb-2 text-[26px] font-medium tracking-[-0.02em] outline-none placeholder:text-stone-2 focus:border-ink"
      />

      <h2 className="mt-10 text-[15px] font-semibold">Pick a few things you&apos;re into</h2>
      <p className="mt-1 text-[13px] text-stone">At least three. We&apos;ll tune your recommendations, never the group itself.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const on = picked.includes(c);
          return (
            <motion.button
              key={c}
              whileTap={{ scale: 0.94 }}
              onClick={() => toggle(c)}
              aria-pressed={on}
              className={cx(
                "flex h-11 items-center gap-1.5 rounded-full border px-4 text-[15px] font-medium transition-colors",
                on ? "border-ink bg-ink text-cream" : "border-line bg-paper text-ink hover:border-ink/30",
              )}
            >
              {on && <IconCheck size={15} />}
              {c}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-auto pt-10">
        <Button
          size="lg"
          className="w-full"
          disabled={!ready}
          onClick={() => {
            actions.completeOnboarding({ name, email, interests: picked });
            onDone();
          }}
        >
          {ready ? "Add me to the group" : picked.length < 3 ? `Pick ${3 - picked.length} more` : "Add your name"}
        </Button>
      </div>
    </motion.div>
  );
}

// --- 4. Being added ------------------------------------------------------------

function Joining() {
  const router = useRouter();
  const { catalog } = useCatalog();
  const now = useNow();
  const faces = useMemo(() => catalog.creators.filter((c) => new Date(c.joinedAt).getTime() <= now).slice(0, 12), [catalog, now]);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const a = setTimeout(() => setAdded(true), 1400);
    const b = setTimeout(() => router.replace("/"), 3600);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [router]);

  return (
    <motion.div {...screen} className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="relative h-[230px] w-[230px]">
        {faces.map((c, i) => {
          const angle = (i / faces.length) * Math.PI * 2;
          const r = 100;
          return (
            <motion.div
              key={c.id}
              className="absolute left-1/2 top-1/2"
              initial={{ opacity: 0, x: -20, y: -20, scale: 0.4 }}
              animate={{ opacity: 1, x: Math.cos(angle) * r - 20, y: Math.sin(angle) * r - 20, scale: 1 }}
              transition={{ delay: i * 0.06, type: "spring", damping: 16 }}
            >
              <Avatar src={c.avatar} name={c.name} tone={c.tone} size={40} className="ring-2 ring-cream rounded-full" />
            </motion.div>
          );
        })}
        <motion.div
          className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-cream"
          animate={added ? { scale: [1, 1.12, 1] } : {}}
          transition={{ duration: 0.6 }}
        >
          <VMark size={38} />
        </motion.div>
      </div>
      <AnimatePresence mode="wait">
        {!added ? (
          <motion.p key="adding" exit={{ opacity: 0 }} className="mt-10 text-[15px] text-stone">
            Adding you to the group…
          </motion.p>
        ) : (
          <motion.div key="added" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10">
            <p className="display text-[40px]">You joined the group.</p>
            <p className="mt-2 text-[14px] text-stone">You and {(LISTENING_BASE + 1).toLocaleString("en-GB")} others. Who&apos;s going to join next?</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
