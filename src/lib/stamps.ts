import type { Stage } from './garden';
import type { ISODate, MoodId } from './types';

/** One stamp per mood, drawn in a 40×40 box with currentColor. Static strings, never user input. */
export const STAMPS: Record<MoodId, string> = {
  joyful: `<circle cx="20" cy="20" r="7" fill="currentColor"/><path d="M20 4v6M20 30v6M4 20h6M30 20h6M8.7 8.7l4.2 4.2M27.1 27.1l4.2 4.2M8.7 31.3l4.2-4.2M27.1 12.9l4.2-4.2" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>`,
  calm: `<path d="M5 15c5-5 10 5 15 0s10-5 15 0M5 26c5-5 10 5 15 0s10-5 15 0" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"/>`,
  grateful: `<path d="M20 34C9 26 5 20 5 14.5 5 10 8.5 7 12.5 7c3.3 0 5.7 1.8 7.5 4.6C21.8 8.8 24.2 7 27.5 7 31.5 7 35 10 35 14.5 35 20 31 26 20 34z" fill="currentColor"/>`,
  okay: `<circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" stroke-width="3.2"/><circle cx="20" cy="20" r="5.5" fill="currentColor"/>`,
  tired: `<path d="M25 5A15 15 0 1 0 35 27 12 12 0 0 1 25 5z" fill="currentColor"/>`,
  sad: `<path d="M20 4C14 13 10 19 10 25a10 10 0 0 0 20 0c0-6-4-12-10-21z" fill="currentColor"/>`,
  anxious: `<path d="M4 26l6-12 6 12 6-12 6 12 6-12" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"/>`,
  angry: `<path d="M20 3l3.5 9.5L33 8l-4.5 9.5L37 21l-9.5 3L31 34l-9.5-5L20 37l-2-8-9 5 3.5-10L3 21l8.5-3.5L7 8l9.5 4.5z" fill="currentColor"/>`,
};

/** How wet the ink still is, as a share of the accent color: fresh stamps are accent, dry ones are plain ink. */
const WET: Record<Stage, number> = { 0: 100, 1: 100, 2: 70, 3: 40, 4: 0 };

export function inkColor(stage: Stage): string {
  const wet = WET[stage];
  return wet ? `color-mix(in srgb, var(--accent) ${wet}%, var(--ink))` : 'var(--ink)';
}

/** A small, stable tilt per date (−4° to 4°) so stamps look pressed by hand. */
export function tilt(date: ISODate): number {
  let h = 0;
  for (const c of date) h = (h * 31 + c.charCodeAt(0)) % 997;
  return (h % 9) - 4;
}
