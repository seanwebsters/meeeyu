import type { ReactNode } from "react";

export function ScrapbookCanvas({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-x-5 gap-y-8 px-4 py-6">
      {children}
    </div>
  );
}
