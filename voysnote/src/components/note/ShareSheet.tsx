"use client";

import { useSyncExternalStore, useState } from "react";
import { createStore } from "@/lib/store/createStore";
import { useCatalog } from "@/lib/store/app";
import { Sheet } from "../ui/Sheet";
import { storyImageUrl } from "./StoryCard";
import { IconDownload, IconLink, IconShare } from "../icons";
import { toast } from "../ui/Toast";
import { firstName } from "@/lib/utils";

const shareStore = createStore<string | null>(null);
export const openShare = (noteId: string) => shareStore.set(noteId);

export function ShareSheetHost() {
  const noteId = useSyncExternalStore(shareStore.subscribe, shareStore.get, () => null);
  const { catalog, idx } = useCatalog();
  const note = noteId ? idx.notes.get(noteId) : undefined;
  const creator = note ? idx.creators.get(note.creatorId) : undefined;
  const [busy, setBusy] = useState(false);

  const close = () => shareStore.set(null);
  if (!note || !creator)
    return (
      <Sheet open={false} onClose={close}>
        {null}
      </Sheet>
    );

  const isFirstNote =
    catalog.notes.filter((n) => n.creatorId === creator.id).sort((a, b) => +new Date(a.publishedAt) - +new Date(b.publishedAt))[0]?.id === note.id;
  const link = `${location.origin}/n/${note.id}`;
  const img = storyImageUrl(note, creator, isFirstNote);
  const text = `${firstName(creator.name)} on VoysNote 🎙️`;

  const getFile = async () => {
    const blob = await (await fetch(img)).blob();
    return new File([blob], `voysnote-${creator.username}.png`, { type: "image/png" });
  };

  const shareStory = async () => {
    setBusy(true);
    try {
      const file = await getFile();
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${text} ${link}` });
      } else {
        download(file);
        toast("Story card saved. Add it to your Story.", "📲");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast("Couldn't share that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const download = (file: File) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  return (
    <Sheet open onClose={close} title="Share this VoysNote">
      <div className="skeleton mx-auto aspect-[9/16] w-[52%] max-w-[220px] overflow-hidden rounded-[18px] shadow-[0_20px_50px_-20px_rgba(21,19,16,0.35)] ring-1 ring-line">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG, the exact Story card */}
        <img src={img} alt={`Story card: ${creator.name}`} className="h-full w-full object-cover" />
      </div>
      <p className="mx-auto mt-4 max-w-[280px] text-center text-[13px] text-stone">The card teases the moment. The full note only plays inside VoysNote.</p>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <ShareAction onClick={shareStory} disabled={busy} label="Story" icon={<IconShare size={20} />} primary />
        <ShareAction
          label="Save image"
          icon={<IconDownload size={20} />}
          onClick={async () => {
            setBusy(true);
            try {
              download(await getFile());
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy}
        />
        <ShareAction
          label="Copy link"
          icon={<IconLink size={20} />}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
              toast("Link copied", "🔗");
            } catch {
              toast(link);
            }
          }}
        />
      </div>
    </Sheet>
  );
}

function ShareAction({
  label,
  icon,
  onClick,
  primary,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1.5 rounded-2xl py-3.5 text-[12px] font-semibold transition-transform active:scale-95 disabled:opacity-50 ${primary ? "bg-accent text-cream" : "bg-paper text-ink ring-1 ring-line"}`}
    >
      {icon}
      {label}
    </button>
  );
}
