<script lang="ts">
  import Stamp from './Stamp.svelte';
  import { parseISODate } from '../lib/dates';
  import { MOODS, moodById } from '../lib/moods';
  import { garden } from '../lib/store.svelte';
  import type { Entry, ISODate, MoodId } from '../lib/types';

  let { onpick }: { onpick: (d: ISODate) => void } = $props();

  let query = $state('');
  let moods = $state<MoodId[]>([]);
  const LIMIT = 100;

  const q = $derived(query.trim().toLowerCase());
  const results = $derived(
    !q && !moods.length
      ? []
      : garden.entries
          .filter((e) => (!q || e.text.toLowerCase().includes(q)) && (!moods.length || moods.includes(e.mood)))
          .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
  );

  const toggle = (m: MoodId) => (moods = moods.includes(m) ? moods.filter((x) => x !== m) : [...moods, m]);

  /** Text around the first match, split so the match can be marked without injecting HTML. */
  function snippet(e: Entry) {
    const text = e.text.replace(/\s+/g, ' ').trim();
    const i = q ? text.toLowerCase().indexOf(q) : -1;
    if (i < 0) return { before: text.slice(0, 140) + (text.length > 140 ? '…' : ''), match: '', after: '' };
    const start = Math.max(0, i - 60);
    return {
      before: (start ? '…' : '') + text.slice(start, i),
      match: text.slice(i, i + q.length),
      after: text.slice(i + q.length, i + q.length + 80) + (i + q.length + 80 < text.length ? '…' : ''),
    };
  }
</script>

<section>
  <h1>Search</h1>
  <input type="search" bind:value={query} placeholder="A word you wrote" aria-label="Search your entries" />

  <div class="moods" role="group" aria-label="Filter by mood">
    {#each MOODS as m (m.id)}
      <button class:on={moods.includes(m.id)} aria-pressed={moods.includes(m.id)} onclick={() => toggle(m.id)}>
        <span class="pic"><Stamp mood={m.id} stage={moods.includes(m.id) ? 1 : 4} /></span>
        <span class="bar"></span>
        <span class="name">{m.label}</span>
      </button>
    {/each}
  </div>

  {#if !q && !moods.length}
    <p class="quiet">Find an entry by a word you wrote or by how the day felt.</p>
  {:else if !results.length}
    <p class="quiet">No entries match. Try another word or mood.</p>
  {:else}
    <p class="quiet">{results.length} {results.length === 1 ? 'entry' : 'entries'}{results.length > LIMIT ? `, showing the newest ${LIMIT}` : ''}</p>
    <ul>
      {#each results.slice(0, LIMIT) as e (e.id)}
        {@const s = snippet(e)}
        <li>
          <button onclick={() => onpick(e.date)}>
            <span class="date">{parseISODate(e.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span class="mood">{moodById(e.mood).label}</span>
            <span class="text">{s.before}{#if s.match}<mark>{s.match}</mark>{/if}{s.after}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  h1 {
    font-size: 33px;
    margin-bottom: 14px;
  }
  input {
    width: 100%;
    padding: 10px 14px;
    border: 2px solid var(--ink);
    border-radius: 8px;
    background: var(--sheet);
    color: var(--ink);
    font: inherit;
  }
  .moods {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    margin: 14px 0 8px;
  }
  .moods button {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .pic {
    width: 22px;
    height: 22px;
  }
  .bar {
    width: 0;
    height: 3px;
    margin: 5px 0 2px;
    border-radius: 2px;
    background: var(--accent);
    transition: width 160ms ease-out;
  }
  .on .bar {
    width: 18px;
  }
  .name {
    font-size: 11px;
    color: var(--stone);
  }
  .on .name {
    color: var(--ink);
    font-weight: 600;
  }
  .quiet {
    color: var(--stone);
    font-size: 15px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li button {
    display: grid;
    gap: 2px;
    width: 100%;
    padding: 14px 0;
    border: 0;
    border-bottom: 0.5px solid var(--hair);
    background: none;
    text-align: left;
    cursor: pointer;
  }
  .date {
    font-family: var(--font-display);
    font-weight: 800;
    font-stretch: 112%;
    font-size: 16px;
  }
  .mood {
    font-size: 13px;
    color: var(--stone);
  }
  .text {
    font-size: 15px;
    line-height: 1.5;
  }
  mark {
    background: color-mix(in srgb, var(--accent) 28%, transparent);
    color: inherit;
    border-radius: 2px;
  }
</style>
