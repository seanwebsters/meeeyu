"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { updateCard, deleteCard } from "@/lib/db/cards";
import { CARD_META } from "@/components/scrapbook/CardTile";
import type { ProfileCard } from "@/lib/types";
import { Input, Textarea } from "@/components/ui/Input";

export function CardEditorRow({
  card,
  profileId,
  onChange,
  onRemove,
  onMove,
  isFirst,
  isLast,
}: {
  card: ProfileCard;
  profileId: string;
  onChange: (card: ProfileCard) => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const supabase = createClient();
  const meta = CARD_META[card.type];
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function save(patch: Partial<ProfileCard>) {
    const updated = await updateCard(supabase, card.id, patch);
    onChange(updated);
  }

  async function handlePhoto(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${profileId}/card-${card.id}-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      await save({ content: { ...card.content, url: publicUrl } });
    } finally {
      setUploading(false);
    }
  }

  async function remove() {
    await deleteCard(supabase, card.id);
    onRemove();
  }

  return (
    <div className="scrapbook-shadow flex gap-3 rounded-2xl bg-paper-card p-3">
      <div className="flex flex-col items-center gap-1 pt-1">
        <button
          type="button"
          disabled={isFirst}
          onClick={() => onMove("up")}
          className="text-ink-soft disabled:opacity-20"
          aria-label="move up"
        >
          ▲
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={() => onMove("down")}
          className="text-ink-soft disabled:opacity-20"
          aria-label="move down"
        >
          ▼
        </button>
      </div>

      <div className="flex-1">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {meta.icon} {meta.label || card.type}
        </p>

        {card.type === "photo" ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-paper"
            >
              {card.content.url ? (
                <Image src={card.content.url} alt="" fill className="object-cover" unoptimized />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xl">🖼️</span>
              )}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePhoto(f);
              }}
            />
            <Input
              placeholder="caption"
              defaultValue={card.title ?? ""}
              onBlur={(e) => save({ title: e.target.value })}
            />
          </div>
        ) : meta.note === "sticky" ? (
          <Textarea
            rows={2}
            defaultValue={card.content.text ?? ""}
            onBlur={(e) => save({ content: { ...card.content, text: e.target.value } })}
          />
        ) : (
          <Input
            defaultValue={card.title ?? ""}
            onBlur={(e) => save({ title: e.target.value })}
          />
        )}
        {uploading && <p className="mt-1 text-xs text-ink-soft">uploading…</p>}
      </div>

      <button
        type="button"
        onClick={remove}
        className="self-start text-ink-soft hover:text-pink"
        aria-label="delete"
      >
        ✕
      </button>
    </div>
  );
}
