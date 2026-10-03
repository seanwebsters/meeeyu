"use client";

import { useSyncExternalStore } from "react";

// One shared 1s tick drives everything time-based: arrivals into the group,
// countdowns, relative timestamps. Stops when nothing is listening.

let current = typeof window === "undefined" ? 0 : Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(l: () => void) {
  current = Date.now();
  listeners.add(l);
  if (!timer) {
    timer = setInterval(() => {
      current = Date.now();
      listeners.forEach((fn) => fn());
    }, 1000);
  }
  return () => {
    listeners.delete(l);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

export function useNow() {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => 0,
  );
}
