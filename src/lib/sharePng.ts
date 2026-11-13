import { monthWeeks } from './dates';
import type { SharedMonth } from './share';
import { STAMPS, tilt } from './stamps';
import type { WeatherKind } from './types';

const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** The faint printed weather pattern behind a day, drawn straight onto the canvas. Clear stays blank. */
function weatherPattern(g: CanvasRenderingContext2D, kind: WeatherKind, x: number, y: number, w: number, h: number) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.fillStyle = g.strokeStyle = token('--pat');
  g.lineWidth = 2;
  const dots = (step: number, r: number, ring = false) => {
    for (let i = x; i < x + w; i += step)
      for (let j = y; j < y + h; j += step) {
        g.beginPath();
        g.arc(i + step / 2, j + step / 2, r, 0, Math.PI * 2);
        if (ring) g.stroke();
        else g.fill();
      }
  };
  const lines = (step: number, slant: number) => {
    for (let i = x - h; i < x + w + h; i += step) {
      g.beginPath();
      g.moveTo(i, y + h);
      g.lineTo(i + slant * h, y);
      g.stroke();
    }
  };
  if (kind === 'cloud') dots(14, 2.4);
  if (kind === 'rain') lines(14, 0.45);
  if (kind === 'storm') (dots(12, 3), lines(12, 0.45));
  if (kind === 'snow') dots(20, 3.5, true);
  if (kind === 'fog') for (let j = y + 6; j < y + h; j += 12) g.fillRect(x, j, w, 2);
  g.restore();
}

/**
 * Draws a shared month as a PNG in the current theme. Text, the calendar window and the weather patterns go
 * straight onto the canvas (so the web fonts are used); the stamps are one SVG image layered on top.
 */
export async function renderSharePng(m: SharedMonth, weekStart: number): Promise<Blob> {
  const rows = monthWeeks(m.year, m.month, weekStart);
  const W = 1080;
  const PAD = 80;
  const INSET = 20; // inside the calendar window
  const COL = (W - 2 * PAD - 2 * INSET) / 7;
  const PANE = 112;
  const ROW = PANE + 46;
  const TOP = 330;
  const H = TOP + rows.length * ROW + 150;

  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  await Promise.all([document.fonts.load('800 96px "Archivo Variable"'), document.fonts.load('28px "Newsreader Variable"')]);
  if ('fontStretch' in g) g.fontStretch = 'extra-expanded';

  g.fillStyle = token('--sky');
  g.fillRect(0, 0, W, H);

  // Title, printed slightly off-register over a copy in wet ink.
  const title = new Date(m.year, m.month, 1).toLocaleDateString(undefined, { month: 'long' });
  g.font = '800 96px "Archivo Variable"';
  g.fillStyle = token('--accent');
  g.fillText(title, PAD + 6, 186);
  g.fillStyle = token('--ink');
  g.fillText(title, PAD, 180);
  g.fillStyle = token('--stone');
  g.font = '34px "Newsreader Variable"';
  g.fillText(String(m.year), PAD, 236);

  // Calendar window.
  g.fillStyle = token('--sheet');
  g.strokeStyle = token('--ink');
  g.lineWidth = 5;
  g.beginPath();
  g.roundRect(PAD, TOP - 64, W - 2 * PAD, rows.length * ROW + 80, 24);
  g.fill();
  g.stroke();

  g.textAlign = 'center';
  g.font = '700 26px "Archivo Variable"';
  g.fillStyle = token('--stone');
  for (let i = 0; i < 7; i++) {
    const name = new Date(2026, 10, 1 + weekStart + i).toLocaleDateString(undefined, { weekday: 'narrow' });
    g.fillText(name, PAD + INSET + i * COL + COL / 2, TOP - 22);
  }

  const ink = token('--ink');
  let stamps = '';
  rows.forEach((row, r) =>
    row.forEach((date, i) => {
      if (!date) return;
      const d = m.days[Number(date.slice(8)) - 1];
      const x = PAD + INSET + i * COL;
      const y = TOP + r * ROW;
      if (d.mood && d.weather) weatherPattern(g, d.weather, x + 3, y, COL - 6, PANE);
      g.fillStyle = token('--stone');
      g.font = '600 26px "Archivo Variable"';
      g.fillText(String(Number(date.slice(8))), x + COL / 2, y + PANE + 34);
      if (d.mood) {
        const s = 64;
        stamps += `<svg x="${x + (COL - s) / 2}" y="${y + (PANE - s) / 2}" width="${s}" height="${s}" viewBox="0 0 40 40" style="color:${ink};overflow:visible"><g transform="rotate(${tilt(date)} 20 20)">${STAMPS[d.mood]}</g></svg>`;
      }
    }),
  );

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${stamps}</svg>`;
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  g.drawImage(img, 0, 0);

  g.textAlign = 'left';
  g.fillStyle = token('--stone');
  g.font = '28px "Newsreader Variable"';
  g.fillText('Made with Daymark', PAD, H - 50);

  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('encode failed'))), 'image/png'));
}
