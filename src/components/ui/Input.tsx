import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border-2 border-ink/10 bg-paper-card px-4 py-3 text-base text-ink placeholder:text-ink-soft focus:border-pink focus:outline-none",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-2xl border-2 border-ink/10 bg-paper-card px-4 py-3 text-base text-ink placeholder:text-ink-soft focus:border-pink focus:outline-none resize-none",
        className
      )}
      {...props}
    />
  );
}
