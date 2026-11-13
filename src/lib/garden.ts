import type { Entry, MoodId } from './types';

export const GROW_DAYS = 5;
const DAY_MS = 86_400_000;

/** 1 sprout, 2 leafy stem, 3 bud, 4 bloom. Stage 0 (seed) only exists during the planting animation. */
export type Stage = 0 | 1 | 2 | 3 | 4;

/** The day's plant follows the pinned entry if it still exists, otherwise the latest entry. */
export function dayMood(entries: Entry[], pinnedEntryId?: string): MoodId | null {
  if (!entries.length) return null;
  const pinned = pinnedEntryId && entries.find((e) => e.id === pinnedEntryId);
  if (pinned) return pinned.mood;
  return entries.reduce((a, b) => (b.createdAt > a.createdAt ? b : a)).mood;
}

/** Growth starts when the day's first entry was written, whatever date it is filed under. */
export const growthStart = (entries: Entry[]): number => Math.min(...entries.map((e) => e.createdAt));

export function growthStage(start: number, now = Date.now()): Stage {
  const days = (now - start) / DAY_MS;
  if (days < 1) return 1;
  if (days < 2.5) return 2;
  if (days < GROW_DAYS) return 3;
  return 4;
}

export const wordCount = (text: string): number => text.split(/\s+/).filter(Boolean).length;
