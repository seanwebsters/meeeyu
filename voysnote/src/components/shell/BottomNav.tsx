"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useState } from "react";
import { cx } from "@/lib/utils";
import { useApp } from "@/lib/store/app";
import { IconBookmark, IconBookmarkFill, IconDiscover, IconHome, IconHomeFill, IconLink, IconPlus, IconSpark, IconUser } from "../icons";
import { Sheet } from "../ui/Sheet";
import { Button } from "../ui/Button";
import { toast } from "../ui/Toast";

const TABS = [
  { href: "/", label: "Home", icon: IconHome, active: IconHomeFill },
  { href: "/discover", label: "Discover", icon: IconDiscover, active: IconDiscover },
  null, // the + button
  { href: "/saved", label: "Saved", icon: IconBookmark, active: IconBookmarkFill },
  { href: "/profile", label: "Profile", icon: IconUser, active: IconUser },
];

export function BottomNav() {
  const path = usePathname();
  const [plus, setPlus] = useState(false);
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <>
      <nav className="pointer-events-none fixed inset-x-0 bottom-[max(14px,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-[460px] justify-center">
        <ul className="pointer-events-auto flex items-center gap-1 rounded-full bg-ink/95 p-1.5 shadow-[0_14px_34px_-12px_rgba(18,18,17,0.55)] backdrop-blur-xl">
          {TABS.map((t) => {
            if (!t)
              return (
                <li key="plus" className="px-1">
                  <motion.button
                    whileTap={{ scale: 0.88, rotate: 90 }}
                    onClick={() => setPlus(true)}
                    aria-label="Add to the group"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-pop text-ink"
                  >
                    <IconPlus size={21} strokeWidth={2.2} />
                  </motion.button>
                </li>
              );
            const on = isActive(t.href);
            const Icon = on ? t.active : t.icon;
            return (
              <li key={t.href} className="relative">
                {on && (
                  <motion.span
                    layoutId="dock-pill"
                    className="absolute inset-0 rounded-full bg-cream/12"
                    transition={{ type: "spring", damping: 26, stiffness: 380 }}
                  />
                )}
                <Link
                  href={t.href}
                  aria-label={t.label}
                  className={cx("relative flex h-11 w-12 items-center justify-center rounded-full transition-colors", on ? "text-cream" : "text-cream/45")}
                >
                  <Icon size={22} strokeWidth={on ? 2 : 1.7} />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <PlusSheet open={plus} onClose={() => setPlus(false)} />
    </>
  );
}

/** Listeners don't post; "+" grows the group instead. */
function PlusSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const isPlus = useApp((s) => s.user?.subscriptionStatus === "plus");
  const [suggesting, setSuggesting] = useState(false);
  const [name, setName] = useState("");

  const close = () => {
    setSuggesting(false);
    setName("");
    onClose();
  };

  return (
    <Sheet open={open} onClose={close} title="Grow the group">
      {suggesting ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast(`Noted. We'll ask ${name.trim()}.`, "✨");
            close();
          }}
          className="space-y-3 pt-1"
        >
          <p className="text-[14px] text-ink-2">Who should join next? Founders, artists, athletes, your favourite teacher. We read every suggestion.</p>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Their name or @handle"
            className="h-12 w-full rounded-full border border-line bg-paper px-5 text-[15px] outline-none focus:border-accent/40"
          />
          <Button className="w-full" disabled={!name.trim()}>
            Suggest them
          </Button>
        </form>
      ) : (
        <div className="-mx-2 space-y-1">
          <Row
            icon={<IconLink size={20} />}
            title="Invite a friend"
            body="Add someone to the group"
            onClick={async () => {
              const url = `${location.origin}/welcome`;
              try {
                if (navigator.share) await navigator.share({ title: "VoysNote", text: "Join me in the world's most interesting group chat.", url });
                else {
                  await navigator.clipboard.writeText(url);
                  toast("Invite link copied", "🔗");
                }
              } catch {}
              close();
            }}
          />
          <Row icon={<IconSpark size={20} />} title="Suggest a voice" body="Tell us who should join next" onClick={() => setSuggesting(true)} />
          <Row
            icon={<IconBookmark size={20} />}
            title="New collection"
            body={isPlus ? "Organise your favourite VoysNotes" : "Part of VoysNote+"}
            onClick={() => {
              close();
              router.push(isPlus ? "/saved?tab=collections" : "/plus");
            }}
          />
        </div>
      )}
    </Sheet>
  );
}

function Row({ icon, title, body, onClick }: { icon: React.ReactNode; title: string; body: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3.5 rounded-2xl p-3 text-left hover:bg-mist">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mist text-ink">{icon}</span>
      <span>
        <span className="block text-[15px] font-semibold">{title}</span>
        <span className="block text-[13px] text-stone">{body}</span>
      </span>
    </button>
  );
}
