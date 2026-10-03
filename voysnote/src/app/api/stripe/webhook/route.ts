import { createHmac, timingSafeEqual } from "node:crypto";
import { getServiceSupabase } from "@/lib/supabase/client";

// Grants entitlements from Stripe events. Configure the endpoint in Stripe
// for: checkout.session.completed, customer.subscription.deleted.

function verify(payload: string, header: string | null, secret: string) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  const sigs = header
    .split(",")
    .filter((p) => p.startsWith("v1="))
    .map((p) => p.slice(3));
  return sigs.some((s) => s.length === expected.length && timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sb = getServiceSupabase();
  if (!secret || !sb) return new Response("Not configured", { status: 501 });

  const payload = await req.text();
  if (!verify(payload, req.headers.get("stripe-signature"), secret)) return new Response("Bad signature", { status: 400 });

  const event = JSON.parse(payload) as { type: string; data: { object: Record<string, unknown> } };
  const obj = event.data.object as {
    id: string;
    customer?: string;
    subscription?: string;
    metadata?: Record<string, string>;
    current_period_end?: number;
  };

  if (event.type === "checkout.session.completed") {
    const userId = obj.metadata?.user_id;
    if (!userId) return new Response("ok");
    if (obj.metadata?.kind === "plus") {
      await sb.from("subscriptions").upsert({
        user_id: userId,
        status: "active",
        stripe_customer_id: obj.customer ?? null,
        stripe_subscription_id: obj.subscription ?? null,
      });
      await sb.from("profiles").update({ subscription_status: "plus" }).eq("id", userId);
    } else if (obj.metadata?.series_id) {
      await sb.from("series_purchases").upsert({
        user_id: userId,
        series_id: obj.metadata.series_id,
        stripe_session_id: obj.id,
        stripe_subscription_id: obj.subscription ?? null,
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const seriesId = obj.metadata?.series_id;
    if (seriesId) {
      await sb.from("series_purchases").delete().eq("stripe_subscription_id", obj.id);
    } else {
      const { data } = await sb.from("subscriptions").update({ status: "cancelled" }).eq("stripe_subscription_id", obj.id).select("user_id");
      for (const row of data ?? []) await sb.from("profiles").update({ subscription_status: "free" }).eq("id", row.user_id);
    }
  }

  return new Response("ok");
}
