import { describe, expect, it } from 'vitest';
import { addDays } from './dates';
import { breakdown, onThisDay, weekdayPatterns, writingStats, type DayMood } from './insights';
import type { Entry, MoodId } from './types';

describe('onThisDay', () => {
  it('prefers years over months', () => {
    const written = new Set(['2025-11-14', '2026-10-14']);
    expect(onThisDay('2026-11-14', written)).toEqual({ date: '2025-11-14', ago: 'A year ago today' });
  });
  it('falls back to months', () => {
    expect(onThisDay('2026-11-14', new Set(['2026-09-14']))).toEqual({ date: '2026-09-14', ago: '2 months ago today' });
  });
  it('skips dates that do not exist', () => {
    expect(onThisDay('2026-03-31', new Set(['2026-03-03']))).toBeNull();
  });
});

describe('weekdayPatterns', () => {
  // 5 weeks from Sunday 2026-11-01: Mondays tired, everything else calm.
  const days: DayMood[] = Array.from({ length: 35 }, (_, i) => {
    const date = addDays('2026-11-01', i);
    return { date, mood: (i % 7 === 1 ? 'tired' : 'calm') as MoodId };
  });
  it('finds a weekday that leans one way', () => expect(weekdayPatterns(days)).toEqual(['Mondays lean tired']));
  it('needs four weeks of data', () => expect(weekdayPatterns(days.slice(0, 27))).toEqual([]));
  it('counts moods', () => expect(breakdown(days)).toEqual([{ mood: 'calm', count: 30 }, { mood: 'tired', count: 5 }]));
});

it('sums writing stats without streaks', () => {
  const e = (date: string, text: string) => ({ date, text }) as Entry;
  expect(writingStats([e('2026-11-01', 'a b c'), e('2026-11-01', 'd'), e('2026-11-02', '')])).toEqual({
    entries: 3, days: 2, words: 4, average: 1, longest: 3,
  });
});
