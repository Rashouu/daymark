<script lang="ts">
  import MonthBed, { type Plot } from './MonthBed.svelte';
  import MoodBar from './MoodBar.svelte';
  import { diaryToday, localeWeekStart, parseISODate } from '../lib/dates';
  import { breakdown } from '../lib/insights';
  import { moodById } from '../lib/moods';
  import type { SharedMonth } from '../lib/share';
  import type { ISODate } from '../lib/types';

  let { shared, hasGarden, onstart }: { shared: SharedMonth; hasGarden: boolean; onstart: () => void } = $props();

  const weekStart = localeWeekStart();
  const monthName = $derived(new Date(shared.year, shared.month, 1).toLocaleDateString(undefined, { month: 'long' }));
  const counts = $derived(
    breakdown(shared.days.flatMap((d, i) => (d.mood ? [{ date: String(i), mood: d.mood }] : []))),
  );

  function plot(date: ISODate): Plot {
    const d = shared.days[Number(date.slice(8)) - 1];
    const label = parseISODate(date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
    return {
      mood: d.mood ?? null,
      stage: 4,
      weather: d.mood ? d.weather : undefined,
      ink: 0,
      label: d.mood ? `${label}: ${moodById(d.mood).label}` : `${label}: no stamp`,
    };
  }
</script>

<section>
  <p class="quiet small">Someone shared a month from their Daymark with you.</p>
  <h1 class="inked">{monthName}</h1>
  <p class="quiet small">{shared.year}</p>

  <MonthBed year={shared.year} month={shared.month} today={diaryToday()} {weekStart} {plot} grow />

  {#if counts.length}
    <div class="legend"><MoodBar {counts} /></div>
  {/if}
  <p class="quiet">
    Each stamp is one day. Its shape shows how the day felt, and the pattern behind it shows that day’s weather.
  </p>
  <button class="btn-main start" onclick={onstart}>{hasGarden ? 'Go to your calendar' : 'Start your own Daymark'}</button>
</section>

<style>
  h1 {
    font-size: 33px;
    margin: 6px 0 0;
  }
  .small {
    font-size: 13px;
    margin: 0 0 10px;
  }
  .legend {
    margin-top: 20px;
  }
  .quiet {
    color: var(--stone);
    font-size: 15px;
    max-width: 65ch;
  }
  .start {
    margin-top: 20px;
  }
</style>
