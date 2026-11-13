<script lang="ts">
  import { dayMood } from '../lib/garden';
  import { onThisDay } from '../lib/insights';
  import { moodById } from '../lib/moods';
  import { entriesOn, garden } from '../lib/store.svelte';
  import type { ISODate } from '../lib/types';

  let { today, onpick }: { today: ISODate; onpick: (d: ISODate) => void } = $props();

  const found = $derived(onThisDay(today, new Set(garden.entries.map((e) => e.date))));
  const memory = $derived.by(() => {
    if (!found) return null;
    const entries = entriesOn(found.date);
    const mood = dayMood(entries, garden.days[found.date]?.pinnedEntryId)!;
    const text = (entries.find((e) => e.text.trim())?.text ?? '').replace(/\s+/g, ' ').trim();
    return { feeling: moodById(mood).label.toLowerCase(), quote: text.length > 140 ? text.slice(0, 140) + '…' : text };
  });
</script>

{#if found && memory}
  <button onclick={() => onpick(found.date)}>
    <span>{found.ago} you felt {memory.feeling}.</span>
    {#if memory.quote}<q>{memory.quote}</q>{/if}
  </button>
{/if}

<style>
  button {
    display: grid;
    gap: 2px;
    width: 100%;
    margin-top: 16px;
    padding: 0;
    border: 0;
    background: none;
    text-align: left;
    font-size: 15px;
    line-height: 1.55;
    cursor: pointer;
  }
  q {
    font-style: italic;
    color: var(--stone);
  }
</style>
