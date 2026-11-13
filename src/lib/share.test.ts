import { expect, it } from 'vitest';
import { decodeShare, encodeShare, type SharedDay } from './share';

const days: SharedDay[] = Array.from({ length: 30 }, (_, i) =>
  i % 5 === 0 ? {} : { mood: i % 2 ? 'joyful' : 'angry', weather: i % 3 ? 'rain' : undefined },
);

it('round-trips a month through the URL fragment', () => {
  const hash = encodeShare({ year: 2026, month: 10, days });
  expect(hash).toMatch(/^g=202611[A-Za-z0-9_-]{30}$/);
  expect(decodeShare('#' + hash)).toEqual({ year: 2026, month: 10, days });
});

it('rejects malformed or mismatched links', () => {
  expect(decodeShare('#g=202611abc')).toBeNull(); // wrong day count
  expect(decodeShare('#g=202613' + 'A'.repeat(31))).toBeNull(); // no month 13
  expect(decodeShare('#other')).toBeNull();
});
