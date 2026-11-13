import type { ISODate } from './types';

/** Hour before which an entry still belongs to the previous diary day. */
export const ROLLOVER_HOUR = 4;

const pad = (n: number) => String(n).padStart(2, '0');

export const toISODate = (d: Date): ISODate =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseISODate = (s: ISODate): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (s: ISODate, n: number): ISODate => {
  const d = parseISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
};

/** Today's diary date: before 4am it is still "yesterday". */
export function diaryToday(now = new Date()): ISODate {
  const d = new Date(now);
  if (d.getHours() < ROLLOVER_HOUR) d.setDate(d.getDate() - 1);
  return toISODate(d);
}

/** First day of the week as a JS weekday (0 = Sunday), from the browser locale; Monday if unknown. */
export function localeWeekStart(): number {
  try {
    const loc = new Intl.Locale(navigator.language) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    if (info) return info.firstDay % 7;
  } catch {
    /* unsupported: fall through */
  }
  return 1;
}

/** Rows of 7 dates for a month (month is 0-based); days outside the month are null. */
export function monthWeeks(year: number, month: number, weekStart: number): (ISODate | null)[][] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() - weekStart + 7) % 7;
  const cells: (ISODate | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toISODate(new Date(year, month, d)));
  while (cells.length % 7) cells.push(null);
  const rows: (ISODate | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}
