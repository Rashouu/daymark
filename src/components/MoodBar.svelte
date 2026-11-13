<script lang="ts">
  // Mood counts as a small ink bar chart: stamp, name, bar, count.
  import Stamp from './Stamp.svelte';
  import { moodById } from '../lib/moods';
  import type { MoodId } from '../lib/types';

  let { counts }: { counts: { mood: MoodId; count: number }[] } = $props();
  const total = $derived(counts.reduce((n, c) => n + c.count, 0));
  const most = $derived(Math.max(1, ...counts.map((c) => c.count)));
</script>

<ul>
  {#each counts as c (c.mood)}
    <li>
      <span class="icon"><Stamp mood={c.mood} /></span>
      <span>{moodById(c.mood).label}</span>
      <span class="track" aria-hidden="true"><span class="fill" style:width="{(c.count / most) * 100}%"></span></span>
      <span class="n">{c.count} {c.count === 1 ? 'day' : 'days'}, {Math.round((c.count / total) * 100)}%</span>
    </li>
  {/each}
</ul>

<style>
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
    font-size: 15px;
  }
  li {
    display: grid;
    grid-template-columns: 20px 76px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
  }
  .icon {
    width: 20px;
    height: 20px;
  }
  .track {
    height: 8px;
    border-radius: 4px;
    background: var(--hair);
  }
  .fill {
    display: block;
    height: 100%;
    border-radius: 4px;
    background: var(--ink);
  }
  .n {
    color: var(--stone);
    font-size: 13px;
  }
</style>
