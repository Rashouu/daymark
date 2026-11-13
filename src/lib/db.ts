import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Day, Entry, Photo } from './types';

interface Schema extends DBSchema {
  entries: { key: string; value: Entry; indexes: { date: string } };
  days: { key: string; value: Day };
  photos: { key: string; value: Photo };
  meta: { key: string; value: unknown };
}

let dbp: Promise<IDBPDatabase<Schema>> | undefined;

function db() {
  dbp ??= openDB<Schema>('undergrowth', 1, {
    upgrade(d) {
      d.createObjectStore('entries', { keyPath: 'id' }).createIndex('date', 'date');
      d.createObjectStore('days', { keyPath: 'date' });
      d.createObjectStore('photos', { keyPath: 'id' });
      d.createObjectStore('meta');
    },
  });
  return dbp;
}

export const getAllEntries = async () => (await db()).getAll('entries');
export const getAllDays = async () => (await db()).getAll('days');
export const putEntry = async (e: Entry) => void (await db()).put('entries', e);
export const putDay = async (d: Day) => void (await db()).put('days', d);
export const getPhoto = async (id: string) => (await db()).get('photos', id);
export const putPhoto = async (p: Photo) => void (await db()).put('photos', p);
export const deletePhoto = async (id: string) => (await db()).delete('photos', id);

/** Deletes an entry and its photos in one transaction. */
export async function deleteEntry(e: Entry) {
  const tx = (await db()).transaction(['entries', 'photos'], 'readwrite');
  await Promise.all([
    tx.objectStore('entries').delete(e.id),
    ...e.photoIds.map((id) => tx.objectStore('photos').delete(id)),
    tx.done,
  ]);
}

export const getMeta = async <T>(key: string) => (await db()).get('meta', key) as Promise<T | undefined>;
export const setMeta = async (key: string, value: unknown) => void (await db()).put('meta', value, key);

/** Replaces all entries, days and photos in one transaction (backup restore). Settings are kept. */
export async function replaceDiary(entries: Entry[], days: Day[], photos: Photo[]) {
  const tx = (await db()).transaction(['entries', 'days', 'photos'], 'readwrite');
  const [es, ds, ps] = [tx.objectStore('entries'), tx.objectStore('days'), tx.objectStore('photos')];
  await Promise.all([es.clear(), ds.clear(), ps.clear()]);
  await Promise.all([...entries.map((e) => es.put(e)), ...days.map((d) => ds.put(d)), ...photos.map((p) => ps.put(p)), tx.done]);
}

export const getAllPhotos = async () => (await db()).getAll('photos');

/** Wipes every store. */
export async function clearAll() {
  const tx = (await db()).transaction(['entries', 'days', 'photos', 'meta'], 'readwrite');
  await Promise.all([...tx.objectStoreNames].map((n) => tx.objectStore(n).clear()).concat(tx.done));
}
