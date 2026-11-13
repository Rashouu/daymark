import { parseISODate, toISODate } from './dates';
import { wordCount } from './garden';
import { moodById } from './moods';
import type { Entry, ISODate, MoodId } from './types';

/** The most recent earlier date with entries on the same day: years back first, then months. */
export function onThisDay(today: ISODate, written: Set<ISODate>): { date: ISODate; ago: string } | null {
  const t = parseISODate(today);
  const back = (years: number, months: number) => {
    const d = new Date(t.getFullYear() - years, t.getMonth() - months, t.getDate());
    return d.getDate() === t.getDate() ? toISODate(d) : null; // skip e.g. 31 Feb
  };
  for (let y = 1; y <= 10; y++) {
    const d = back(y, 0);
    if (d && written.has(d)) return { date: d, ago: y === 1 ? 'A year ago today' : `${y} years ago today` };
  }
  for (let m = 1; m <= 11; m++) {
    const d = back(0, m);
    if (d && written.has(d)) return { date: d, ago: m === 1 ? 'A month ago today' : `${m} months ago today` };
  }
  return null;
}

export type DayMood = { date: ISODate; mood: MoodId };

/** Mood counts, most common first. */
export function breakdown(days: DayMood[]): { mood: MoodId; count: number }[] {
  const counts = new Map<MoodId, number>();
  for (const d of days) counts.set(d.mood, (counts.get(d.mood) ?? 0) + 1);
  return [...counts].map(([mood, count]) => ({ mood, count })).sort((a, b) => b.count - a.count);
}

export const MIN_DAYS_FOR_PATTERNS = 28;

/**
 * Sentences like "Mondays lean tired". A weekday needs at least 4 written days, and its top mood must
 * cover 40% of them and be 1.5× as common as across all days. Needs 4 weeks of data overall.
 */
export function weekdayPatterns(days: DayMood[]): string[] {
  if (days.length < MIN_DAYS_FOR_PATTERNS) return [];
  const overall = new Map(breakdown(days).map((b) => [b.mood, b.count / days.length]));
  const found: { text: string; share: number }[] = [];
  for (let wd = 0; wd < 7; wd++) {
    const these = days.filter((d) => parseISODate(d.date).getDay() === wd);
    if (these.length < 4) continue;
    const top = breakdown(these)[0];
    const share = top.count / these.length;
    if (share >= 0.4 && share >= 1.5 * overall.get(top.mood)!) {
      // 2026-11-01 is a Sunday.
      const name = new Date(2026, 10, 1 + wd).toLocaleDateString('en', { weekday: 'long' });
      found.push({ text: `${name}s lean ${moodById(top.mood).label.toLowerCase()}`, share });
    }
  }
  return found.sort((a, b) => b.share - a.share).slice(0, 3).map((f) => f.text);
}

export function writingStats(entries: Entry[]) {
  const counts = entries.map((e) => wordCount(e.text));
  const words = counts.reduce((a, b) => a + b, 0);
  return {
    entries: entries.length,
    days: new Set(entries.map((e) => e.date)).size,
    words,
    average: entries.length ? Math.round(words / entries.length) : 0,
    longest: Math.max(0, ...counts),
  };
}
