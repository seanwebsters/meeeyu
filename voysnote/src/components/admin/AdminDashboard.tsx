"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIES, MAX_NOTE_SECONDS, type Category, type Creator, type Series, type SeriesEpisode, type VoiceNote } from "@/lib/types";
import { actions, useApp, useCatalog } from "@/lib/store/app";
import { useNow } from "@/lib/store/clock";
import { remote } from "@/lib/supabase/sync";
import { supabaseConfigured } from "@/lib/supabase/client";
import { analyseAudio, validateDuration } from "@/lib/audio/analyse";
import { speechSeconds } from "@/lib/demo/seed";
import { player } from "@/lib/audio/engine";
import { noteToPlayable } from "@/lib/audio/playable";
import { clockTime, cx, formatDuration, formatPrice, makeWaveform, relativeFuture, relativeShort, uid } from "@/lib/utils";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Waveform } from "../ui/Waveform";
import { IconBack, IconPlay, VMark } from "../icons";
import { toast } from "../ui/Toast";
import { Check, Field, FilePick, inputCls, Panel, Pill, slugify, toLocalInput } from "./fields";

const TABS = ["Overview", "Creators", "Notes", "Series", "Sponsors", "Schedule"] as const;
type Tab = (typeof TABS)[number];

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("Overview");
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-6 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="rounded-full p-2 hover:bg-mist" aria-label="Back to app">
            <IconBack size={20} />
          </Link>
          <VMark size={24} />
          <span className="wordmark text-[22px]">voysnote</span>
          <span className="rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-cream">Admin</span>
        </div>
        <span className="flex items-center gap-2 text-[12px] text-stone">
          <span className={cx("h-2 w-2 rounded-full", supabaseConfigured ? "bg-emerald-600" : "bg-accent")} />
          {supabaseConfigured ? "Connected to Supabase" : "Demo mode · changes are saved in this browser"}
        </span>
      </header>

      <nav className="no-scrollbar mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx("relative shrink-0 px-4 pb-3 pt-1 text-[14px] font-medium", tab === t ? "text-ink" : "text-stone hover:text-ink")}
          >
            {t}
            {tab === t && <span className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-ink" />}
          </button>
        ))}
      </nav>

      <div className="pt-6">
        {tab === "Overview" && <Overview go={setTab} />}
        {tab === "Creators" && <CreatorsTab />}
        {tab === "Notes" && <NotesTab />}
        {tab === "Series" && <SeriesTab />}
        {tab === "Sponsors" && <SponsorsTab />}
        {tab === "Schedule" && <ScheduleTab />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Overview({ go }: { go: (t: Tab) => void }) {
  const { catalog } = useCatalog();
  const now = useNow();
  const live = catalog.notes.filter((n) => +new Date(n.publishedAt) <= now);
  const scheduled = catalog.notes.filter((n) => +new Date(n.publishedAt) > now).length + catalog.events.filter((e) => +new Date(e.at) > now).length;
  const stats: [string, number | string, Tab][] = [
    ["Voices", catalog.creators.length, "Creators"],
    ["Live notes", live.length, "Notes"],
    ["Scheduled", scheduled, "Schedule"],
    ["Series", catalog.series.length, "Series"],
    ["Sponsors", catalog.sponsors.length, "Sponsors"],
    ["Premium notes", catalog.notes.filter((n) => n.premium).length, "Notes"],
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {stats.map(([label, n, t]) => (
          <button key={label} onClick={() => go(t)} className="rounded-[20px] bg-paper p-4 text-left ring-1 ring-line hover:ring-ink/20">
            <p className="display text-[40px]">{n}</p>
            <p className="text-[12px] font-medium text-stone">{label}</p>
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Up next">
          <Upcoming limit={6} />
        </Panel>
        <Panel title="Quick actions">
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" onClick={() => go("Creators")}>
              Add a creator
            </Button>
            <Button variant="outline" onClick={() => go("Notes")}>
              Upload a VoysNote
            </Button>
            <Button variant="outline" onClick={() => go("Schedule")}>
              Schedule a join
            </Button>
            <Button variant="outline" onClick={() => go("Series")}>
              Create a series
            </Button>
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-stone">
            Notes are capped at {MAX_NOTE_SECONDS} seconds. Anything scheduled appears in The Group at its exact time, with a &ldquo;Someone new is
            joining&hellip;&rdquo; moment just before a new voice arrives.
          </p>
        </Panel>
      </div>
    </div>
  );
}

function Upcoming({ limit }: { limit?: number }) {
  const { catalog, idx } = useCatalog();
  const now = useNow();
  const rows = useMemo(() => {
    const joins = catalog.events
      .filter((e) => +new Date(e.at) > now)
      .map((e) => ({ id: e.id, at: e.at, creator: idx.creators.get(e.creatorId), label: "joins the group", admin: true, kind: "event" as const }));
    const notes = catalog.notes
      .filter((n) => +new Date(n.publishedAt) > now)
      .map((n) => ({ id: n.id, at: n.publishedAt, creator: idx.creators.get(n.creatorId), label: `drops “${n.title}”`, admin: true, kind: "note" as const }));
    return [...joins, ...notes].sort((a, b) => +new Date(a.at) - +new Date(b.at)).slice(0, limit);
  }, [catalog, idx, now, limit]);
  const adminEvents = useApp((s) => s.admin.events);
  const adminNotes = useApp((s) => s.admin.notes);

  if (!rows.length) return <p className="text-[14px] text-stone">Nothing scheduled. The group is waiting.</p>;
  return (
    <ul className="divide-y divide-line/70">
      {rows.map((r) => {
        const own = r.kind === "event" ? adminEvents.some((e) => e.id === r.id) : adminNotes.some((n) => n.id === r.id);
        return (
          <li key={r.id} className="flex items-center gap-3 py-3">
            {r.creator && <Avatar src={r.creator.avatar} name={r.creator.name} tone={r.creator.tone} size={36} />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px]">
                <b className="font-semibold">{r.creator?.name}</b> {r.label}
              </p>
              <p className="text-[12px] text-stone">
                {new Date(r.at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · {clockTime(r.at)} ·{" "}
                {relativeFuture(r.at, now)}
              </p>
            </div>
            {own && (
              <button
                onClick={() => (r.kind === "event" ? actions.admin.deleteEvent(r.id) : actions.admin.deleteNote(r.id))}
                className="text-[12px] font-medium text-accent hover:underline"
              >
                Cancel
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// --- Creators ---------------------------------------------------------------

function CreatorsTab() {
  const { catalog } = useCatalog();
  const now = useNow();
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <CreatorForm />
      <Panel title={`All voices (${catalog.creators.length})`}>
        <ul className="divide-y divide-line/70">
          {[...catalog.creators]
            .sort((a, b) => +new Date(b.joinedAt) - +new Date(a.joinedAt))
            .map((c) => {
              const joined = +new Date(c.joinedAt) <= now;
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                  <Avatar src={c.avatar} name={c.name} tone={c.tone} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[14px] font-semibold">
                      {c.name}
                      {!joined && <Pill tone="accent">Scheduled</Pill>}
                    </p>
                    <p className="truncate text-[12px] text-stone">
                      @{c.username} · {c.category} · {joined ? `joined ${relativeShort(c.joinedAt, now)} ago` : `joins ${relativeFuture(c.joinedAt, now)}`}
                    </p>
                  </div>
                  <MiniToggle on={c.verified} label="Verified" onChange={(v) => actions.admin.upsertCreator({ ...c, verified: v })} />
                  <MiniToggle on={c.foundingVoice} label="Founding" onChange={(v) => actions.admin.upsertCreator({ ...c, foundingVoice: v })} />
                </li>
              );
            })}
        </ul>
      </Panel>
    </div>
  );
}

function MiniToggle({ on, label, onChange }: { on: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={cx("rounded-full px-3 py-1 text-[12px] font-semibold transition-colors", on ? "bg-ink text-cream" : "border border-line text-stone")}
    >
      {label}
    </button>
  );
}

function CreatorForm() {
  const [f, setF] = useState({
    name: "",
    username: "",
    role: "",
    category: "Creativity" as Category,
    bio: "",
    avatar: "",
    verified: true,
    founding: false,
    joinAt: "",
    announce: true,
  });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const joinedAt = (f.joinAt ? new Date(f.joinAt) : new Date()).toISOString();
    const c: Creator = {
      id: uid("c"),
      name: f.name.trim(),
      username: f.username || slugify(f.name),
      avatar: f.avatar,
      bio: f.bio.trim(),
      role: f.role.trim(),
      category: f.category,
      verified: f.verified,
      foundingVoice: f.founding,
      followers: 0,
      joinedAt,
      tone: "#b8a48e",
      voice: { pitch: 1 },
    };
    setBusy(true);
    const r = await actions.admin.upsertCreator(c);
    if (f.announce) await actions.admin.addEvent({ id: uid("ev"), type: "joined", creatorId: c.id, at: joinedAt });
    setBusy(false);
    if (!r.ok) return toast(`Saved locally. Supabase said: ${r.error}`);
    toast(+new Date(joinedAt) > Date.now() ? `${c.name} joins ${relativeFuture(joinedAt, Date.now())}` : `${c.name} joined the group`, "✨");
    setF((s) => ({ ...s, name: "", username: "", role: "", bio: "", avatar: "" }));
  };

  return (
    <Panel title="Add a creator">
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar src={f.avatar || null} name={f.name || "New Voice"} size={64} />
          <FilePick
            accept="image/*"
            label={f.avatar ? "Replace portrait" : "Upload portrait"}
            onFile={async (file) => {
              try {
                set("avatar", await remote.admin.upload("avatars", file));
              } catch (err) {
                toast(`Upload failed: ${(err as Error).message}`);
              }
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name">
            <input
              required
              className={inputCls}
              value={f.name}
              onChange={(e) =>
                setF((s) => ({ ...s, name: e.target.value, username: s.username && s.username !== slugify(s.name) ? s.username : slugify(e.target.value) }))
              }
              placeholder="Noor Haddad"
            />
          </Field>
          <Field label="Username">
            <input required className={inputCls} value={f.username} onChange={(e) => set("username", slugify(e.target.value))} placeholder="noor" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Role">
            <input className={inputCls} value={f.role} onChange={(e) => set("role", e.target.value)} placeholder="Photographer" />
          </Field>
          <Field label="Category">
            <select className={inputCls} value={f.category} onChange={(e) => set("category", e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Short bio">
          <textarea
            className={cx(inputCls, "h-20 py-2.5")}
            maxLength={160}
            value={f.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="One or two lines, in their voice."
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Check label="Verified" checked={f.verified} onChange={(v) => set("verified", v)} />
          <Check label="Founding Voice" checked={f.founding} onChange={(v) => set("founding", v)} />
        </div>
        <Field label="Joins the group at" hint="Leave empty for now. Set a future time to build anticipation.">
          <input type="datetime-local" className={inputCls} value={f.joinAt} onChange={(e) => set("joinAt", e.target.value)} />
        </Field>
        <Check
          label="Create the “joined the group” moment"
          hint="Shows in The Group and notifies listeners"
          checked={f.announce}
          onChange={(v) => set("announce", v)}
        />
        <Button className="w-full" disabled={busy || !f.name}>
          Add to the group
        </Button>
      </form>
    </Panel>
  );
}

// --- Notes ------------------------------------------------------------------

function NotesTab() {
  const { catalog, idx } = useCatalog();
  const adminNotes = useApp((s) => s.admin.notes);
  const now = useNow();
  const recent = useMemo(() => [...catalog.notes].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt)).slice(0, 25), [catalog]);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,460px)_1fr]">
      <NoteForm />
      <Panel title="Recent and scheduled">
        <ul className="divide-y divide-line/70">
          {recent.map((n) => {
            const c = idx.creators.get(n.creatorId);
            const live = +new Date(n.publishedAt) <= now;
            const own = adminNotes.some((x) => x.id === n.id);
            return (
              <li key={n.id} className="flex items-center gap-3 py-3">
                {c && <Avatar src={c.avatar} name={c.name} tone={c.tone} size={36} />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px]">
                    <b className="font-semibold">{c?.name}</b> · {n.title}
                  </p>
                  <p className="flex flex-wrap items-center gap-1.5 text-[12px] text-stone">
                    {formatDuration(n.duration)} · {live ? `${relativeShort(n.publishedAt, now)} ago` : relativeFuture(n.publishedAt, now)}
                    {!live && <Pill tone="accent">Scheduled</Pill>}
                    {n.premium && <Pill tone="ink">Plus</Pill>}
                    {n.sponsorId && <Pill>Sponsored</Pill>}
                    {n.audioUrl && <Pill>Audio</Pill>}
                  </p>
                </div>
                {c && (
                  <button onClick={() => player.toggle(noteToPlayable(n, c))} aria-label="Preview" className="rounded-full p-2 hover:bg-mist">
                    <IconPlay size={14} />
                  </button>
                )}
                {own && (
                  <button onClick={() => actions.admin.deleteNote(n.id)} className="text-[12px] font-medium text-accent hover:underline">
                    Delete
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

function NoteForm() {
  const { catalog } = useCatalog();
  const creators = useMemo(() => [...catalog.creators].sort((a, b) => a.name.localeCompare(b.name)), [catalog]);
  const [f, setF] = useState({
    creatorId: creators[0]?.id ?? "",
    title: "",
    transcript: "",
    publishAt: "",
    premium: false,
    earlyHours: 0,
    sponsorId: "",
    seriesId: "",
  });
  const [audio, setAudio] = useState<{ url: string; duration: number; waveform: number[]; name: string } | null>(null);
  const now = useNow();
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const onAudio = async (file: File) => {
    setBusy(true);
    try {
      const { duration, waveform } = await analyseAudio(file);
      if (!validateDuration(duration)) {
        toast(`That's ${Math.round(duration)}s. VoysNotes are ${MAX_NOTE_SECONDS} seconds max.`);
        return;
      }
      const url = await remote.admin.upload("audio", file);
      setAudio({ url, duration: Math.min(duration, MAX_NOTE_SECONDS), waveform, name: file.name });
    } catch (e) {
      toast(`Couldn't read that file: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const quick = (d: Date) => set("publishAt", toLocalInput(d));
  const tonight = () => {
    const d = new Date();
    d.setHours(21, 0, 0, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    return d;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audio && !f.transcript.trim()) return toast("Upload audio or add the words for the demo voice.");
    const publishedAt = (f.publishAt ? new Date(f.publishAt) : new Date()).toISOString();
    const id = uid("n");
    const note: VoiceNote = {
      id,
      creatorId: f.creatorId,
      audioUrl: audio?.url ?? null,
      duration: audio ? Math.round(audio.duration) : speechSeconds(f.transcript),
      waveformData: audio?.waveform ?? makeWaveform(id),
      title: f.title.trim() || "Untitled",
      transcript: f.transcript.trim(),
      createdAt: new Date().toISOString(),
      publishedAt,
      reactions: {},
      premium: f.premium,
      earlyAccessUntil: f.earlyHours ? new Date(+new Date(publishedAt) + f.earlyHours * 3600_000).toISOString() : null,
      sponsorId: f.sponsorId || null,
      seriesId: f.seriesId || null,
    };
    setBusy(true);
    const r = await actions.admin.upsertNote(note);
    setBusy(false);
    if (!r.ok) toast(`Saved locally. Supabase said: ${r.error}`);
    else toast(+new Date(publishedAt) > Date.now() ? `Scheduled ${relativeFuture(publishedAt, Date.now())}` : "Dropped into the group", "🎙️");
    setAudio(null);
    setF((s) => ({ ...s, title: "", transcript: "" }));
  };

  return (
    <Panel title="Upload a VoysNote">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Creator">
          <select className={inputCls} value={f.creatorId} onChange={(e) => set("creatorId", e.target.value)}>
            {creators.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Title or prompt" hint="Shown on the bubble, e.g. “What I'd tell my 19-year-old self”">
          <input className={inputCls} value={f.title} maxLength={60} onChange={(e) => set("title", e.target.value)} placeholder="The best advice I ignored" />
        </Field>
        <Field label={`Audio (MP3, M4A, WAV · max ${MAX_NOTE_SECONDS}s)`}>
          <FilePick
            accept="audio/*"
            onFile={onAudio}
            label={busy ? "Reading…" : audio ? `${audio.name} · ${formatDuration(audio.duration)}` : "Choose an audio file"}
          />
        </Field>
        {audio && (
          <div className="rounded-xl bg-paper p-3 ring-1 ring-line">
            <Waveform data={audio.waveform} progress={0} height={28} />
          </div>
        )}
        <Field label="Captions" hint={audio ? "Optional: shown as live captions." : "No audio? The demo voice will read this aloud."}>
          <textarea
            className={cx(inputCls, "h-24 py-2.5")}
            value={f.transcript}
            onChange={(e) => set("transcript", e.target.value)}
            placeholder="What they say, word for word."
          />
        </Field>
        <Field label="Publish at" hint="Empty = right now.">
          <input type="datetime-local" className={inputCls} value={f.publishAt} onChange={(e) => set("publishAt", e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => quick(new Date())}>
            Now
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => quick(new Date(Date.now() + 60_000))}>
            In 1 min
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => quick(new Date(Date.now() + 3600_000))}>
            In 1 hour
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => quick(tonight())}>
            Tonight 21:00
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Check label="VoysNote+ only" hint="Exclusive for members" checked={f.premium} onChange={(v) => set("premium", v)} />
          <Field label="Early access">
            <select className={inputCls} value={f.earlyHours} onChange={(e) => set("earlyHours", Number(e.target.value))}>
              <option value={0}>None</option>
              <option value={2}>Members first · 2h</option>
              <option value={6}>Members first · 6h</option>
              <option value={24}>Members first · 24h</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sponsor">
            <select className={inputCls} value={f.sponsorId} onChange={(e) => set("sponsorId", e.target.value)}>
              <option value="">None</option>
              {catalog.sponsors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Part of series">
            <select className={inputCls} value={f.seriesId} onChange={(e) => set("seriesId", e.target.value)}>
              <option value="">None</option>
              {catalog.series.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Button className="w-full" disabled={busy || !f.creatorId}>
          {+new Date(f.publishAt) > now + 30_000 ? "Schedule drop" : "Drop it in the group"}
        </Button>
      </form>
    </Panel>
  );
}

// --- Series -----------------------------------------------------------------

const PRICES = [0, 499, 999, 1499, 1999];

function SeriesTab() {
  const { catalog, idx } = useCatalog();
  const creators = useMemo(() => [...catalog.creators].sort((a, b) => a.name.localeCompare(b.name)), [catalog]);
  const [f, setF] = useState({
    creatorId: creators[0]?.id ?? "",
    title: "",
    description: "",
    price: 999,
    billing: "one_off" as Series["billing"],
    episodes: 30,
    cadence: "daily" as Series["unlockCadence"],
    cover: "",
    sponsorId: "",
    titles: "",
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const creator = idx.creators.get(f.creatorId);
    if (!creator) return;
    const id = uid("s");
    const titles = f.titles
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
    const series: Series = {
      id,
      creatorId: creator.id,
      title: f.title.trim(),
      description: f.description.trim(),
      price: f.price,
      currency: "GBP",
      billing: f.billing,
      coverImage: f.cover || creator.portrait || creator.avatar,
      sponsorId: f.sponsorId || null,
      episodeCount: f.episodes,
      unlockCadence: f.cadence,
    };
    const episodes: SeriesEpisode[] = Array.from({ length: f.episodes }, (_, i) => {
      const title = titles[i] ?? `Day ${i + 1}`;
      const transcript = `Day ${i + 1}. ${title}. Recording coming soon.`;
      return {
        id: `${id}_e${i + 1}`,
        seriesId: id,
        day: i + 1,
        title,
        transcript,
        duration: speechSeconds(transcript),
        audioUrl: null,
        waveformData: makeWaveform(`${id}${i}`),
      };
    });
    const r = await actions.admin.upsertSeries(series, episodes);
    toast(r.ok ? `${series.title} created` : `Saved locally. Supabase said: ${r.error}`, "📚");
    setF((s) => ({ ...s, title: "", description: "", titles: "", cover: "" }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,460px)_1fr]">
      <Panel title="Create a series">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Creator">
            <select className={inputCls} value={f.creatorId} onChange={(e) => set("creatorId", e.target.value)}>
              {creators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Title">
            <input required className={inputCls} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="30 Days of Confidence" />
          </Field>
          <Field label="Description">
            <textarea className={cx(inputCls, "h-20 py-2.5")} value={f.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price">
              <select className={inputCls} value={f.price} onChange={(e) => set("price", Number(e.target.value))}>
                {PRICES.map((p) => (
                  <option key={p} value={p}>
                    {formatPrice(p)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Billing">
              <select className={inputCls} value={f.billing} onChange={(e) => set("billing", e.target.value as Series["billing"])}>
                <option value="one_off">One-off</option>
                <option value="subscription">Monthly</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Notes">
              <input
                type="number"
                min={1}
                max={60}
                className={inputCls}
                value={f.episodes}
                onChange={(e) => set("episodes", Math.max(1, Math.min(60, Number(e.target.value))))}
              />
            </Field>
            <Field label="Unlocks">
              <select className={inputCls} value={f.cadence} onChange={(e) => set("cadence", e.target.value as Series["unlockCadence"])}>
                <option value="daily">One per day</option>
                <option value="all">All at once</option>
              </select>
            </Field>
          </div>
          <Field label="Note titles" hint="Optional, one per line. Upload each recording from the Notes tab.">
            <textarea
              className={cx(inputCls, "h-24 py-2.5")}
              value={f.titles}
              onChange={(e) => set("titles", e.target.value)}
              placeholder={"Confidence is a verb\nThe story you tell\n…"}
            />
          </Field>
          <Field label="Sponsor" hint="Sponsored series are usually free: “Presented by …”">
            <select className={inputCls} value={f.sponsorId} onChange={(e) => set("sponsorId", e.target.value)}>
              <option value="">None</option>
              {catalog.sponsors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <FilePick
            accept="image/*"
            label={f.cover ? "Cover uploaded ✓" : "Cover image (defaults to the creator's portrait)"}
            onFile={async (file) => set("cover", await remote.admin.upload("covers", file))}
          />
          <Button className="w-full" disabled={!f.title}>
            Create series
          </Button>
        </form>
      </Panel>
      <Panel title="Series">
        <ul className="divide-y divide-line/70">
          {catalog.series.map((s) => {
            const c = idx.creators.get(s.creatorId);
            return (
              <li key={s.id} className="flex items-center gap-3 py-3">
                {c && <Avatar src={c.avatar} name={c.name} tone={c.tone} size={40} />}
                <div className="min-w-0 flex-1">
                  <Link href={`/series/${s.id}`} className="font-medium text-[18px] hover:underline">
                    {s.title}
                  </Link>
                  <p className="text-[12px] text-stone">
                    {c?.name} · {s.episodeCount} notes · {formatPrice(s.price)}
                    {s.billing === "subscription" ? "/mo" : ""}
                    {s.sponsorId && ` · Presented by ${idx.sponsors.get(s.sponsorId)?.name}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

// --- Sponsors ---------------------------------------------------------------

function SponsorsTab() {
  const { catalog } = useCatalog();
  const [f, setF] = useState({ name: "", tagline: "", url: "" });
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <Panel title="Add a sponsor">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await actions.admin.upsertSponsor({ id: uid("sp"), name: f.name.trim(), tagline: f.tagline.trim(), url: f.url.trim() || "#" });
            toast(r.ok ? `${f.name} added` : `Saved locally. Supabase said: ${r.error}`);
            setF({ name: "", tagline: "", url: "" });
          }}
          className="space-y-4"
        >
          <Field label="Brand name">
            <input required className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Northbound" />
          </Field>
          <Field label="Tagline" hint="One quiet line. No exclamation marks.">
            <input className={inputCls} value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} placeholder="Made for long days outside." />
          </Field>
          <Field label="Link">
            <input type="url" className={inputCls} value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://" />
          </Field>
          <Button className="w-full" disabled={!f.name}>
            Add sponsor
          </Button>
        </form>
      </Panel>
      <Panel title="Sponsors">
        <ul className="divide-y divide-line/70">
          {catalog.sponsors.map((s) => (
            <li key={s.id} className="py-3">
              <p className="text-[14px] font-semibold">{s.name}</p>
              <p className="text-[12px] text-stone">
                {s.tagline} · {catalog.notes.filter((n) => n.sponsorId === s.id).length} drops · {catalog.series.filter((x) => x.sponsorId === s.id).length}{" "}
                series
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[12px] text-stone">Renders as a small “Presented by” line. VoysNote+ members never see sponsored drops.</p>
      </Panel>
    </div>
  );
}

// --- Schedule ---------------------------------------------------------------

function ScheduleTab() {
  const { catalog } = useCatalog();
  const creators = useMemo(() => [...catalog.creators].sort((a, b) => a.name.localeCompare(b.name)), [catalog]);
  const [creatorId, setCreatorId] = useState(creators[0]?.id ?? "");
  const [at, setAt] = useState("");
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <Panel title="Schedule a “joined the group” moment">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const iso = (at ? new Date(at) : new Date(Date.now() + 60_000)).toISOString();
            await actions.admin.addEvent({ id: uid("ev"), type: "joined", creatorId, at: iso });
            const c = catalog.creators.find((x) => x.id === creatorId);
            // The creator's profile appears when they join.
            if (c && +new Date(c.joinedAt) > +new Date(iso)) await actions.admin.upsertCreator({ ...c, joinedAt: iso });
            toast(`Scheduled ${relativeFuture(iso, Date.now())}`, "🗓️");
          }}
          className="space-y-4"
        >
          <Field label="Creator">
            <select className={inputCls} value={creatorId} onChange={(e) => setCreatorId(e.target.value)}>
              {creators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="When" hint="Empty = one minute from now. 25 seconds before, the group sees “Someone new is joining…”">
            <input type="datetime-local" className={inputCls} value={at} onChange={(e) => setAt(e.target.value)} />
          </Field>
          <Button className="w-full">Schedule</Button>
        </form>
      </Panel>
      <Panel title="Upcoming">
        <Upcoming />
      </Panel>
    </div>
  );
}
