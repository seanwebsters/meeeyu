import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function TornPaper({
  children,
  rotation = 0,
  className,
}: {
  children: ReactNode;
  rotation?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "torn-edge scrapbook-shadow bg-paper-card px-5 py-6",
        className
      )}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {children}
    </div>
  );
}
