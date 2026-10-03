"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { player } from "@/lib/audio/engine";
import { actions, useApp, useCatalog, useHydrated } from "@/lib/store/app";
import { useNow } from "@/lib/store/clock";
import { loadRemoteCatalog, loadRemoteUserState } from "@/lib/supabase/sync";
import { supabaseConfigured } from "@/lib/supabase/client";
import { BottomNav } from "./BottomNav";
import { MiniPlayer } from "./MiniPlayer";
import { ShareSheetHost } from "../note/ShareSheet";
import { Toaster, toast } from "../ui/Toast";

/** Global runtime for the tabbed app: guard, player wiring, live arrivals. */
export function AppShell({ children, nav = true }: { children: React.ReactNode; nav?: boolean }) {
  const hydrated = useHydrated();
  const hasUser = useApp((s) => !!s.user);
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !hasUser) router.replace("/welcome");
  }, [hydrated, hasUser, router]);

  return (
    <>
      <PlayerWiring />
      <ArrivalToasts />
      <div className="relative mx-auto min-h-dvh max-w-[460px] bg-cream sm:border-x sm:border-line/60">
        {hydrated && hasUser ? children : <ShellSkeleton />}
      </div>
      {nav && hydrated && hasUser && (
        <>
          <MiniPlayer />
          <BottomNav />
        </>
      )}
      <ShareSheetHost />
      <Toaster />
    </>
  );
}

function PlayerWiring() {
  const autoplayNext = useApp((s) => s.settings.autoplayNext);
  const demoVoice = useApp((s) => s.settings.demoVoice);
  useEffect(() => player.configure({ autoplayNext, voice: demoVoice }), [autoplayNext, demoVoice]);
  useEffect(() => {
    const off = player.on("started", (p) => actions.recordPlay(p.id));
    return () => {
      off();
    };
  }, []);
  useEffect(() => {
    if (!supabaseConfigured) return;
    loadRemoteCatalog().then((c) => c && actions.setRemoteCatalog(c));
    loadRemoteUserState().then((u) => u && actions.applyRemoteUserState(u));
  }, []);
  return null;
}

/** When someone joins while you're elsewhere in the app, tell you. */
function ArrivalToasts() {
  const { catalog, idx } = useCatalog();
  const now = useNow();
  const path = usePathname();
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!now) return;
    const live = catalog.events.filter((e) => new Date(e.at).getTime() <= now);
    if (!seen.current) {
      seen.current = new Set(live.map((e) => e.id));
      return;
    }
    for (const e of live) {
      if (seen.current.has(e.id)) continue;
      seen.current.add(e.id);
      const c = idx.creators.get(e.creatorId);
      if (c && path !== "/") toast(`${c.name} joined the group`, "✨");
    }
  }, [now, catalog.events, idx, path]);
  return null;
}

function ShellSkeleton() {
  return (
    <div className="space-y-6 px-5 pt-20">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="skeleton h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-28 rounded-full" />
            <div className="skeleton h-[74px] w-full max-w-[300px] rounded-[22px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
