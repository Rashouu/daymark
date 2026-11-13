import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import { clearAll, deleteEntry, getAllEntries, getMeta, getPhoto, putEntry, putPhoto, setMeta } from './db';
import type { Entry } from './types';

const e: Entry = {
  id: 'e1', date: '2026-11-14', mood: 'calm', doc: { type: 'doc' }, text: 'hello',
  photoIds: ['p1'], createdAt: 1, updatedAt: 1,
};

it('stores entries and deletes their photos with them', async () => {
  await putEntry(e);
  await putPhoto({ id: 'p1', blob: new Blob(['x']) });
  expect(await getAllEntries()).toEqual([e]);
  await deleteEntry(e);
  expect(await getAllEntries()).toEqual([]);
  expect(await getPhoto('p1')).toBeUndefined();
});

it('stores meta values and clears everything', async () => {
  await setMeta('lastBackup', 42);
  expect(await getMeta<number>('lastBackup')).toBe(42);
  await clearAll();
  expect(await getMeta('lastBackup')).toBeUndefined();
});
