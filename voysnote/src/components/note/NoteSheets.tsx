"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { createStore } from "@/lib/store/createStore";
import { actions, useApp, useCatalog } from "@/lib/store/app";
import { useNow } from "@/lib/store/clock";
import { replyCount, seedReplies } from "@/lib/replies";
import { cx, firstName, initials, relativeShort } from "@/lib/utils";
import { Sheet } from "../ui/Sheet";
import { Avatar } from "../ui/Avatar";
import { IconBookmark, IconLink, IconShare, IconUser } from "../icons";
import { openShare } from "./ShareSheet";
import { toast } from "../ui/Toast";

const repliesStore = createStore<string | null>(null);
const menuStore = createStore<string | null>(null);
export const openReplies = (noteId: string) => repliesStore.set(noteId);
export const openNoteMenu = (noteId: string) => menuStore.set(noteId);

/** Total replies shown on a card: the group's plus your own. */
export function useReplyCount(noteId: string) {
  const { idx } = useCatalog();
  const mine = useApp((s) => s.replies.filter((r) => r.noteId === noteId).length);
  const note = idx.notes.get(noteId);
  return (note ? replyCount(note) : 0) + mine;
}

export function NoteSheetsHost() {
  return (
    <>
      <RepliesSheet />
      <NoteMenu />
    </>
  );
}

function RepliesSheet() {
  const noteId = useSyncExternalStore(repliesStore.subscribe, repliesStore.get, () => null);
  const { idx } = useCatalog();
  const now = useNow();
  const allMine = useApp((s) => s.replies);
  const [text, setText] = useState("");
  const note = noteId ? idx.notes.get(noteId) : undefined;
  const creator = note ? idx.creators.get(note.creatorId) : undefined;
  const replies = note ? [...seedReplies(note, now), ...allMine.filter((r) => r.noteId === note.id)].sort((a, b) => +new Date(a.at) - +new Date(b.at)) : [];
  const close = () => repliesStore.set(null);
  const count = note ? replyCount(note) + allMine.filter((r) => r.noteId === note.id).length : 0;

  return (
    <Sheet open={!!note} onClose={close} title={`${count.toLocaleString("en-GB")} replies`}>
      {note && creator && (
        <>
          <div className="flex items-center gap-3 rounded-2xl bg-mist/60 p-3">
            <Avatar src={creator.avatar} name={creator.name} tone={creator.tone} size={36} />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold">{creator.name}</p>
              <p className="truncate text-[13px] text-ink-2">{note.title}</p>
            </div>
          </div>
          <ul className="mt-3 space-y-4 pb-2">
            {replies.map((r) => (
              <li key={r.id} className="flex gap-3">
                <span
                  className={cx(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                    r.mine ? "bg-accent text-cream" : "bg-mist text-ink-2",
                  )}
                >
                  {initials(r.userName)}
                </span>
                <div>
                  <p className="text-[13px]">
                    <span className="font-semibold">{r.mine ? "You" : r.userName}</span>
                    <span className="ml-1.5 text-stone">{relativeShort(r.at, now)}</span>
                  </p>
                  <p className="text-[14px] leading-snug text-ink-2">{r.text}</p>
                </div>
              </li>
            ))}
            {count > replies.length && <li className="pl-11 text-[12px] text-stone">and {(count - replies.length).toLocaleString("en-GB")} more</li>}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              actions.addReply(note.id, text);
              setText("");
            }}
            className="sticky bottom-0 mt-2 flex gap-2 bg-cream pt-2"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={280}
              placeholder={`Reply to ${firstName(creator.name)}…`}
              className="h-11 flex-1 rounded-full border border-line bg-paper px-4 text-[14px] outline-none focus:border-accent/40"
            />
            <button disabled={!text.trim()} className="h-11 rounded-full bg-accent px-5 text-[14px] font-semibold text-cream disabled:opacity-40">
              Send
            </button>
          </form>
        </>
      )}
    </Sheet>
  );
}

function NoteMenu() {
  const noteId = useSyncExternalStore(menuStore.subscribe, menuStore.get, () => null);
  const { idx } = useCatalog();
  const saved = useApp((s) => s.saved.some((x) => x.noteId === noteId));
  const note = noteId ? idx.notes.get(noteId) : undefined;
  const creator = note ? idx.creators.get(note.creatorId) : undefined;
  const close = () => menuStore.set(null);

  return (
    <Sheet open={!!note} onClose={close} title={note?.title}>
      {note && creator && (
        <div className="-mx-2">
          <MenuItem
            close={close}
            icon={<IconBookmark size={20} />}
            label={saved ? "Remove from Saved" : "Save"}
            onClick={() => {
              actions.toggleSave(note.id);
              toast(saved ? "Removed from Saved" : "Saved", saved ? undefined : "🔖");
            }}
          />
          <MenuItem close={close} icon={<IconShare size={20} />} label="Share as a Story" onClick={() => setTimeout(() => openShare(note.id), 250)} />
          <MenuItem
            close={close}
            icon={<IconLink size={20} />}
            label="Copy link"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(`${location.origin}/n/${note.id}`);
                toast("Link copied", "🔗");
              } catch {}
            }}
          />
          <MenuItem close={close} icon={<IconUser size={20} />} label={`Go to ${firstName(creator.name)}'s profile`} href={`/c/${creator.username}`} />
        </div>
      )}
    </Sheet>
  );
}

function MenuItem({ icon, label, onClick, href, close }: { icon: React.ReactNode; label: string; onClick?: () => void; href?: string; close: () => void }) {
  const cls = "flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left text-[15px] hover:bg-mist";
  return href ? (
    <Link href={href} onClick={close} className={cls}>
      {icon}
      {label}
    </Link>
  ) : (
    <button
      onClick={() => {
        onClick?.();
        close();
      }}
      className={cls}
    >
      {icon}
      {label}
    </button>
  );
}
