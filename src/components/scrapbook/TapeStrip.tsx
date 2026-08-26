import { cn } from "@/lib/utils";

const colors = {
  cream: "bg-[#f2ead6]/80",
  pink: "bg-pink-soft/80",
  mint: "bg-mint/70",
};

export function TapeStrip({
  color = "cream",
  className,
  rotation = -4,
}: {
  color?: keyof typeof colors;
  className?: string;
  rotation?: number;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute h-6 w-16 shadow-sm backdrop-blur-[1px]",
        colors[color],
        className
      )}
      style={{
        transform: `rotate(${rotation}deg)`,
        clipPath:
          "polygon(2% 10%, 98% 0%, 100% 88%, 0% 100%)",
      }}
    />
  );
}
