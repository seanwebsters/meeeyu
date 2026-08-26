export function StreakBadge({ days }: { days: number }) {
  if (days < 1) return null;

  return (
    <div
      className="scrapbook-shadow inline-flex items-center gap-1.5 rounded-full bg-paper-card px-3.5 py-1.5 text-sm font-semibold"
      style={{ transform: "rotate(-2deg)" }}
      title={`${days} day${days === 1 ? "" : "s"} of you and your friends keeping this meeeyu alive`}
    >
      <span>🔥</span>
      <span>
        {days} day{days === 1 ? "" : "s"} streak
      </span>
    </div>
  );
}
