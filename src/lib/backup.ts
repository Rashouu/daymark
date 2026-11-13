import * as db from './db';
import { MOODS } from './moods';
import type { Day, Entry, Photo } from './types';

/** One JSON file with photos embedded as base64. Settings (PIN, location) are not included. */
interface BackupFile {
  app: 'undergrowth'; // the app's original name, kept so older backups still restore
  version: 1;
  exportedAt: number;
  entries: Entry[];
  days: Day[];
  photos: { id: string; type: string; data: string }[];
}

async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

const fromBase64 = (data: string, type: string) => new Blob([Uint8Array.from(atob(data), (c) => c.charCodeAt(0))], { type });

export async function exportBackup(): Promise<Blob> {
  const [entries, days, photos] = await Promise.all([db.getAllEntries(), db.getAllDays(), db.getAllPhotos()]);
  const file: BackupFile = {
    app: 'undergrowth',
    version: 1,
    exportedAt: Date.now(),
    entries,
    days,
    photos: await Promise.all(photos.map(async (p) => ({ id: p.id, type: p.blob.type, data: await toBase64(p.blob) }))),
  };
  return new Blob([JSON.stringify(file)], { type: 'application/json' });
}

const isDate = (s: unknown) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const moodIds = new Set<string>(MOODS.map((m) => m.id));

function isEntry(e: Entry): boolean {
  return (
    typeof e?.id === 'string' &&
    isDate(e.date) &&
    moodIds.has(e.mood) &&
    typeof e.text === 'string' &&
    typeof e.doc === 'object' &&
    Array.isArray(e.photoIds) &&
    typeof e.createdAt === 'number'
  );
}

/** Parses and checks a backup file without touching the diary. Throws a readable message if it's not valid. */
export async function readBackup(file: Blob): Promise<{ entries: Entry[]; days: Day[]; photos: Photo[] }> {
  let data: BackupFile;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error('That file isn’t a Daymark backup.');
  }
  if (data?.app !== 'undergrowth' || !Array.isArray(data.entries) || !Array.isArray(data.days) || !Array.isArray(data.photos)) {
    throw new Error('That file isn’t a Daymark backup.');
  }
  if (!data.entries.every(isEntry) || !data.days.every((d) => isDate(d?.date))) {
    throw new Error('That backup is damaged, so nothing was restored.');
  }
  return {
    entries: data.entries,
    days: data.days,
    photos: data.photos.map((p) => ({ id: p.id, blob: fromBase64(p.data, p.type) })),
  };
}

export async function restoreBackup(parsed: Awaited<ReturnType<typeof readBackup>>) {
  await db.replaceDiary(parsed.entries, parsed.days, parsed.photos);
}

const DAY_MS = 86_400_000;
export const REMINDER_DAYS = 7;

/**
 * Remind when something was written since the last backup and the last backup (or, if there never was one,
 * the first entry) is a week old. Dismissing the reminder quiets it for another week.
 */
export function needsBackupReminder(entries: Entry[], lastBackup: number | undefined, dismissedAt: number | undefined, now = Date.now()) {
  if (!entries.length) return false;
  const latestChange = Math.max(...entries.map((e) => e.updatedAt));
  if (lastBackup && latestChange <= lastBackup) return false;
  const since = Math.max(lastBackup ?? Math.min(...entries.map((e) => e.createdAt)), dismissedAt ?? 0);
  return now - since >= REMINDER_DAYS * DAY_MS;
}
