import { getMeta, setMeta } from './db';

/** A PIN gate, not encryption: it keeps casual eyes out on a shared device. */
export interface Lock {
  salt: string;
  pinHash: string;
  question: string;
  answerHash: string;
}

export const AUTO_LOCK_MS = 5 * 60_000;
export const isValidPin = (pin: string) => /^\d{4,6}$/.test(pin);
/** Answers ignore capital letters and extra spaces. */
export const normalizeAnswer = (a: string) => a.trim().toLowerCase().replace(/\s+/g, ' ');

async function hash(value: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${value}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const getLock = () => getMeta<Lock>('lock');

export async function setLock(pin: string, question: string, answer: string) {
  const salt = crypto.randomUUID();
  const lock: Lock = {
    salt,
    pinHash: await hash(pin, salt),
    question: question.trim(),
    answerHash: await hash(normalizeAnswer(answer), salt),
  };
  await setMeta('lock', lock);
}

/** Keeps the question and answer, swaps the PIN (used after a correct security answer). */
export async function changePin(lock: Lock, pin: string) {
  await setMeta('lock', { ...lock, pinHash: await hash(pin, lock.salt) });
}

export const removeLock = () => setMeta('lock', undefined);
export const checkPin = async (lock: Lock, pin: string) => (await hash(pin, lock.salt)) === lock.pinHash;
export const checkAnswer = async (lock: Lock, answer: string) =>
  (await hash(normalizeAnswer(answer), lock.salt)) === lock.answerHash;
