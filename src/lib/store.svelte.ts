import * as db from './db';
import { dayMood } from './garden';
import type { DayMood } from './insights';
import type { Day, Entry, ISODate } from './types';

/** In-memory copy of the diary. One person's diary is small enough to hold whole. */
export const garden = $state({
  entries: [] as Entry[],
  days: {} as Record<ISODate, Day>,
  ready: false,
});

export async function load() {
  const [entries, days] = await Promise.all([db.getAllEntries(), db.getAllDays()]);
  garden.entries = entries;
  garden.days = Object.fromEntries(days.map((d) => [d.date, d]));
  garden.ready = true;
}

export const entriesOn = (date: ISODate): Entry[] =>
  garden.entries.filter((e) => e.date === date).sort((a, b) => a.createdAt - b.createdAt);

/** Every date with a plant, and that plant's mood. */
export function plantedDays(): DayMood[] {
  const byDate = new Map<ISODate, Entry[]>();
  for (const e of garden.entries) byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]);
  return [...byDate].map(([date, es]) => ({ date, mood: dayMood(es, garden.days[date]?.pinnedEntryId)! }));
}

export async function saveEntry(e: Entry) {
  await db.putEntry(e);
  // Ask the browser not to evict the diary under storage pressure (granted silently or remembered).
  navigator.storage?.persist?.();
  const i = garden.entries.findIndex((x) => x.id === e.id);
  if (i >= 0) garden.entries[i] = e;
  else garden.entries.push(e);
}

/** Deletes an entry right away and returns an undo that restores it with its photos. */
export async function removeEntry(e: Entry): Promise<() => Promise<void>> {
  const entry = $state.snapshot(e);
  const photos = (await Promise.all(entry.photoIds.map(db.getPhoto))).filter((p) => p !== undefined);
  await db.deleteEntry(entry);
  garden.entries = garden.entries.filter((x) => x.id !== entry.id);
  return async () => {
    await Promise.all(photos.map(db.putPhoto));
    await saveEntry(entry);
  };
}

export async function updateDay(date: ISODate, patch: Partial<Day>) {
  const day = { ...$state.snapshot(garden.days[date] ?? { date }), ...patch };
  await db.putDay(day);
  garden.days[date] = day;
}
