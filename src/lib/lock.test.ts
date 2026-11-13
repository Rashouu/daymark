import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import { changePin, checkAnswer, checkPin, getLock, isValidPin, removeLock, setLock } from './lock';

it('accepts 4 to 6 digit PINs only', () => {
  expect(['1234', '123456'].every(isValidPin)).toBe(true);
  expect(['123', '1234567', '12a4', ''].some(isValidPin)).toBe(false);
});

it('stores hashes, checks PIN and a forgiving answer, and can change or remove the PIN', async () => {
  await setLock('2580', 'First street I lived on?', '  Elm   Street ');
  const lock = (await getLock())!;
  expect(JSON.stringify(lock)).not.toContain('2580');
  expect(JSON.stringify(lock)).not.toMatch(/elm/i);
  expect(await checkPin(lock, '2580')).toBe(true);
  expect(await checkPin(lock, '0000')).toBe(false);
  expect(await checkAnswer(lock, 'elm street')).toBe(true);
  expect(await checkAnswer(lock, 'oak street')).toBe(false);

  await changePin(lock, '1111');
  const changed = (await getLock())!;
  expect(await checkPin(changed, '1111')).toBe(true);
  expect(await checkAnswer(changed, 'ELM STREET')).toBe(true);

  await removeLock();
  expect(await getLock()).toBeUndefined();
});
