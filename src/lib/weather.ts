import { parseISODate } from './dates';
import type { ISODate, WeatherKind } from './types';

export const WEATHER_KINDS: WeatherKind[] = ['clear', 'cloud', 'rain', 'storm', 'snow', 'fog'];
export const WEATHER_LABEL: Record<WeatherKind, string> = {
  clear: 'Clear', cloud: 'Cloudy', rain: 'Rain', storm: 'Storm', snow: 'Snow', fog: 'Fog',
};

export type Place = { lat: number; lon: number };

/** WMO weather code (as returned by Open-Meteo) to one of the six skies. */
export function kindFromCode(c: number): WeatherKind {
  if (c <= 1) return 'clear';
  if (c <= 3) return 'cloud';
  if (c <= 48) return 'fog';
  if (c >= 95) return 'storm';
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return 'snow';
  return 'rain';
}

/** Asks for the device location once; coordinates are rounded to ~1 km before use. */
export function askPlace(): Promise<Place> {
  return new Promise((res, rej) =>
    navigator.geolocation.getCurrentPosition(
      (p) => res({ lat: +p.coords.latitude.toFixed(2), lon: +p.coords.longitude.toFixed(2) }),
      rej,
      { maximumAge: 3_600_000, timeout: 15_000 },
    ),
  );
}

/** The day's overall weather. The last week comes from the forecast API, older days from the free archive. */
export async function fetchWeather(date: ISODate, { lat, lon }: Place) {
  const daysAgo = (Date.now() - parseISODate(date).getTime()) / 86_400_000;
  // The archive lags about 5 days behind, so only the last week needs the forecast API.
  const host = daysAgo < 7 ? 'https://api.open-meteo.com/v1/forecast' : 'https://archive-api.open-meteo.com/v1/archive';
  const url = `${host}?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max&timezone=auto&start_date=${date}&end_date=${date}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`weather ${res.status}`);
  const daily = (await res.json()).daily;
  const code = daily?.weather_code?.[0];
  if (code == null) throw new Error('no weather for that date');
  return { weather: kindFromCode(code), tempMax: daily.temperature_2m_max?.[0] ?? undefined };
}

/** Temperatures are stored in °C and shown in °F where that is the local convention. */
export function formatTemp(c: number): string {
  let region: string | undefined;
  try {
    region = new Intl.Locale(navigator.language).maximize().region;
  } catch {
    /* unknown locale */
  }
  const f = region === 'US' || region === 'LR' || region === 'MM';
  return `${Math.round(f ? (c * 9) / 5 + 32 : c)}°`;
}
