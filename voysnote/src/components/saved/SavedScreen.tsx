"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { noteAccess, ownsSeries, unlockedEpisodes } from "@/lib/access";
import { noteToPlayable } from "@/lib/audio/playable";
import { actions, useApp, useCatalog, useEntitlements } from "@/lib/store/app";
import { useNow } from "@/lib/store/clock";
import { ago, cx } from "@/lib/utils";
import type { VoiceNote } from "@/lib/types";
import { NoteRow } from "../note/NoteRow";
import { CreatorRow } from "../creator/CreatorRow";
import { Sheet } from "../ui/Sheet";
import { Avatar } from "../ui/Avatar";
import { Button, ButtonLink } from "../ui/Button";
import { IconBookmark, IconCheck, IconChevron, IconCrown, IconDiscover, IconMore, IconPlus } from "../icons";
import { toast } from "../ui/Toast";

type Filter = "all" | "notes" | "series" | "creators" | "recent";
const FILTERS: [Filter, string][] = [
  ["all", "All"],
  ["notes", "VoysNotes"],
  ["series", "Series"],
  ["creators", "Creators"],
  ["recent", "Recent"],
];

export function SavedScreen() {
  const params = useSearchParams();
  const [tab, setTab] = useState<"saved" | "collections">(() => (params.get("tab") === "collections" ? "collections" : "saved"));
  const [filter, setFilter] = useState<Filter>("all");
  const [openCollection, setOpenCollection] = useState<string | null>(null);
  const [organise, setOrganise] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { catalog, idx } = useCatalog();
  const e = useEntitlements();
  const now = useNow();
  const saved = useApp((s) => s.saved);
  const collections = useApp((s) => s.collections);
  const played = useApp((s) => s.played);
  const follows = useApp((s) => s.follows);

  const savedNotes = useMemo(
    () => saved.filter((x) => !openCollection || x.collectionId === openCollection).flatMap((x) => (idx.notes.has(x.noteId) ? [idx.notes.get(x.noteId)!] : [])),
    [saved, idx, openCollection],
  );
  const playedNotes = useMemo(() => played.flatMap((p) => (idx.notes.has(p.noteId) ? [{ ...p, note: idx.notes.get(p.noteId)! }] : [])), [played, idx]);
  const mySeries = catalog.series.filter((s) => e.seriesStartedAt[s.id] || (s.price > 0 && ownsSeries(s, e)));
  const followed = follows.flatMap((id) => (idx.creators.has(id) ? [idx.creators.get(id)!] : []));
  const queueOf = (notes: VoiceNote[]) => notes.map((n) => noteToPlayable(n, idx.creators.get(n.creatorId)!));
  const current = collections.find((c) => c.id === openCollection);

  const kebab = (id: string) => (
    <button onClick={() => setOrganise(id)} aria-label="Organise" className="rounded-full p-2 text-stone hover:bg-mist">
      <IconMore size={18} />
    </button>
  );

  const noteList = (notes: VoiceNote[]) => (
    <div className="divide-y divide-line/60">
      {notes.map((n) => (
        <NoteRow key={n.id} note={n} creator={idx.creators.get(n.creatorId)!} access={noteAccess(n, e, now)} queue={queueOf(notes)} trailing={kebab(n.id)} />
      ))}
    </div>
  );

  const show = (f: Filter) => filter === "all" || filter === f;
  const empty =
    (filter === "all" && !savedNotes.length && !mySeries.length && !followed.length) ||
    (filter === "notes" && !savedNotes.length) ||
    (filter === "series" && !mySeries.length) ||
    (filter === "creators" && !followed.length) ||
    (filter === "recent" && !playedNotes.length);

  return (
    <div className="pb-40">
      <header className="sticky top-0 z-20 bg-cream/90 px-5 pt-[max(14px,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex h-10 items-center gap-1">
          <span className="wordmark flex-1 text-[22px]">VoysNote</span>
          <Link href="/discover?search=1" aria-label="Search" className="rounded-full p-2 hover:bg-mist">
            <IconDiscover size={22} />
          </Link>
        </div>
        {current ? (
          <div className="pb-3 pt-2">
            <button onClick={() => setOpenCollection(null)} className="text-[13px] text-stone hover:text-ink">
              ← Collections
            </button>
            <h1 className="display mt-1 text-[28px]">{current.name}</h1>
          </div>
        ) : (
          <nav className="mt-2 flex gap-6 border-b border-line">
            {(
              [
                ["saved", "Saved"],
                ["collections", "Collections"],
              ] as const
            ).map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} className={cx("relative pb-2.5 text-[14px] font-medium", tab === k ? "text-ink" : "text-stone")}>
                {label}
                {tab === k && <motion.span layoutId="saved-tab" className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-accent" />}
              </button>
            ))}
          </nav>
        )}
      </header>

      <div className="px-5 pt-4">
        {current ? (
          savedNotes.length ? (
            noteList(savedNotes)
          ) : (
            <Empty title="Nothing in here yet" body="Use ••• on any saved note to add it to this collection." />
          )
        ) : tab === "saved" ? (
          <>
            <button onClick={() => setCreating(true)} className="flex w-full items-center gap-3.5 rounded-[18px] bg-mist/70 p-3.5 text-left">
              <span className="flex h-12 w-12 items-center justify-center rounded-[12px] border border-line bg-paper text-ink-2">
                <IconPlus size={22} />
              </span>
              <span>
                <span className="block text-[14px] font-semibold">Create a collection</span>
                <span className="block text-[12px] text-stone">Save and organise your favourite VoysNotes.</span>
              </span>
            </button>

            <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
              {FILTERS.map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={cx(
                    "h-8 shrink-0 rounded-full px-3.5 text-[13px] font-medium transition-colors",
                    filter === k ? "bg-accent text-cream" : "border border-line bg-paper text-ink-2",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="pt-2">
              {empty && <Empty title="Nothing here yet" body="Tap the bookmark on any VoysNote to keep it. Thirty seconds worth hearing twice." />}
              {show("notes") && savedNotes.length > 0 && noteList(savedNotes)}
              {show("series") && mySeries.length > 0 && (
                <div className={cx(filter === "all" && "mt-4")}>
                  {filter === "all" && <SubTitle>Series</SubTitle>}
                  {mySeries.map((s) => {
                    const c = idx.creators.get(s.creatorId)!;
                    return (
                      <Link key={s.id} href={`/series/${s.id}`} className="flex items-center gap-3 py-2.5">
                        <Avatar src={s.coverImage} name={c.name} tone={c.tone} size={52} square />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold">{s.title}</p>
                          <p className="text-[12px] text-stone">
                            {c.name} · Day {unlockedEpisodes(s, e, now) || 1} of {s.episodeCount}
                          </p>
                        </div>
                        <IconChevron size={18} className="text-stone" />
                      </Link>
                    );
                  })}
                </div>
              )}
              {show("creators") && followed.length > 0 && (
                <div className={cx(filter === "all" && "mt-4")}>
                  {filter === "all" && <SubTitle>Creators you follow</SubTitle>}
                  <div className="divide-y divide-line/60">
                    {followed.map((c) => (
                      <CreatorRow key={c.id} creator={c} meta={c.role} />
                    ))}
                  </div>
                </div>
              )}
              {filter === "recent" && playedNotes.length > 0 && (
                <div className="divide-y divide-line/60">
                  {playedNotes.map(({ note, at }) => (
                    <NoteRow
                      key={note.id}
                      note={note}
                      creator={idx.creators.get(note.creatorId)!}
                      access={noteAccess(note, e, now)}
                      meta={`Played ${ago(at, now)}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <Collections onOpen={setOpenCollection} onCreate={() => setCreating(true)} />
        )}
      </div>

      <OrganiseSheet noteId={organise} onClose={() => setOrganise(null)} />
      <CreateSheet open={creating} onClose={() => setCreating(false)} onCreated={() => setTab("collections")} />
    </div>
  );
}

function Collections({ onOpen, onCreate }: { onOpen: (id: string) => void; onCreate: () => void }) {
  const collections = useApp((s) => s.collections);
  const saved = useApp((s) => s.saved);
  const { idx } = useCatalog();
  return (
    <div className="grid grid-cols-2 gap-3">
      {collections.map((c) => {
        const items = saved.filter((s) => s.collectionId === c.id);
        const faces = [...new Set(items.map((s) => idx.notes.get(s.noteId)?.creatorId).filter(Boolean))].slice(0, 3) as string[];
        return (
          <button key={c.id} onClick={() => onOpen(c.id)} className="card flex aspect-square flex-col justify-between p-4 text-left">
            <div className="flex -space-x-2">
              {faces.length ? (
                faces.map((id) => {
                  const cr = idx.creators.get(id)!;
                  return <Avatar key={id} src={cr.avatar} name={cr.name} tone={cr.tone} size={32} className="rounded-full ring-2 ring-paper" />;
                })
              ) : (
                <IconBookmark className="text-stone" />
              )}
            </div>
            <div>
              <p className="text-[16px] font-semibold leading-tight">{c.name}</p>
              <p className="text-[12px] text-stone">{items.length} notes</p>
            </div>
          </button>
        );
      })}
      <button
        onClick={onCreate}
        className="flex aspect-square flex-col items-center justify-center gap-2 rounded-[22px] border border-dashed border-stone-2 text-[14px] font-medium text-stone"
      >
        <IconPlus />
        New collection
      </button>
    </div>
  );
}

function CreateSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const plus = useEntitlements().plus;
  const [name, setName] = useState("");
  return (
    <Sheet open={open} onClose={onClose} title="New collection">
      {plus ? (
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            if (!name.trim()) return;
            actions.createCollection(name.trim());
            toast(`${name.trim()} created`);
            setName("");
            onClose();
            onCreated();
          }}
          className="space-y-3"
        >
          <input
            autoFocus
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            placeholder="Mornings, Courage, Before a big meeting…"
            className="h-12 w-full rounded-full border border-line bg-paper px-5 text-[15px] outline-none focus:border-accent/40"
          />
          <Button className="w-full" disabled={!name.trim()}>
            Create
          </Button>
        </form>
      ) : (
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold-soft text-gold">
            <IconCrown size={22} />
          </span>
          <p className="mt-3 text-[17px] font-semibold">Collections are part of VoysNote+</p>
          <p className="mt-1 text-[14px] text-stone">Group the notes that matter into your own playlists.</p>
          <ButtonLink href="/plus" className="mt-5 w-full">
            See VoysNote+
          </ButtonLink>
        </div>
      )}
    </Sheet>
  );
}

function OrganiseSheet({ noteId, onClose }: { noteId: string | null; onClose: () => void }) {
  const plus = useEntitlements().plus;
  const collections = useApp((s) => s.collections);
  const entry = useApp((s) => s.saved.find((x) => x.noteId === noteId));
  return (
    <Sheet open={!!noteId} onClose={onClose} title="Organise">
      {plus ? (
        <div className="space-y-1">
          {collections.length === 0 && <p className="py-2 text-[14px] text-stone">Create a collection first.</p>}
          {collections.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                actions.moveToCollection(noteId!, entry?.collectionId === c.id ? null : c.id);
                toast(entry?.collectionId === c.id ? "Removed from collection" : `Added to ${c.name}`);
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-[15px] hover:bg-mist"
            >
              {c.name}
              {entry?.collectionId === c.id && <IconCheck size={18} className="text-accent" />}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[14px] text-ink-2">
          Collections come with{" "}
          <Link href="/plus" className="font-semibold text-accent underline">
            VoysNote+
          </Link>
          .
        </p>
      )}
      <button
        onClick={() => {
          actions.toggleSave(noteId!);
          onClose();
        }}
        className="mt-3 w-full rounded-2xl px-3 py-3 text-left text-[15px] text-heart hover:bg-mist"
      >
        Remove from Saved
      </button>
    </Sheet>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="pb-1 pt-2 text-[13px] font-semibold text-stone">{children}</h3>;
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
        <IconBookmark size={24} />
      </div>
      <h3 className="mt-4 text-[18px] font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-[280px] text-[14px] leading-relaxed text-stone">{body}</p>
      <ButtonLink href="/" variant="outline" className="mt-6">
        Back to the group
      </ButtonLink>
    </div>
  );
}
