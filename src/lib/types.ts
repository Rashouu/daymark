import type { JSONContent } from '@tiptap/core';

export type MoodId = 'joyful' | 'calm' | 'grateful' | 'okay' | 'tired' | 'sad' | 'anxious' | 'angry';
export type WeatherKind = 'clear' | 'cloud' | 'rain' | 'storm' | 'snow' | 'fog';

/** A calendar date in the diary, always local, formatted YYYY-MM-DD. */
export type ISODate = string;

export interface Entry {
  id: string;
  date: ISODate;
  mood: MoodId;
  doc: JSONContent; // editor content
  text: string; // plain text, for search and word counts
  photoIds: string[];
  createdAt: number; // ms epoch; drives growth
  updatedAt: number;
}

export interface Day {
  date: ISODate;
  pinnedEntryId?: string;
  weather?: WeatherKind;
  tempMax?: number; // °C
}

export interface Photo {
  id: string;
  blob: Blob;
}
