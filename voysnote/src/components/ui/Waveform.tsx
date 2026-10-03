"use client";

import { useRef } from "react";
import { cx } from "@/lib/utils";

interface Props {
  data: number[];
  /** 0..1 */
  progress: number;
  playing?: boolean;
  onSeek?: (fraction: number) => void;
  height?: number;
  className?: string;
  tone?: "ink" | "cream";
  blurred?: boolean;
}

export function Waveform({ data, progress, playing, onSeek, height = 30, className, tone = "ink", blurred }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const seekFrom = (clientX: number) => {
    const el = ref.current;
    if (!el || !onSeek) return;
    const r = el.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(1, (clientX - r.left) / r.width)));
  };

  const played = tone === "ink" ? "bg-ink" : "bg-cream";
  const rest = tone === "ink" ? "bg-stone-2/70" : "bg-cream/35";

  return (
    <div
      ref={ref}
      role={onSeek ? "slider" : undefined}
      aria-label={onSeek ? "Seek" : undefined}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      tabIndex={onSeek ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onSeek) return;
        if (e.key === "ArrowRight") onSeek(Math.min(1, progress + 0.1));
        if (e.key === "ArrowLeft") onSeek(Math.max(0, progress - 0.1));
      }}
      onPointerDown={(e) => {
        if (!onSeek) return;
        e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        seekFrom(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.buttons === 1) seekFrom(e.clientX);
      }}
      className={cx("flex w-full touch-none items-center gap-[2.5px]", onSeek && "cursor-pointer", blurred && "blur-[3px] opacity-60", className)}
      style={{ height }}
    >
      {data.map((v, i) => {
        const done = (i + 0.5) / data.length <= progress;
        return (
          <span
            key={i}
            className={cx("min-w-[2px] flex-1 rounded-full transition-colors duration-150", done ? played : rest, playing && "wave-live")}
            style={{
              height: `${Math.max(12, v * 100)}%`,
              animationDelay: playing ? `${(i % 7) * 0.11}s` : undefined,
              animationDuration: playing ? `${0.7 + (i % 5) * 0.12}s` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
