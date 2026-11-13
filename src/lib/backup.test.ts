import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { exportBackup, needsBackupReminder, readBackup, restoreBackup } from './backup';
import * as db from './db';
import type { Entry } from './types';

const entry = (id: string, extra: Partial<Entry> = {}): Entry => ({
  id, date: '2026-11-10', mood: 'calm', doc: { type: 'doc' }, text: 'quiet day', photoIds: [], createdAt: 1, updatedAt: 1, ...extra,
});

describe('backup file', () => {
  it('round-trips entries, days and photo bytes', async () => {
    await db.putEntry(entry('a', { photoIds: ['p'] }));
    await db.putDay({ date: '2026-11-10', weather: 'fog', tempMax: 7 });
    await db.putPhoto({ id: 'p', blob: new Blob([new Uint8Array([1, 2, 250])], { type: 'image/jpeg' }) });
    await db.setMeta('lock', { secret: true });

    const file = await exportBackup();
    expect(await file.text()).not.toContain('secret'); // settings stay out of backups

    await db.putEntry(entry('b')); // something that the restore should replace
    await restoreBackup(await readBackup(file));

    expect((await db.getAllEntries()).map((e) => e.id)).toEqual(['a']);
    expect(await db.getAllDays()).toEqual([{ date: '2026-11-10', weather: 'fog', tempMax: 7 }]);
    const photo = await db.getPhoto('p');
    expect([...new Uint8Array(await photo!.blob.arrayBuffer())]).toEqual([1, 2, 250]);
    expect(await db.getMeta('lock')).toEqual({ secret: true }); // restore keeps settings
  });

  it('rejects files that are not backups', async () => {
    await expect(readBackup(new Blob(['not json']))).rejects.toThrow('isn’t a Daymark backup');
    const bad = { app: 'undergrowth', version: 1, entries: [{ id: 1 }], days: [], photos: [] };
    await expect(readBackup(new Blob([JSON.stringify(bad)]))).rejects.toThrow('damaged');
  });
});

describe('needsBackupReminder', () => {
  const day = 86_400_000;
  const e = [entry('a', { createdAt: 0, updatedAt: 10 * day })];
  it('waits a week after the first entry when there was never a backup', () => {
    expect(needsBackupReminder([entry('a', { createdAt: 0, updatedAt: 0 })], undefined, undefined, 6 * day)).toBe(false);
    expect(needsBackupReminder([entry('a', { createdAt: 0, updatedAt: 0 })], undefined, undefined, 7 * day)).toBe(true);
  });
  it('stays quiet when nothing changed since the backup', () => {
    expect(needsBackupReminder(e, 11 * day, undefined, 30 * day)).toBe(false);
  });
  it('reminds a week after the last backup if there is something new', () => {
    expect(needsBackupReminder(e, 5 * day, undefined, 11 * day)).toBe(false);
    expect(needsBackupReminder(e, 5 * day, undefined, 12 * day)).toBe(true);
  });
  it('is quiet for a week after being dismissed', () => {
    expect(needsBackupReminder(e, 5 * day, 12 * day, 18 * day)).toBe(false);
    expect(needsBackupReminder(e, 5 * day, 12 * day, 19 * day)).toBe(true);
  });
});
