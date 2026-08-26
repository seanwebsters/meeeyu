import Image from "next/image";
import { cn } from "@/lib/utils";
import { TapeStrip } from "./TapeStrip";
import type { ReactNode } from "react";

export function Polaroid({
  src,
  alt = "",
  caption,
  rotation = 0,
  size = "md",
  tape = true,
  className,
  fallback,
}: {
  src?: string | null;
  alt?: string;
  caption?: ReactNode;
  rotation?: number;
  size?: "sm" | "md" | "lg";
  tape?: boolean;
  className?: string;
  fallback?: ReactNode;
}) {
  const sizes = {
    sm: "w-28",
    md: "w-40",
    lg: "w-56",
  };

  return (
    <div
      className={cn(
        "scrapbook-shadow relative bg-white p-2.5 pb-4",
        sizes[size],
        className
      )}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {tape && (
        <TapeStrip
          rotation={rotation < 0 ? 6 : -6}
          className="left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
        />
      )}
      <div className="relative aspect-square w-full overflow-hidden bg-paper">
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="220px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-soft via-lavender to-mint text-3xl">
            {fallback ?? "✦"}
          </div>
        )}
      </div>
      {caption && (
        <p className="mt-2 truncate text-center font-hand text-lg text-ink">
          {caption}
        </p>
      )}
    </div>
  );
}
