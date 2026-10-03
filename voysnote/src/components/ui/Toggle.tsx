"use client";

import { cx } from "@/lib/utils";

export function Toggle({ label, hint, on, onChange }: { label: string; hint?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-line/60 py-4">
      <span>
        <span className="block text-[15px]">{label}</span>
        {hint && <span className="mt-0.5 block text-[12px] leading-snug text-stone">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={cx("relative h-7 w-12 shrink-0 rounded-full transition-colors", on ? "bg-accent" : "bg-stone-2/60")}
      >
        <span className={cx("absolute left-0 top-1 h-5 w-5 rounded-full bg-cream shadow transition-transform", on ? "translate-x-6" : "translate-x-1")} />
      </button>
    </label>
  );
}
