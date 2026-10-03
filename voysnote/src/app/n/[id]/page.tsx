import type { Metadata } from "next";
import { buildSeedCatalog } from "@/lib/catalog";
import { storyHeadline } from "@/components/note/StoryCard";
import { Teaser } from "@/components/share/Teaser";
import { Toaster } from "@/components/ui/Toast";

function lookup(id: string) {
  const c = buildSeedCatalog(Date.now());
  const note = c.notes.find((n) => n.id === id);
  const creator = note && c.creators.find((x) => x.id === note.creatorId);
  if (!note || !creator) return null;
  const first = c.notes.filter((n) => n.creatorId === creator.id).sort((a, b) => +new Date(a.publishedAt) - +new Date(b.publishedAt))[0];
  return { note, creator, isFirst: first?.id === note.id };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const hit = lookup(id);
  if (!hit) return { title: "A VoysNote" };
  const headline = storyHeadline(hit.creator, hit.isFirst);
  const q = new URLSearchParams({
    headline,
    name: hit.creator.name,
    dur: String(hit.note.duration),
    seed: hit.note.id,
    format: "og",
    avatar: hit.creator.avatar,
  });
  return {
    title: `${headline} 🎙️`,
    description: `“${hit.note.title}”: ${hit.note.duration} seconds from ${hit.creator.name}. Listen on VoysNote.`,
    openGraph: { images: [{ url: `/api/story?${q}`, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image" },
  };
}

export default async function SharedNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="relative mx-auto min-h-dvh max-w-[460px] bg-cream sm:border-x sm:border-line/60">
      <Teaser id={id} />
      <Toaster />
    </div>
  );
}
