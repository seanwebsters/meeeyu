"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { noteAccess } from "@/lib/access";
import { noteToPlayable } from "@/lib/audio/playable";
import { actions, useApp, useCatalog, useEntitlements } from "@/lib/store/app";
import { useNow } from "@/lib/store/clock";
import { cx, relativeShort } from "@/lib/utils";
import type { VoiceNote } from "@/lib/types";
import { NoteRow } from "@/components/note/NoteRow";
import { Sheet } from "@/components/ui/Sheet";
import { Avatar } from "@/components/ui/Avatar";
import { Button, ButtonLink } from "@/components/ui/Button";
import { IconBookmark, IconCheck, IconLock, IconPlus } from "@/components/icons";
import { toast } from "@/components/ui/Toast";

type Tab = "saved" | "collections" | "recent";

export default function SavedPage() {
  const [tab, setTab] = useState<Tab>("saved");
  const [openCollection, setOpenCollection] = useState<string | null>(null);
  const [organise, setOrganise] = useState<string | null>(null);
  const { idx } = useCatalog();
  const e = useEntitlements();
  const now = useNow();
  const saved = useApp((s) => s.saved);
  const collections = useApp((s) => s.collections);
  const played = useApp((s) => s.played);

  const savedNotes = useMemo(
    () =>
      saved
        .filter((x) => !openCollection || x.collectionId === openCollection)
        .flatMap((x) => (idx.notes.has(x.noteId) ? [{ ...x, note: idx.notes.get(x.noteId)! }] : [])),
    [saved, idx, openCollection],
  );
  const playedNotes = useMemo(() => played.flatMap((p) => (idx.notes.has(p.noteId) ? [{ ...p, note: idx.notes.get(p.noteId)! }] : [])), [played, idx]);

  const queueOf = (notes: VoiceNote[]) => notes.map((n) => noteToPlayable(n, idx.creators.get(n.creatorId)!));
  const current = collections.find((c) => c.id === openCollection);

  return (
    <div className="pb-40">
      <header className="px-5 pb-2 pt-[max(20px,env(safe-area-inset-top))]">
        <h1 className="display text-[44px]">{current ? current.name : "Saved"}</h1>
        {current && (
          <button onClick={() => setOpenCollection(null)} className="mt-1 text-[13px] text-stone underline-offset-2 hover:underline">
            ← All saved
          </button>
        )}
      </header>

      {!current && (
        <div className="sticky top-0 z-20 flex gap-1 bg-cream/85 px-5 py-2 backdrop-blur-xl">
          {(
            [
              ["saved", "Saved"],
              ["collections", "Collections"],
              ["recent", "Recently played"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cx("relative h-9 rounded-full px-3.5 text-[14px] font-medium", tab === k ? "text-cream" : "text-stone")}
            >
              {tab === k && (
                <motion.span
                  layoutId="saved-tab"
                  className="absolute inset-0 rounded-full bg-ink"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                />
              )}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="px-5 pt-3">
        {(tab === "saved" || current) &&
          (savedNotes.length ? (
            <div className="divide-y divide-line/60">
              {savedNotes.map(({ note }) => (
                <div key={note.id} className="flex items-center gap-1">
                  <div className="min-w-0 flex-1">
                    <NoteRow
                      note={note}
                      creator={idx.creators.get(note.creatorId)!}
                      access={noteAccess(note, e, now)}
                      queue={queueOf(savedNotes.map((x) => x.note))}
                    />
                  </div>
                  <button onClick={() => setOrganise(note.id)} aria-label="Organise" className="rounded-full p-2 text-stone hover:bg-mist">
                    •••
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title={current ? "Nothing in here yet" : "Nothing saved yet"}
              body="Tap the bookmark on any VoysNote to keep it. Thirty seconds worth hearing twice."
            />
          ))}

        {tab === "collections" && !current && <Collections onOpen={(id) => setOpenCollection(id)} />}

        {tab === "recent" &&
          !current &&
          (playedNotes.length ? (
            <div className="divide-y divide-line/60">
              {playedNotes.map(({ note, at }) => (
                <NoteRow
                  key={note.id}
                  note={note}
                  creator={idx.creators.get(note.creatorId)!}
                  access={noteAccess(note, e, now)}
                  meta={`Played ${relativeShort(at, now)} ago`}
                />
              ))}
            </div>
          ) : (
            <Empty title="Nothing played yet" body="Your listening history lives here. Go and hear who's in the group." />
          ))}
      </div>

      <OrganiseSheet noteId={organise} onClose={() => setOrganise(null)} />
    </div>
  );
}

function Collections({ onOpen }: { onOpen: (id: string) => void }) {
  const plus = useEntitlements().plus;
  const collections = useApp((s) => s.collections);
  const saved = useApp((s) => s.saved);
  const { idx } = useCatalog();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");

  if (!plus)
    return (
      <div className="mt-4 rounded-[26px] bg-ink p-6 text-cream">
        <IconLock size={20} />
        <h3 className="display mt-4 text-[32px]">Collections are part of VoysNote+</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-cream/70">
          Group the notes that matter into your own playlists: Mornings, Courage, Before a big meeting.
        </p>
        <ButtonLink href="/plus" variant="cream" className="mt-5">
          See VoysNote+
        </ButtonLink>
      </div>
    );

  return (
    <div className="grid grid-cols-2 gap-3 pt-2">
      {collections.map((c) => {
        const items = saved.filter((s) => s.collectionId === c.id);
        const faces = [...new Set(items.map((s) => idx.notes.get(s.noteId)?.creatorId).filter(Boolean))].slice(0, 3) as string[];
        return (
          <button
            key={c.id}
            onClick={() => onOpen(c.id)}
            className="flex aspect-square flex-col justify-between rounded-[24px] bg-paper p-4 text-left ring-1 ring-line"
          >
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
              <p className="font-serif text-[22px] leading-tight">{c.name}</p>
              <p className="text-[12px] text-stone">{items.length} notes</p>
            </div>
          </button>
        );
      })}
      {naming ? (
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            if (!name.trim()) return;
            actions.createCollection(name.trim());
            setName("");
            setNaming(false);
          }}
          className="flex aspect-square flex-col justify-between rounded-[24px] border border-dashed border-stone-2 p-4"
        >
          <input
            autoFocus
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            placeholder="Name it"
            className="bg-transparent font-serif text-[22px] outline-none"
          />
          <Button size="sm" disabled={!name.trim()}>
            Create
          </Button>
        </form>
      ) : (
        <button
          onClick={() => setNaming(true)}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-stone-2 text-[14px] font-medium text-stone"
        >
          <IconPlus />
          New collection
        </button>
      )}
    </div>
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
          {collections.length === 0 && <p className="py-2 text-[14px] text-stone">Create a collection from the Collections tab first.</p>}
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
              {entry?.collectionId === c.id && <IconCheck size={18} />}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[14px] text-ink-2">
          Collections come with{" "}
          <Link href="/plus" className="font-semibold underline">
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
        className="mt-3 w-full rounded-2xl px-3 py-3 text-left text-[15px] text-ember hover:bg-mist"
      >
        Remove from Saved
      </button>
    </Sheet>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-mist text-stone">
        <IconBookmark size={26} />
      </div>
      <h3 className="display mt-5 text-[30px]">{title}</h3>
      <p className="mt-2 max-w-[280px] text-[14px] leading-relaxed text-stone">{body}</p>
      <ButtonLink href="/" variant="outline" className="mt-6">
        Back to the group
      </ButtonLink>
    </div>
  );
}
