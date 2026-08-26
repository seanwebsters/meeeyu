"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/db/profiles";
import { Button } from "@/components/ui/Button";
import { StepHeader } from "@/components/onboarding/StepHeader";

export default function PhotoStep() {
  const router = useRouter();
  const supabase = createClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(f: File | null) {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleNext() {
    setError(null);
    if (!file) {
      router.push("/onboarding/interests");
      return;
    }
    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("not signed in");

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      await updateProfile(supabase, user.id, { avatar_url: publicUrl });
      router.push("/onboarding/interests");
    } catch (err) {
      setError(err instanceof Error ? err.message : "upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <StepHeader
        step={2}
        total={5}
        title="add a face to the name"
        subtitle="pick a photo that feels like you. you can always change it."
      />
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="scrapbook-shadow relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-pink-soft via-lavender to-mint"
        >
          {preview ? (
            <Image src={preview} alt="your photo" fill className="object-cover" unoptimized />
          ) : (
            <span className="text-4xl">📸</span>
          )}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="text-sm font-semibold text-pink underline"
        >
          {preview ? "choose a different photo" : "upload a photo"}
        </button>
        {error && <p className="text-sm text-pink">{error}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Button onClick={handleNext} disabled={uploading} className="w-full">
          {uploading ? "uploading…" : "next"}
        </Button>
        {!file && (
          <button
            type="button"
            onClick={() => router.push("/onboarding/interests")}
            className="text-center text-sm text-ink-soft underline"
          >
            skip for now
          </button>
        )}
      </div>
    </>
  );
}
