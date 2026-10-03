import type { Creator, VoiceNote } from "@/lib/types";
import { firstName } from "@/lib/utils";

// The shareable Story card is rendered server-side by /api/story, so the
// preview in the share sheet is exactly the image that gets posted.

/** The hook line, shared by the card, the link preview and the landing page. */
export function storyHeadline(creator: Creator, isFirstNote: boolean) {
  return isFirstNote ? `${firstName(creator.name)} joined the group` : `${firstName(creator.name)} has something to say`;
}

export function storyImageUrl(note: VoiceNote, creator: Creator, isFirstNote: boolean) {
  const q = new URLSearchParams({
    headline: storyHeadline(creator, isFirstNote),
    name: creator.name,
    dur: String(note.duration),
    title: note.title,
    seed: note.id,
  });
  if (creator.avatar && !creator.avatar.startsWith("data:")) q.set("avatar", creator.avatar);
  return `/api/story?${q}`;
}
