"use client";

import { cx } from "@/lib/utils";

export const inputCls =
  "h-11 w-full rounded-xl border border-line bg-paper px-3.5 text-[14px] outline-none transition-colors placeholder:text-stone-2 focus:border-ink/40";

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] text-stone">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-stone">{hint}</span>}
    </label>
  );
}

export function Check({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-paper px-3.5 py-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#151310]" />
      <span>
        <span className="block text-[14px] font-medium">{label}</span>
        {hint && <span className="block text-[12px] text-stone">{hint}</span>}
      </span>
    </label>
  );
}

export function Panel({ title, children, className, action }: { title: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={cx("rounded-[24px] bg-paper/60 p-5 ring-1 ring-line", className)}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Pill({ children, tone = "stone" }: { children: React.ReactNode; tone?: "stone" | "ink" | "accent" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider",
        tone === "ink" && "bg-ink text-cream",
        tone === "accent" && "bg-accent text-cream",
        tone === "stone" && "bg-mist text-ink-2",
      )}
    >
      {children}
    </span>
  );
}

/** "YYYY-MM-DDTHH:mm" in local time, for <input type="datetime-local">. */
export function toLocalInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);
}

export function FilePick({ accept, onFile, label, preview }: { accept: string; onFile: (f: File) => void; label: string; preview?: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-stone-2 bg-paper px-3.5 py-3 hover:border-ink/40">
      {preview}
      <span className="text-[14px] font-medium text-ink-2">{label}</span>
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}
