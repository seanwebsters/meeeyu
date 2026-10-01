"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ShareImageButton({
  imageUrl,
  fileName,
  title,
  text,
  label = "share as image",
}: {
  imageUrl: string;
  fileName: string;
  title: string;
  text?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function handleShare() {
    setBusy(true);
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: "image/png" });

      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, text });
        return;
      }

      // Fallback: open the image in a new tab so it can be long-pressed /
      // right-clicked to save, since direct file sharing isn't supported here.
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch {
      // user cancelled the share sheet, or the fetch failed — either way,
      // nothing more to do here.
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="secondary" onClick={handleShare} disabled={busy} className="w-full">
      {busy ? "preparing…" : label}
    </Button>
  );
}
