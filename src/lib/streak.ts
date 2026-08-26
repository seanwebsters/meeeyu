const DAY_MS = 24 * 60 * 60 * 1000;

function toDayNumber(iso: string): number {
  return Math.floor(new Date(iso).getTime() / DAY_MS);
}

/**
 * Consecutive days (ending today or yesterday) with at least one activity
 * timestamp. Yesterday still counts as "alive" so the streak doesn't look
 * broken before today is over.
 */
export function computeStreak(activityTimestamps: string[]): number {
  if (activityTimestamps.length === 0) return 0;

  const days = new Set(activityTimestamps.map(toDayNumber));
  const today = Math.floor(Date.now() / DAY_MS);

  let cursor = days.has(today) ? today : today - 1;
  if (!days.has(cursor)) return 0;

  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor--;
  }
  return streak;
}
