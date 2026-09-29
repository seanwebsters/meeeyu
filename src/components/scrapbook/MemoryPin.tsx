import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ProfileCard } from "@/lib/types";

export function MemoryPin({
  card,
  size = 128,
  dragging = false,
}: {
  card: ProfileCard;
  size?: number;
  dragging?: boolean;
}) {
  const friends = card.content.tagged_friends ?? [];

  return (
    <div
      className={cn(
        "scrapbook-shadow select-none bg-white p-2 pb-3",
        dragging && "shadow-2xl"
      )}
      style={{ width: size, transform: `rotate(${card.rotation}deg)` }}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-paper">
        {card.content.url ? (
          <Image
            src={card.content.url}
            alt={card.title ?? "memory"}
            fill
            sizes="200px"
            className="pointer-events-none object-cover"
            unoptimized
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">📼</div>
        )}
      </div>
      {card.title && (
        <p className="mt-1.5 truncate text-center font-hand text-sm text-ink">{card.title}</p>
      )}
      {friends.length > 0 && (
        <p className="mt-0.5 truncate text-center text-[10px] text-ink-soft">
          with {friends.map((f) => `@${f.username}`).join(", ")}
        </p>
      )}
    </div>
  );
}
