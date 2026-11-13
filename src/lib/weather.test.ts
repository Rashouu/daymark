import { expect, it } from 'vitest';
import { kindFromCode } from './weather';

it('maps WMO codes to the six skies', () => {
  const cases: [number, string][] = [
    [0, 'clear'], [1, 'clear'], [2, 'cloud'], [3, 'cloud'], [45, 'fog'], [48, 'fog'],
    [51, 'rain'], [65, 'rain'], [81, 'rain'], [71, 'snow'], [77, 'snow'], [86, 'snow'],
    [95, 'storm'], [99, 'storm'],
  ];
  for (const [code, kind] of cases) expect(kindFromCode(code), String(code)).toBe(kind);
});
