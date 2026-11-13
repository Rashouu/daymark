import { describe, expect, it } from 'vitest';
import { addDays, diaryToday, monthWeeks } from './dates';

describe('diaryToday', () => {
  it('counts 1am as the previous day', () => {
    expect(diaryToday(new Date(2026, 10, 14, 1, 30))).toBe('2026-11-13');
  });
  it('rolls over at 4am', () => {
    expect(diaryToday(new Date(2026, 10, 14, 4, 0))).toBe('2026-11-14');
  });
  it('crosses month and year boundaries', () => {
    expect(diaryToday(new Date(2027, 0, 1, 2, 0))).toBe('2026-12-31');
  });
});

describe('addDays', () => {
  it('handles month ends', () => expect(addDays('2026-02-28', 1)).toBe('2026-03-01'));
});

describe('monthWeeks', () => {
  it('lays out November 2026 with Monday starts', () => {
    const rows = monthWeeks(2026, 10, 1);
    expect(rows[0]).toEqual([null, null, null, null, null, null, '2026-11-01']);
    expect(rows[1][0]).toBe('2026-11-02');
    expect(rows.at(-1)!.at(-1)).toBe(null);
    expect(rows.flat().filter(Boolean)).toHaveLength(30);
  });
  it('lays out November 2026 with Sunday starts', () => {
    expect(monthWeeks(2026, 10, 0)[0][0]).toBe('2026-11-01');
  });
});
