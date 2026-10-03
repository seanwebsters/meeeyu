"use client";

import { useState } from "react";
import { cx, initials } from "@/lib/utils";

interface Props {
  src?: string | null;
  name: string;
  size?: number;
  tone?: string;
  className?: string;
  /** Soft rings radiate out while this person's note is playing. */
  pulse?: boolean;
  ring?: boolean;
  /** Rounded square, for list thumbnails. */
  square?: boolean;
}

export function Avatar({ src, name, size = 40, tone = "#b8a48e", className, pulse, ring, square }: Props) {
  const [failed, setFailed] = useState(false);
  const showImg = src && !failed;
  return (
    <span className={cx("relative inline-flex shrink-0", square ? "rounded-[12px]" : "rounded-full", className)} style={{ width: size, height: size }}>
      {pulse && (
        <>
          <span className="pulse-ring absolute inset-0 rounded-full bg-accent/35" />
          <span className="pulse-ring absolute inset-0 rounded-full bg-accent/25" style={{ animationDelay: "0.6s" }} />
        </>
      )}
      <span
        className={cx(
          "relative inline-flex h-full w-full items-center justify-center overflow-hidden",
          square ? "rounded-[12px]" : "rounded-full",
          ring && "ring-2 ring-cream ring-offset-0",
        )}
        style={{ background: tone }}
      >
        {showImg ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote editorial portraits, sized by CSS
          <img
            src={src}
            alt={name}
            width={size}
            height={size}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover grayscale-[12%] contrast-[1.02]"
          />
        ) : (
          <span className="display text-cream/95 select-none" style={{ fontSize: size * 0.44 }}>
            {initials(name)}
          </span>
        )}
      </span>
    </span>
  );
}

/** Large editorial portrait with a monogram fallback. */
export function Portrait({ src, name, tone = "#b8a48e", className }: { src?: string | null; name: string; tone?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cx("relative overflow-hidden", className)} style={{ background: tone }}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote editorial portraits
        <img src={src} alt={name} onError={() => setFailed(true)} className="h-full w-full object-cover grayscale-[15%]" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="display text-[120px] text-cream/90">{initials(name)}</span>
        </div>
      )}
    </div>
  );
}
