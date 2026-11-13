<script lang="ts">
  import { generateHTML } from '@tiptap/core';
  import Stamp from './Stamp.svelte';
  import PhotoThumb from './PhotoThumb.svelte';
  import { diaryToday, parseISODate } from '../lib/dates';
  import { extensions } from '../lib/editor';
  import { dayMood, growthStage, growthStart } from '../lib/garden';
  import { moodById } from '../lib/moods';
  import { entriesOn, garden, removeEntry, updateDay } from '../lib/store.svelte';
  import { showToast } from '../lib/toast.svelte';
  import type { Entry, ISODate } from '../lib/types';

  let {
    date,
    onback,
    onwrite,
  }: { date: ISODate; onback?: () => void; onwrite: (entry?: Entry) => void } = $props();

  const entries = $derived(entriesOn(date));
  const day = $derived(garden.days[date]);
  const mood = $derived(dayMood(entries, day?.pinnedEntryId));
  // Which entry the day's stamp follows: the pinned one if it still exists, otherwise the latest.
  const sourceId = $derived(
    entries.find((e) => e.id === day?.pinnedEntryId)?.id ?? entries.at(-1)?.id,
  );
  const title = $derived(
    parseISODate(date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  );

  function html(e: Entry) {
    try {
      return generateHTML(e.doc, extensions);
    } catch {
      return '';
    }
  }

  // A backdated entry's clock time says nothing about the day it describes, so hide it.
  function time(e: Entry) {
    const written = new Date(e.createdAt);
    if (diaryToday(written) !== e.date) return '';
    return written.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  async function del(e: Entry) {
    const undo = await removeEntry(e);
    showToast('Entry deleted', { label: 'Undo', run: undo });
  }
</script>

<section>
  {#if onback}<button class="back" onclick={onback}>‹ Back</button>{/if}
  <h1>{title}</h1>

  <div class="plot {day?.weather && entries.length ? `wx-${day.weather}` : ''}">
    {#if mood}<span class="stamp"><Stamp {mood} stage={growthStage(growthStart(entries))} {date} /></span>{/if}
  </div>

  {#each entries as e (e.id)}
    <article>
      <p class="meta">
        {[time(e), moodById(e.mood).label].filter(Boolean).join(', ')}
      </p>
      <div class="prose">{@html html(e)}</div>
      {#if e.photoIds.length}
        <div class="photos">
          {#each e.photoIds as id (id)}<PhotoThumb {id} />{/each}
        </div>
      {/if}
      <div class="actions">
        <button onclick={() => onwrite(e)}>Edit</button>
        <button onclick={() => del(e)}>Delete</button>
        {#if entries.length > 1}
          {#if e.id === sourceId}
            <span>The day’s stamp follows this entry</span>
          {:else}
            <button onclick={() => updateDay(date, { pinnedEntryId: e.id })}>Use this mood for the day’s stamp</button>
          {/if}
        {/if}
      </div>
    </article>
  {:else}
    <p class="empty">Nothing written on this day yet.</p>
  {/each}

  <button class="btn-main write" onclick={() => onwrite()}>{entries.length ? 'Add entry' : 'Write for this day'}</button>
</section>

<style>
  .back {
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    font-size: 15px;
    color: var(--stone);
    cursor: pointer;
  }
  h1 {
    font-size: 28px;
    margin: 4px 0 16px;
  }
  .plot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 112px;
    height: 112px;
    margin: 0 auto 8px;
    border: 2px solid var(--ink);
    border-radius: 10px;
    background-color: var(--sheet);
  }
  .stamp {
    width: 56px;
    height: 56px;
  }
  article {
    padding: 20px 0;
    border-bottom: 0.5px solid var(--hair);
  }
  .meta {
    margin: 0 0 6px;
    font-size: 13px;
    color: var(--stone);
  }
  .photos {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin-top: 12px;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 16px;
    margin-top: 10px;
    font-size: 14px;
    color: var(--stone);
  }
  .actions button {
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--stone);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .empty {
    color: var(--stone);
  }
  .write {
    margin-top: 24px;
  }
</style>
