"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createProfile, isUsernameAvailable } from "@/lib/db/profiles";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StepHeader } from "@/components/onboarding/StepHeader";

function normalize(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, "")
    .slice(0, 20);
}

export default function UsernameStep() {
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [result, setResult] = useState<{ username: string; available: boolean } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const checking = username.length >= 3 && result?.username !== username;
  const available = result?.username === username ? result.available : null;

  useEffect(() => {
    if (username.length < 3) {
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(async () => {
      const ok = await isUsernameAvailable(supabase, username);
      if (!cancelled) {
        setResult({ username, available: ok });
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (username.length < 3) {
      setError("usernames need at least 3 characters");
      return;
    }
    if (available === false) {
      setError("that username is taken");
      return;
    }
    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      await createProfile(supabase, {
        id: user.id,
        username,
        display_name: displayName || undefined,
      });
      router.push("/onboarding/photo");
    } catch (err) {
      setError(err instanceof Error ? err.message : "something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <StepHeader
        step={1}
        total={5}
        title="what should we call you?"
        subtitle="this becomes your meeeyu link — meeeyu.app/username"
      />
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
        <div>
          <Input
            placeholder="your name (optional)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={40}
          />
        </div>
        <div>
          <div className="flex items-center rounded-2xl border-2 border-ink/10 bg-paper-card pl-4 focus-within:border-pink">
            <span className="text-ink-soft">meeeyu.app/</span>
            <input
              className="w-full bg-transparent py-3 pr-4 text-base text-ink outline-none"
              placeholder="sean"
              value={username}
              onChange={(e) => setUsername(normalize(e.target.value))}
              autoFocus
              required
            />
          </div>
          {username.length >= 3 && (
            <p
              className={
                "mt-2 text-sm " +
                (checking
                  ? "text-ink-soft"
                  : available
                    ? "text-emerald-600"
                    : "text-pink")
              }
            >
              {checking
                ? "checking…"
                : available
                  ? "it's yours!"
                  : "already taken"}
            </p>
          )}
        </div>
        {error && <p className="text-sm text-pink">{error}</p>}
        <div className="flex-1" />
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "creating…" : "next"}
        </Button>
      </form>
    </>
  );
}
