import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const colors = {
  yellow: "bg-yellow",
  pink: "bg-pink-soft",
  mint: "bg-mint",
  lavender: "bg-lavender",
};

export function StickyNote({
  children,
  color = "yellow",
  rotation = -3,
  className,
}: {
  children: ReactNode;
  color?: keyof typeof colors;
  rotation?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "scrapbook-shadow rounded-sm px-4 py-3 font-hand text-lg leading-snug text-ink",
        colors[color],
        className
      )}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {children}
    </div>
  );
}
