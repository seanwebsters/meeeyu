import type { CardType, ProfileCard } from "@/lib/types";
import { Polaroid } from "./Polaroid";
import { StickyNote } from "./StickyNote";
import { TornPaper } from "./TornPaper";
import { PinSticker } from "./PinSticker";

export const CARD_META: Record<
  CardType,
  { icon: string; label: string; note: "sticky" | "paper" | "photo" }
> = {
  photo: { icon: "🖼️", label: "photo", note: "photo" },
  music: { icon: "🎵", label: "on repeat", note: "paper" },
  film: { icon: "🎬", label: "favourite film", note: "paper" },
  place: { icon: "📍", label: "favourite place", note: "paper" },
  book: { icon: "📖", label: "favourite book", note: "paper" },
  food: { icon: "🍜", label: "favourite food", note: "paper" },
  quote: { icon: "✏️", label: "quote", note: "sticky" },
  fact: { icon: "✦", label: "random fact", note: "sticky" },
  mood: { icon: "🌤️", label: "currently feeling", note: "sticky" },
  obsession: { icon: "🔥", label: "current obsession", note: "sticky" },
  person: { icon: "🫶", label: "person", note: "paper" },
  thing: { icon: "🧸", label: "thing", note: "paper" },
  outfit: { icon: "👕", label: "outfit", note: "paper" },
  memory: { icon: "📼", label: "memory", note: "paper" },
  custom: { icon: "✨", label: "", note: "paper" },
};

const stickyColors = ["yellow", "pink", "mint", "lavender"] as const;

export function CardTile({
  card,
  rotation,
}: {
  card: ProfileCard;
  rotation: number;
}) {
  const meta = CARD_META[card.type];

  if (card.type === "photo") {
    return (
      <Polaroid
        src={card.content.url}
        caption={card.title}
        rotation={rotation}
        fallback={meta.icon}
      />
    );
  }

  if (meta.note === "sticky") {
    const color =
      stickyColors[Math.floor(Math.abs(rotation * 7)) % stickyColors.length];
    return (
      <StickyNote color={color} rotation={rotation} className="w-44">
        <span className="mb-1 block text-xs uppercase tracking-wide text-ink-soft not-italic">
          {meta.icon} {card.title || meta.label}
        </span>
        {card.content.text}
      </StickyNote>
    );
  }

  return (
    <TornPaper rotation={rotation} className="relative w-48">
      <PinSticker className="left-1/2 top-1 -translate-x-1/2" />
      <span className="mb-1 block text-xs uppercase tracking-wide text-ink-soft">
        {meta.icon} {meta.label}
      </span>
      <p className="font-semibold leading-snug">
        {card.title || card.content.text}
      </p>
      {card.content.subtitle && (
        <p className="mt-0.5 text-sm text-ink-soft">{card.content.subtitle}</p>
      )}
      {card.title && card.content.text && (
        <p className="mt-1 text-sm text-ink-soft">{card.content.text}</p>
      )}
    </TornPaper>
  );
}
