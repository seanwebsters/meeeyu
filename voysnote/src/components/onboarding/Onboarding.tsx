"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, type Category } from "@/lib/types";
import { actions, useApp, useCatalog } from "@/lib/store/app";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import { GROUP_SIZE, LISTENING_BASE } from "@/lib/demo/seed";
import { useNow } from "@/lib/store/clock";
import { cx } from "@/lib/utils";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { CATEGORY_ICONS, IconArrowRight, IconBack, VMark } from "../icons";
import { toast } from "../ui/Toast";

type Step = "intro" | "auth" | "interests" | "name" | "joining";
const PROGRESS: Partial<Record<Step, number>> = { auth: 1, interests: 2, name: 3 };

const ease = [0.22, 1, 0.36, 1] as const;
const screen = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25, ease } },
};

// Editorial hero. Falls back to a warm gradient if the photo can't load.
const HERO = "https://images.unsplash.com/photo-1484755560615-a4c64e778a6c?w=900&h=1500&fit=crop&crop=faces&auto=format&q=75";

export function Onboarding() {
  const params = useSearchParams();
  const [step, setStep] = useState<Step>(() => (params.get("step") === "profile" ? "interests" : "intro"));
  const [email, setEmail] = useState<string | null>(null);
  const [interests, setInterests] = useState<Category[]>([]);
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
        setStep((s) => (s === "intro" ? "interests" : s));
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
            setStep("interests");
          }}
        />
      )}
      {step === "interests" && (
        <Interests
          key="interests"
          initial={interests}
          onBack={() => setStep("auth")}
          onDone={(picked) => {
            setInterests(picked);
            setStep("name");
          }}
        />
      )}
      {step === "name" && (
        <Name
          key="name"
          onBack={() => setStep("interests")}
          onDone={(name) => {
            actions.completeOnboarding({ name, email, interests });
            setStep("joining");
          }}
        />
      )}
      {step === "joining" && <Joining key="joining" />}
    </AnimatePresence>
  );
}

function TopBar({ step, onBack, onSkip }: { step: Step; onBack?: () => void; onSkip?: () => void }) {
  const p = PROGRESS[step] ?? 0;
  return (
    <div className="pt-[max(14px,env(safe-area-inset-top))]">
      <div className="flex h-10 items-center gap-2">
        {onBack && (
          <button onClick={onBack} className="-ml-2 rounded-full p-2 text-ink" aria-label="Back">
            <IconBack size={20} />
          </button>
        )}
        <span className="wordmark flex-1 text-[19px]">VoysNote</span>
        {onSkip && (
          <button onClick={onSkip} className="text-[14px] font-medium text-stone hover:text-ink">
            Skip
          </button>
        )}
      </div>
      <div className="mt-3 flex gap-1.5">
        {[1, 2, 3].map((i) => (
          <span key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-line">
            <motion.span className="block h-full bg-accent" initial={false} animate={{ width: i <= p ? "100%" : "0%" }} transition={{ duration: 0.5, ease }} />
          </span>
        ))}
      </div>
    </div>
  );
}

// --- 1. Welcome -----------------------------------------------------------------

function Intro({ onNext }: { onNext: () => void }) {
  const { idx } = useCatalog();
  const maya = idx.creators.get("c_maya")!;
  const [heroOk, setHeroOk] = useState(true);
  const [chip, setChip] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setChip(true), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div {...screen} className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#e9e3d6] via-[#cdbfa8] to-[#8e7f69]">
        {heroOk && (
          // eslint-disable-next-line @next/next/no-img-element -- full-bleed editorial photo
          <img src={HERO} alt="" onError={() => setHeroOk(false)} className="h-full w-full object-cover object-[50%_30%]" />
        )}
        <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-cream/85 via-cream/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-ink/55 via-ink/15 to-transparent" />
      </div>

      <div className="relative px-8 pt-[max(56px,calc(env(safe-area-inset-top)+40px))] text-center">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease }}
          className="wordmark text-[44px] text-ink"
        >
          VoysNote
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6, ease }}
          className="mx-auto mt-2 max-w-[280px] text-[20px] leading-[1.3] text-ink-2"
        >
          30 seconds a day from the world&apos;s most interesting people.
        </motion.p>
      </div>

      <div className="relative mt-auto px-6 pb-[max(26px,env(safe-area-inset-bottom))]">
        <AnimatePresence>
          {chip && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", damping: 20 }}
              className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full bg-paper/90 py-1.5 pl-1.5 pr-3.5 text-[13px] shadow-lg backdrop-blur"
            >
              <Avatar src={maya.avatar} name={maya.name} tone={maya.tone} size={26} />
              <span>
                <b className="font-semibold">Maya</b> joined the group
              </span>
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-live" />
            </motion.div>
          )}
        </AnimatePresence>
        <Button size="lg" className="w-full" onClick={onNext}>
          Join the group <IconArrowRight size={18} />
        </Button>
        <p className="mt-3 text-center text-[12px] text-cream/90">A more human internet. One voice at a time.</p>
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
    <motion.div {...screen} className="flex min-h-dvh flex-col px-6 pb-[max(28px,env(safe-area-inset-bottom))]">
      <TopBar step="auth" onBack={onBack} />
      <div className="mt-9">
        <h1 className="display text-[40px]">you&apos;ve been added to the group.</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-stone">
          Founders, musicians, athletes, actors and experts. They post when they have something worth thirty seconds.
        </p>
      </div>

      <div className="mt-auto space-y-3 pt-10">
        {mode === "choose" ? (
          <>
            <Button size="lg" variant="ink" className="w-full" disabled={busy} onClick={() => oauth("apple")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.6ZM14.2 5.6c.6-.8 1.1-1.8 1-2.9-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.8 1 .1 2.1-.5 2.7-1.3Z" />
              </svg>
              Continue with Apple
            </Button>
            <Button size="lg" variant="outline" className="w-full" disabled={busy} onClick={() => oauth("google")}>
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
              className="h-14 w-full rounded-full border border-line bg-paper px-6 text-[16px] outline-none placeholder:text-stone-2 focus:border-accent/40"
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

// --- 3. Interests --------------------------------------------------------------

function Interests({ initial, onBack, onDone }: { initial: Category[]; onBack: () => void; onDone: (c: Category[]) => void }) {
  const [picked, setPicked] = useState<Category[]>(initial);
  const toggle = (c: Category) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  return (
    <motion.div {...screen} className="flex min-h-dvh flex-col px-6 pb-[max(28px,env(safe-area-inset-bottom))]">
      <TopBar step="interests" onBack={onBack} onSkip={() => onDone([])} />
      <h1 className="display mt-10 text-[40px]">what are you into?</h1>
      <p className="mt-2 text-[15px] text-stone">pick a few. we&apos;ll tune your feed.</p>

      <div className="mt-8 flex flex-wrap gap-2.5">
        {CATEGORIES.map((c, i) => {
          const on = picked.includes(c);
          const Icon = CATEGORY_ICONS[c];
          return (
            <motion.button
              key={c}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggle(c)}
              aria-pressed={on}
              className={cx(
                "flex h-12 items-center gap-2 rounded-full px-5 text-[16px] font-medium tracking-[-0.01em] transition-colors",
                on ? "bg-ink text-cream" : "bg-mist text-ink hover:bg-line",
              )}
            >
              <Icon size={18} />
              {c.toLowerCase()}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-auto pt-8">
        <Button size="lg" className="w-full" disabled={picked.length === 0} onClick={() => onDone(picked)}>
          Continue <IconArrowRight size={18} />
        </Button>
      </div>
    </motion.div>
  );
}

// --- 4. Name -------------------------------------------------------------------

function Name({ onBack, onDone }: { onBack: () => void; onDone: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <motion.form
      {...screen}
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onDone(name);
      }}
      className="flex min-h-dvh flex-col px-6 pb-[max(28px,env(safe-area-inset-bottom))]"
    >
      <TopBar step="name" onBack={onBack} />
      <h1 className="display mt-10 text-[40px]">what should we call you?</h1>
      <p className="mt-2 text-[15px] text-stone">first name is perfect.</p>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your first name"
        autoComplete="given-name"
        maxLength={40}
        className="mt-8 h-14 border-b border-line bg-transparent text-[24px] font-semibold tracking-[-0.02em] outline-none placeholder:text-stone-2 focus:border-ink"
      />
      <div className="mt-auto pt-8">
        <Button size="lg" className="w-full" disabled={!name.trim()}>
          Add me to the group <IconArrowRight size={18} />
        </Button>
      </div>
    </motion.form>
  );
}

// --- 5. Being added ------------------------------------------------------------

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
              <Avatar src={c.avatar} name={c.name} tone={c.tone} size={40} className="rounded-full ring-2 ring-cream" />
            </motion.div>
          );
        })}
        <motion.div
          className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-cream"
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
            <p className="display text-[36px]">you joined the group.</p>
            <p className="mt-2 text-[14px] text-stone">
              You and {(GROUP_SIZE + 1).toLocaleString("en-GB")} others · {LISTENING_BASE.toLocaleString("en-GB")} listening now.
              <br />
              Who&apos;s going to join next?
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
