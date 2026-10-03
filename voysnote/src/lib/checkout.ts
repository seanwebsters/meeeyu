"use client";

import { actions } from "./store/app";
import { getSupabase } from "./supabase/client";

export type CheckoutItem = { kind: "plus" } | { kind: "series"; seriesId: string };

/**
 * Starts a purchase. With Stripe configured the server returns a Checkout
 * URL and we redirect; the webhook grants the entitlement. Without Stripe
 * (demo) the server says so and we grant locally.
 */
export async function startCheckout(item: CheckoutItem): Promise<"redirect" | "granted" | "error"> {
  const token = (await getSupabase()?.auth.getSession())?.data.session?.access_token;
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ ...item, returnTo: location.pathname }),
    });
    const data = (await res.json()) as { url?: string; demo?: boolean; error?: string };
    if (data.url) {
      location.href = data.url;
      return "redirect";
    }
    if (data.demo) {
      grant(item);
      return "granted";
    }
    console.warn("Checkout failed:", data.error);
    return "error";
  } catch (e) {
    console.warn("Checkout failed:", e);
    return "error";
  }
}

export function grant(item: CheckoutItem) {
  if (item.kind === "plus") actions.setPlus(true);
  else actions.grantSeries(item.seriesId);
}
