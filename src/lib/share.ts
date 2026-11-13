import { MOODS } from './moods';
import type { MoodId, WeatherKind } from './types';
import { WEATHER_KINDS } from './weather';

/**
 * A shared month lives entirely in the URL fragment (never sent to any server):
 * "#g=" + YYYYMM + one character per day. Each character packs mood (8 + none) × weather (6 + none) = 63 values.
 * Only moods and weather are shared, never words or photos.
 */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const NO_MOOD = MOODS.length;
const NO_WEATHER = WEATHER_KINDS.length;
const BASE = NO_WEATHER + 1;

export type SharedDay = { mood?: MoodId; weather?: WeatherKind };
export type SharedMonth = { year: number; month: number; days: SharedDay[] };

export function encodeShare({ year, month, days }: SharedMonth): string {
  const chars = days.map((d) => {
    const m = d.mood ? MOODS.findIndex((x) => x.id === d.mood) : NO_MOOD;
    const w = d.weather ? WEATHER_KINDS.indexOf(d.weather) : NO_WEATHER;
    return ALPHABET[m * BASE + w];
  });
  return `g=${year}${String(month + 1).padStart(2, '0')}${chars.join('')}`;
}

export function decodeShare(hash: string): SharedMonth | null {
  const m = /^#?g=(\d{4})(\d{2})([A-Za-z0-9_-]+)$/.exec(hash);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  if (month < 0 || month > 11 || m[3].length !== new Date(year, month + 1, 0).getDate()) return null;
  const days: SharedDay[] = [];
  for (const ch of m[3]) {
    const v = ALPHABET.indexOf(ch);
    const mi = Math.floor(v / BASE);
    const wi = v % BASE;
    if (mi > NO_MOOD) return null;
    days.push({ mood: MOODS[mi]?.id, weather: WEATHER_KINDS[wi] });
  }
  return { year, month, days };
}
