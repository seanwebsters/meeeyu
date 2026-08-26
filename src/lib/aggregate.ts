import type { PromptFriendAnswer } from "@/lib/types";

export interface AggregatedAnswer {
  answer: string;
  count: number;
  percentage: number;
}

/** Groups friend answers for a single prompt by normalized text and returns
 * them ranked by popularity — this is the "YOU" side of ME vs YOU. */
export function aggregateAnswers(
  answers: Pick<PromptFriendAnswer, "answer">[]
): AggregatedAnswer[] {
  if (answers.length === 0) return [];

  const groups = new Map<string, { display: string; count: number }>();
  for (const { answer } of answers) {
    const key = answer.trim().toLowerCase();
    if (!key) continue;
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(key, { display: answer.trim(), count: 1 });
    }
  }

  const total = answers.length;
  return Array.from(groups.values())
    .map(({ display, count }) => ({
      answer: display,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}
