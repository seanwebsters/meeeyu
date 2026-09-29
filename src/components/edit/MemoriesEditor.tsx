"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createCard, deleteCard, updateCard } from "@/lib/db/cards";
import { getProfileByUsername } from "@/lib/db/profiles";
import { MemoriesBoard } from "@/components/scrapbook/MemoriesBoard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { rotationFromId } from "@/lib/utils";
import type { ProfileCard, TaggedFriend } from "@/lib/types";

function randomPosition(seed: string) {
  // Deterministic-ish scatter so new pins don't all land exactly centered
  // on top of each other, spread across the middle of the board.
  const r = rotationFromId(seed, 30);
  return { x: 50 + r, y: 40 + rotationFromId(seed + "y", 20) };
}

export function MemoriesEditor({
  profileId,
  cards,
  onCreate,
  onUpdate,
  onDelete,
}: {
  profileId: string;
  cards: ProfileCard[];
  onCreate: (card: ProfileCard) => void;
  onUpdate: (id: string, patch: Partial<ProfileCard>) => void;
  onDelete: (id: string) => void;
}) {
  const supabase = createClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tagError, setTagError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const selected = cards.find((c) => c.id === selectedId) ?? null;

  function handleMove(id: string, x: number, y: number) {
    onUpdate(id, { position_x: x, position_y: y });
  }

  async function handleMoveEnd(id: string, x: number, y: number) {
    await updateCard(supabase, id, { position_x: x, position_y: y });
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${profileId}/memory-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      const seed = `${profileId}-${path}`;
      const pos = randomPosition(seed);
      const created = await createCard(supabase, {
        profile_id: profileId,
        type: "memory",
        content: { url: publicUrl },
        rotation: rotationFromId(seed),
        position_x: pos.x,
        position_y: pos.y,
      });
      onCreate(created);
      setSelectedId(created.id);
    } finally {
      setUploading(false);
    }
  }

  async function saveCaption(value: string) {
    if (!selected) return;
    const title = value || null;
    onUpdate(selected.id, { title });
    await updateCard(supabase, selected.id, { title });
  }

  async function addTag() {
    if (!selected || !tagInput.trim()) return;
    setTagError(null);
    const username = tagInput.trim().replace(/^@/, "");
    const friend = await getProfileByUsername(supabase, username);
    if (!friend) {
      setTagError(`no meeeyu found for @${username}`);
      return;
    }
    const existing = selected.content.tagged_friends ?? [];
    if (existing.some((f) => f.id === friend.id)) {
      setTagInput("");
      return;
    }
    const tagged: TaggedFriend[] = [...existing, { id: friend.id, username: friend.username }];
    const content = { ...selected.content, tagged_friends: tagged };
    onUpdate(selected.id, { content });
    setTagInput("");
    await updateCard(supabase, selected.id, { content });
  }

  async function removeTag(friendId: string) {
    if (!selected) return;
    const tagged = (selected.content.tagged_friends ?? []).filter((f) => f.id !== friendId);
    const content = { ...selected.content, tagged_friends: tagged };
    onUpdate(selected.id, { content });
    await updateCard(supabase, selected.id, { content });
  }

  async function removeMemory() {
    if (!selected) return;
    await deleteCard(supabase, selected.id);
    onDelete(selected.id);
    setSelectedId(null);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">
        pin photos anywhere on the board — drag to rearrange, tap one to add a
        caption or tag friends.
      </p>

      <MemoriesBoard
        cards={cards}
        editable
        onMove={handleMove}
        onMoveEnd={handleMoveEnd}
        onSelect={setSelectedId}
      />

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUpload(f);
        }}
      />
      <Button
        variant="secondary"
        onClick={() => fileInput.current?.click()}
        disabled={uploading}
        className="w-full"
      >
        {uploading ? "uploading…" : "+ add a memory"}
      </Button>

      {selected && (
        <div className="scrapbook-shadow space-y-3 rounded-2xl bg-paper-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">edit memory</p>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="text-ink-soft hover:text-ink"
              aria-label="close"
            >
              ✕
            </button>
          </div>

          <Input
            placeholder="caption (optional)"
            defaultValue={selected.title ?? ""}
            onBlur={(e) => saveCaption(e.target.value)}
          />

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              tag friends
            </p>
            {(selected.content.tagged_friends?.length ?? 0) > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {selected.content.tagged_friends!.map((f) => (
                  <span
                    key={f.id}
                    className="flex items-center gap-1 rounded-full bg-pink-soft px-2.5 py-1 text-xs"
                  >
                    @{f.username}
                    <button
                      type="button"
                      onClick={() => removeTag(f.id)}
                      className="text-ink-soft hover:text-ink"
                      aria-label={`remove ${f.username}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="username"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button variant="secondary" onClick={addTag} className="px-4">
                add
              </Button>
            </div>
            {tagError && <p className="mt-1 text-xs text-pink">{tagError}</p>}
          </div>

          <button
            type="button"
            onClick={removeMemory}
            className="w-full text-center text-sm text-pink underline"
          >
            delete this memory
          </button>
        </div>
      )}
    </div>
  );
}
