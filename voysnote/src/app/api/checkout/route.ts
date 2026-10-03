import { SEED_SERIES } from "@/lib/demo/seed";
import { getServiceSupabase } from "@/lib/supabase/client";
import { siteUrl } from "@/lib/site";
import type { Series } from "@/lib/types";
import { PLUS_PRICE_PENCE } from "@/lib/pricing";

async function findSeries(id: string): Promise<Series | null> {
  const sb = getServiceSupabase();
  if (sb) {
    const { data } = await sb.from("series").select("*").eq("id", id).maybeSingle();
    if (data)
      return {
        id: data.id,
        creatorId: data.creator_id,
        title: data.title,
        description: data.description,
        price: data.price_pence,
        currency: "GBP",
        billing: data.billing,
        coverImage: data.cover_image_url,
        sponsorId: data.sponsor_id,
        episodeCount: data.episode_count,
        unlockCadence: data.unlock_cadence,
        stripePriceId: data.stripe_price_id,
      };
  }
  return SEED_SERIES.find((s) => s.id === id) ?? null;
}

async function userFromToken(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  const sb = getServiceSupabase();
  if (!token || !sb) return null;
  const { data } = await sb.auth.getUser(token);
  return data.user;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { kind?: string; seriesId?: string; returnTo?: string };
  const key = process.env.STRIPE_SECRET_KEY;

  // Demo mode: the client grants the entitlement locally.
  if (!key) return Response.json({ demo: true });

  const user = await userFromToken(req);
  if (!user) return Response.json({ error: "Sign in to subscribe." }, { status: 401 });

  const base = siteUrl();
  const returnTo = body.returnTo?.startsWith("/") ? body.returnTo : "/";
  const form = new URLSearchParams({
    success_url: `${base}${returnTo}?checkout=success`,
    cancel_url: `${base}${returnTo}?checkout=cancelled`,
    client_reference_id: user.id,
    "metadata[user_id]": user.id,
    "metadata[kind]": body.kind ?? "",
    allow_promotion_codes: "true",
  });
  if (user.email) form.set("customer_email", user.email);

  if (body.kind === "plus") {
    form.set("mode", "subscription");
    form.set("subscription_data[metadata][user_id]", user.id);
    if (process.env.STRIPE_PRICE_PLUS) {
      form.set("line_items[0][price]", process.env.STRIPE_PRICE_PLUS);
    } else {
      form.set("line_items[0][price_data][currency]", "gbp");
      form.set("line_items[0][price_data][unit_amount]", String(PLUS_PRICE_PENCE));
      form.set("line_items[0][price_data][recurring][interval]", "month");
      form.set("line_items[0][price_data][product_data][name]", "VoysNote+");
    }
    form.set("line_items[0][quantity]", "1");
  } else if (body.kind === "series" && body.seriesId) {
    const series = await findSeries(body.seriesId);
    if (!series || series.price === 0) return Response.json({ error: "Unknown series" }, { status: 400 });
    const subscription = series.billing === "subscription";
    form.set("mode", subscription ? "subscription" : "payment");
    form.set("metadata[series_id]", series.id);
    if (subscription) form.set("subscription_data[metadata][series_id]", series.id);
    if (series.stripePriceId) {
      form.set("line_items[0][price]", series.stripePriceId);
    } else {
      form.set("line_items[0][price_data][currency]", "gbp");
      form.set("line_items[0][price_data][unit_amount]", String(series.price));
      form.set("line_items[0][price_data][product_data][name]", series.title);
      if (subscription) form.set("line_items[0][price_data][recurring][interval]", "month");
    }
    form.set("line_items[0][quantity]", "1");
  } else {
    return Response.json({ error: "Unknown product" }, { status: 400 });
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const session = (await res.json()) as { url?: string; error?: { message: string } };
  if (!res.ok || !session.url) return Response.json({ error: session.error?.message ?? "Stripe error" }, { status: 502 });
  return Response.json({ url: session.url });
}
