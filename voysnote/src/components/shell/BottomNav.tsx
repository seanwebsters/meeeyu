"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cx } from "@/lib/utils";
import { IconBookmark, IconBookmarkFill, IconDiscover, IconGroup, IconGroupFill, IconUser } from "../icons";

const TABS = [
  { href: "/", label: "Group", icon: IconGroup, active: IconGroupFill },
  { href: "/discover", label: "Discover", icon: IconDiscover, active: IconDiscover },
  { href: "/saved", label: "Saved", icon: IconBookmark, active: IconBookmarkFill },
  { href: "/profile", label: "Profile", icon: IconUser, active: IconUser },
];

export function BottomNav() {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[460px] border-t border-line/70 bg-cream/85 backdrop-blur-xl">
      <ul className="grid grid-cols-4">
        {TABS.map((t) => {
          const on = isActive(t.href);
          const Icon = on ? t.active : t.icon;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={cx(
                  "relative flex flex-col items-center gap-0.5 pb-2 pt-2.5 text-[10.5px] font-medium tracking-wide",
                  on ? "text-ink" : "text-stone",
                )}
              >
                {on && <motion.span layoutId="nav-dot" className="absolute top-0 h-[2px] w-6 rounded-full bg-ink" />}
                <Icon size={23} strokeWidth={on ? 1.9 : 1.6} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
