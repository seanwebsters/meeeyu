"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("code");
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-10 font-hand text-4xl text-ink">
        meeeyu <span className="text-pink">♡</span>
      </Link>

      <div className="w-full max-w-sm">
        {step === "email" ? (
          <form onSubmit={sendCode} className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold">welcome back (or hi!)</h1>
              <p className="mt-1 text-sm text-ink-soft">
                enter your email — we&apos;ll send you a one-time code, no
                password needed.
              </p>
            </div>
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            {error && <p className="text-sm text-pink">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "sending…" : "send me a code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold">check your inbox</h1>
              <p className="mt-1 text-sm text-ink-soft">
                enter the 6-digit code we sent to {email}.
              </p>
            </div>
            <Input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="text-center tracking-[0.5em]"
              autoFocus
            />
            {error && <p className="text-sm text-pink">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "checking…" : "continue"}
            </Button>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full text-center text-sm text-ink-soft underline"
            >
              use a different email
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
