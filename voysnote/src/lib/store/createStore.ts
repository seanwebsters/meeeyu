// Minimal external store for useSyncExternalStore. No dependency, works the
// same in React Native.

export type Listener = () => void;

export function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => state,
    set(next: T | ((s: T) => T)) {
      const value = typeof next === "function" ? (next as (s: T) => T)(state) : next;
      if (Object.is(value, state)) return;
      state = value;
      listeners.forEach((l) => l());
    },
    subscribe(l: Listener) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}
