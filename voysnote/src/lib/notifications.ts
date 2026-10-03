import { indexCatalog, isLive } from "./catalog";
import type { AppNotification, Catalog } from "./types";
import { firstName, TIME } from "./utils";

/**
 * Notifications are derived from what has happened in the group, filtered
 * by who you follow. In production the same rules run server-side to fan
 * out push notifications (see supabase/migrations).
 */
export function buildNotifications(catalog: Catalog, follows: string[], now: number): AppNotification[] {
  const idx = indexCatalog(catalog);
  const out: AppNotification[] = [];
  const horizon = now - 4 * TIME.DAY;

  for (const ev of catalog.events) {
    const t = new Date(ev.at).getTime();
    const c = idx.creators.get(ev.creatorId);
    if (!c || t > now || t < horizon) continue;
    out.push({ id: `nt_${ev.id}`, kind: "joined", creatorId: c.id, at: ev.at, text: `${c.name} joined the group.` });
  }

  for (const n of catalog.notes) {
    const t = new Date(n.publishedAt).getTime();
    const c = idx.creators.get(n.creatorId);
    if (!c || t > now || t < horizon) continue;
    if (n.premium || n.earlyAccessUntil) {
      out.push({
        id: `nt_ex_${n.id}`,
        kind: "exclusive",
        creatorId: c.id,
        noteId: n.id,
        at: n.publishedAt,
        text: `Exclusive drop: ${firstName(c.name)} posted something for VoysNote+ members.`,
      });
    } else if (follows.includes(c.id)) {
      out.push({
        id: `nt_f_${n.id}`,
        kind: "followed_dropped",
        creatorId: c.id,
        noteId: n.id,
        at: n.publishedAt,
        text: `${firstName(c.name)} has something to say.`,
      });
    } else if (isLive(c.joinedAt, now) && Math.abs(new Date(c.joinedAt).getTime() - t) < 10 * TIME.MIN) {
      out.push({
        id: `nt_d_${n.id}`,
        kind: "dropped",
        creatorId: c.id,
        noteId: n.id,
        at: n.publishedAt,
        text: `${firstName(c.name)} just dropped their first VoysNote.`,
      });
    }
  }

  for (const s of catalog.series) {
    const c = idx.creators.get(s.creatorId);
    if (!c) continue;
    const at = new Date(Math.max(new Date(c.joinedAt).getTime() + 5 * TIME.MIN, horizon + TIME.HOUR)).toISOString();
    if (new Date(at).getTime() > now) continue;
    out.push({ id: `nt_s_${s.id}`, kind: "series", creatorId: c.id, seriesId: s.id, at, text: `New series: ${s.title} with ${firstName(c.name)}.` });
  }

  return out.sort((a, b) => +new Date(b.at) - +new Date(a.at));
}
