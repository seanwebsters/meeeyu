import { cn } from "@/lib/utils";

export function PinSticker({
  color = "#ff6f9c",
  className,
}: {
  color?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("absolute h-3.5 w-3.5 rounded-full shadow-md", className)}
      style={{
        background: `radial-gradient(circle at 35% 30%, white, ${color} 60%)`,
      }}
    />
  );
}
