"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ShareBar({
  url,
  title,
  text,
}: {
  url: string;
  title: string;
  text?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // user cancelled — fall through to copy
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button variant="pink" onClick={handleShare} className="w-full">
        {copied ? "link copied! 🎉" : "share"}
      </Button>
      <p className="max-w-full truncate text-xs text-ink-soft">{url}</p>
    </div>
  );
}
