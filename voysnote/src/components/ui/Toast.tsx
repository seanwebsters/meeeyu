"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSyncExternalStore } from "react";
import { createStore } from "@/lib/store/createStore";

type ToastItem = { id: number; text: string; icon?: string };
const store = createStore<ToastItem[]>([]);
let n = 0;

export function toast(text: string, icon?: string) {
  const id = ++n;
  store.set((s) => [...s.slice(-1), { id, text, icon }]);
  setTimeout(() => store.set((s) => s.filter((t) => t.id !== id)), 2600);
}

export function Toaster() {
  const items = useSyncExternalStore(store.subscribe, store.get, store.get);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex flex-col items-center gap-2 px-4" aria-live="polite">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 380 }}
            className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[13px] font-medium text-cream shadow-lg"
          >
            {t.icon && <span>{t.icon}</span>}
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
