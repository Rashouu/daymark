import { describe, expect, it } from 'vitest';
import { dayMood, growthStage, growthStart, wordCount } from './garden';
import type { Entry, MoodId } from './types';

const entry = (id: string, mood: MoodId, createdAt: number): Entry => ({
  id, mood, createdAt, date: '2026-11-14', doc: {}, text: '', photoIds: [], updatedAt: createdAt,
});

describe('dayMood', () => {
  const a = entry('a', 'joyful', 1000);
  const b = entry('b', 'tired', 2000);
  it('is null without entries', () => expect(dayMood([])).toBeNull());
  it('follows the latest entry', () => expect(dayMood([b, a])).toBe('tired'));
  it('follows a pinned entry', () => expect(dayMood([a, b], 'a')).toBe('joyful'));
  it('falls back to latest when the pinned entry is gone', () => expect(dayMood([b], 'a')).toBe('tired'));
});

describe('growth', () => {
  const day = 86_400_000;
  it('starts at the first entry', () => expect(growthStart([entry('b', 'calm', 5), entry('a', 'calm', 3)])).toBe(3));
  it('moves through the stages over 5 days', () => {
    expect(growthStage(0, 0.5 * day)).toBe(1);
    expect(growthStage(0, 2 * day)).toBe(2);
    expect(growthStage(0, 4.9 * day)).toBe(3);
    expect(growthStage(0, 5 * day)).toBe(4);
    expect(growthStage(0, 400 * day)).toBe(4);
  });
});

it('counts words', () => expect(wordCount('  Fixed the\ngate at last. ')).toBe(5));
