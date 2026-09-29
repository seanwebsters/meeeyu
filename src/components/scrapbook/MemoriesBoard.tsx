"use client";

import { useRef, useState } from "react";
import { MemoryPin } from "./MemoryPin";
import type { ProfileCard } from "@/lib/types";
import { cn } from "@/lib/utils";

const PIN_SIZE = 128;
const DRAG_THRESHOLD = 4;

export function MemoriesBoard({
  cards,
  editable = false,
  onMove,
  onMoveEnd,
  onSelect,
  className,
}: {
  cards: ProfileCard[];
  editable?: boolean;
  /** Called continuously while dragging, for live visual feedback only. */
  onMove?: (cardId: string, x: number, y: number) => void;
  /** Called once with the final position when a drag ends — persist here. */
  onMoveEnd?: (cardId: string, x: number, y: number) => void;
  /** Called on a plain tap/click (not a drag) — used to open the editor. */
  onSelect?: (cardId: string) => void;
  className?: string;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    id: string;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    moved: boolean;
    lastX: number;
    lastY: number;
  } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function handlePointerDown(e: React.PointerEvent, card: ProfileCard) {
    if (!editable) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = {
      id: card.id,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      moved: false,
      lastX: card.position_x ?? 50,
      lastY: card.position_y ?? 50,
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId || !boardRef.current) return;

    const dx = e.clientX - d.startClientX;
    const dy = e.clientY - d.startClientY;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    d.moved = true;
    setDraggingId(d.id);

    const rect = boardRef.current.getBoundingClientRect();
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100);
    d.lastX = x;
    d.lastY = y;
    onMove?.(d.id, x, y);
  }

  function handlePointerUp(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    setDraggingId(null);
    if (d.moved) {
      onMoveEnd?.(d.id, d.lastX, d.lastY);
    } else {
      onSelect?.(d.id);
    }
  }

  return (
    <div
      ref={boardRef}
      className={cn(
        "relative w-full touch-none overflow-hidden rounded-3xl border-2 border-dashed border-ink/10 bg-paper-card/40",
        className
      )}
      style={{ minHeight: 420 }}
    >
      {cards.length === 0 && (
        <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-ink-soft">
          {editable ? "add your first memory below" : "no memories pinned yet"}
        </p>
      )}
      {cards.map((card) => (
        <div
          key={card.id}
          onPointerDown={(e) => handlePointerDown(e, card)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute"
          style={{
            left: `${card.position_x ?? 50}%`,
            top: `${card.position_y ?? 50}%`,
            transform: "translate(-50%, -50%)",
            zIndex: draggingId === card.id ? 20 : 1,
            cursor: editable ? (draggingId === card.id ? "grabbing" : "grab") : "default",
          }}
        >
          <MemoryPin card={card} size={PIN_SIZE} dragging={draggingId === card.id} />
        </div>
      ))}
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
