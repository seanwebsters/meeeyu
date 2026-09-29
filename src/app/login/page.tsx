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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function proceed() {
    router.push("/onboarding");
    router.refresh();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Try signing in first (returning user)…
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInData?.session) {
      setLoading(false);
      proceed();
      return;
    }

    // …and if that fails, create the account instead (new user) — no email
    // confirmation step, the session is granted immediately.
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (signUpData?.session) {
      proceed();
      return;
    }

    // No error and no session means the email is already registered and the
    // password above didn't match it.
    setError("that email is already in use with a different password");
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-10 font-hand text-4xl text-ink">
        meeeyu <span className="text-pink">♡</span>
      </Link>

      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h1 className="text-xl font-semibold">welcome (or welcome back)</h1>
            <p className="mt-1 text-sm text-ink-soft">
              enter your email and a password — you&apos;re straight in, no
              confirmation step.
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
          <Input
            type="password"
            required
            minLength={6}
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-pink">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "one sec…" : "continue"}
          </Button>
        </form>
      </div>
    </main>
  );
}
