import type { MoodId } from './types';

export interface Mood {
  id: MoodId;
  label: string;
  prompts: [string, string, string];
}

export const MOODS: Mood[] = [
  {
    id: 'joyful',
    label: 'Joyful',
    prompts: [
      'What made today feel light?',
      'What do you want to remember about today?',
      'Where did the good part of today come from?',
    ],
  },
  {
    id: 'calm',
    label: 'Calm',
    prompts: [
      'What helped you feel settled today?',
      'Where were you when things felt still?',
      'What could you keep doing that helps you feel like this?',
    ],
  },
  {
    id: 'grateful',
    label: 'Grateful',
    prompts: [
      'Who made today better, and how?',
      'What small thing are you glad happened?',
      'What do you have now that you once hoped for?',
    ],
  },
  {
    id: 'okay',
    label: 'Okay',
    prompts: [
      'What was ordinary about today?',
      'What happened today that you might otherwise forget?',
      'What’s on your mind as the day ends?',
    ],
  },
  {
    id: 'tired',
    label: 'Tired',
    prompts: [
      'What drained you today?',
      'What would real rest look like tomorrow?',
      'What can you let go of tonight?',
    ],
  },
  {
    id: 'sad',
    label: 'Sad',
    prompts: [
      'What’s weighing on you?',
      'What would you say to a friend who felt this way?',
      'What might help, even a little?',
    ],
  },
  {
    id: 'anxious',
    label: 'Anxious',
    prompts: [
      'What’s worrying you, in plain words?',
      'Which part of this is in your control?',
      'What happened the last time you felt like this?',
    ],
  },
  {
    id: 'angry',
    label: 'Angry',
    prompts: [
      'What happened, and what line did it cross?',
      'What do you wish you could say?',
      'What would help this cool down?',
    ],
  },
];

export const moodById = (id: MoodId): Mood => MOODS.find((m) => m.id === id)!;

/** A prompt that stays the same for a given mood on a given date. */
export function promptFor(id: MoodId, date: string): string {
  const day = Number(date.slice(8, 10));
  const prompts = moodById(id).prompts;
  return prompts[day % prompts.length];
}
