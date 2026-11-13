<script lang="ts">
  import { untrack } from 'svelte';
  import MoodBar from './MoodBar.svelte';
  import Stamp from './Stamp.svelte';
  import { parseISODate, toISODate } from '../lib/dates';
  import { growthStage, growthStart } from '../lib/garden';
  import { breakdown, MIN_DAYS_FOR_PATTERNS, weekdayPatterns, writingStats } from '../lib/insights';
  import { entriesOn, garden, plantedDays } from '../lib/store.svelte';
  import type { ISODate } from '../lib/types';

  let { today, onopenmonth }: { today: ISODate; onopenmonth: (year: number, month: number) => void } = $props();

  const now = $derived(parseISODate(today));
  let year = $state(untrack(() => parseISODate(today).getFullYear()));
  const planted = $derived(plantedDays());
  const moodOn = $derived(new Map(planted.map((d) => [d.date, d.mood])));

  // Newest month on top.
  const months = $derived(
    Array.from({ length: year === now.getFullYear() ? now.getMonth() + 1 : 12 }, (_, m) => m).reverse(),
  );
  const daysIn = (m: number) => Array.from({ length: new Date(year, m + 1, 0).getDate() }, (_, i) => toISODate(new Date(year, m, i + 1)));
  const monthName = (m: number) => new Date(year, m, 1).toLocaleDateString(undefined, { month: 'long' });

  const thisMonth = $derived(breakdown(planted.filter((d) => d.date.startsWith(today.slice(0, 7)))));
  const thisYear = $derived(breakdown(planted.filter((d) => d.date.startsWith(String(year)))));
  const patterns = $derived(weekdayPatterns(planted));
  const stats = $derived(writingStats(garden.entries));
  const n = (x: number) => x.toLocaleString();
</script>

<section>
  <header>
    <h1>{year}</h1>
    <div class="arrows">
      <button aria-label="Previous year" onclick={() => year--}>‹</button>
      {#if year < now.getFullYear()}<button aria-label="Next year" onclick={() => year++}>›</button>{/if}
    </div>
  </header>

  <div class="strata">
    {#each months as m (m)}
      {@const days = daysIn(m)}
      <button
        class="strip"
        aria-label="{monthName(m)}: {days.filter((d) => moodOn.has(d)).length} days written"
        onclick={() => onopenmonth(year, m)}
      >
        <span class="name">{monthName(m)}</span>
        <span class="days">
          {#each days as d (d)}
            {@const mood = moodOn.get(d)}
            <span class="d">{#if mood}<Stamp {mood} stage={growthStage(growthStart(entriesOn(d)))} />{/if}</span>
          {/each}
        </span>
      </button>
    {/each}
  </div>

  {#if thisMonth.length}
    <h2>{now.toLocaleDateString(undefined, { month: 'long' })} so far</h2>
    <MoodBar counts={thisMonth} />
  {/if}
  {#if thisYear.length}
    <h2>Moods in {year}</h2>
    <MoodBar counts={thisYear} />
  {/if}

  <h2>Patterns</h2>
  {#if patterns.length}
    <ul class="patterns">{#each patterns as p (p)}<li>{p}.</li>{/each}</ul>
  {:else if planted.length < MIN_DAYS_FOR_PATTERNS}
    <p class="quiet">Weekday patterns show up after {MIN_DAYS_FOR_PATTERNS} days of writing. You’re at {planted.length}.</p>
  {:else}
    <p class="quiet">No weekday leans strongly toward one mood yet.</p>
  {/if}

  <h2>Writing</h2>
  {#if stats.entries}
    <p>
      {n(stats.entries)} {stats.entries === 1 ? 'entry' : 'entries'} over {n(stats.days)}
      {stats.days === 1 ? 'day' : 'days'}, {n(stats.words)} words in all. Entries average {n(stats.average)} words, and the
      longest ran to {n(stats.longest)}.
    </p>
  {:else}
    <p class="quiet">Your first entry will start the count.</p>
  {/if}
</section>

<style>
  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  h1 {
    font-size: 33px;
  }
  .arrows {
    display: flex;
    gap: 6px;
  }
  .arrows button {
    width: 40px;
    height: 40px;
    border: 2px solid var(--ink);
    border-radius: 6px;
    background: none;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
  }
  .strata {
    padding: 4px 10px 10px;
    border: 2px solid var(--ink);
    border-radius: 10px;
    background: var(--sheet);
  }
  .strip {
    display: block;
    width: 100%;
    padding: 8px 0 0;
    border: 0;
    background: none;
    text-align: left;
    cursor: pointer;
  }
  .name {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 12px;
    color: var(--stone);
  }
  .days {
    display: flex;
    align-items: center;
    height: 20px;
    padding-bottom: 3px;
    border-bottom: 2px solid var(--ink);
  }
  .d {
    flex: 1;
    min-width: 0;
    height: 11px;
  }
  h2 {
    font-size: 22px;
    margin: 32px 0 12px;
  }
  .patterns {
    margin: 0;
    padding-left: 1.2em;
  }
  p {
    margin: 0;
    max-width: 65ch;
  }
  .quiet {
    color: var(--stone);
  }
</style>
