<script lang="ts">
  import type { JSONContent } from '@tiptap/core';
  import { onMount, untrack } from 'svelte';
  import Editor from './Editor.svelte';
  import Stamp from './Stamp.svelte';
  import WeatherRow from './WeatherRow.svelte';
  import * as db from '../lib/db';
  import { MOODS, promptFor } from '../lib/moods';
  import { MAX_PHOTOS, shrink } from '../lib/photos';
  import { entriesOn, saveEntry } from '../lib/store.svelte';
  import type { Entry, ISODate, MoodId } from '../lib/types';

  let {
    date: startDate,
    today,
    entry,
    onclose,
  }: {
    date: ISODate;
    today: ISODate;
    entry?: Entry;
    onclose: (saved?: { date: ISODate; planted: boolean }) => void;
  } = $props();

  let date = $state(untrack(() => startDate));
  let mood = $state<MoodId | undefined>(untrack(() => entry?.mood));
  let doc = $state.raw<JSONContent | undefined>(untrack(() => entry?.doc));
  let text = $state(untrack(() => entry?.text ?? ''));
  let photos = $state<{ id: string; url: string; blob?: Blob }[]>([]);
  let dirty = $state(false);
  let error = $state('');
  let saving = $state(false);
  let leaving = $state(false);
  let dialog: HTMLDialogElement;
  let fileInput: HTMLInputElement;

  const firstOfDay = $derived(!entry && entriesOn(date).length === 0);
  const saveLabel = $derived(firstOfDay ? 'Stamp the day' : 'Save entry');
  const heading = $derived(date === today ? 'How did today feel?' : 'How did this day feel?');

  onMount(() => {
    dialog.showModal();
    dialog.focus(); // focus the sheet itself rather than ringing the Close button
    for (const id of entry?.photoIds ?? []) {
      db.getPhoto(id).then((p) => p && photos.push({ id, url: URL.createObjectURL(p.blob) }));
    }
    return () => photos.forEach((p) => URL.revokeObjectURL(p.url));
  });

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    if (files.length > room) error = `Each entry can hold up to ${MAX_PHOTOS} photos.`;
    for (const file of [...files].slice(0, room)) {
      try {
        const blob = await shrink(file);
        photos.push({ id: crypto.randomUUID(), url: URL.createObjectURL(blob), blob });
        dirty = true;
      } catch {
        error = 'That photo couldn’t be read. Try a JPEG or PNG.';
      }
    }
    fileInput.value = '';
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(photos[i].url);
    photos.splice(i, 1);
    dirty = true;
  }

  async function save() {
    if (!mood) return void (error = 'Pick how the day felt first.');
    if (!date || date > today) return void (error = 'Pick today or an earlier date.');
    saving = true;
    const planted = firstOfDay;
    const kept = new Set(photos.map((p) => p.id));
    await Promise.all([
      ...photos.filter((p) => p.blob).map((p) => db.putPhoto({ id: p.id, blob: p.blob! })),
      ...(entry?.photoIds ?? []).filter((id) => !kept.has(id)).map(db.deletePhoto),
    ]);
    const now = Date.now();
    await saveEntry({
      id: entry?.id ?? crypto.randomUUID(),
      date,
      mood,
      doc: doc ?? { type: 'doc', content: [] },
      text,
      photoIds: [...kept],
      createdAt: entry?.createdAt ?? now,
      updatedAt: now,
    });
    leaving = true; // the sheet drops away before the planting plays
    await new Promise((r) => setTimeout(r, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 260));
    dialog.close();
    onclose({ date, planted });
  }

  function close() {
    if (dirty && !confirm('Discard this entry?')) return;
    dialog.close();
    onclose();
  }
</script>

<dialog
  bind:this={dialog}
  class:leaving
  tabindex="-1"
  aria-label="Write an entry"
  oncancel={(e) => {
    e.preventDefault();
    close();
  }}
>
  <div class="top">
    <button class="quiet" onclick={close}>Close</button>
    <input type="date" bind:value={date} max={today} aria-label="Entry date" oninput={() => (dirty = true)} />
  </div>

  <h2>{heading}</h2>
  <div class="moods">
    {#each MOODS as m (m.id)}
      <button
        class="mood"
        class:on={mood === m.id}
        aria-pressed={mood === m.id}
        onclick={() => {
          mood = m.id;
          dirty = true;
          error = '';
        }}
      >
        <!-- The chosen stamp shows in wet ink. -->
        <span class="pic"><Stamp mood={m.id} stage={mood === m.id ? 1 : 4} /></span>
        <span class="bar"></span>
        <span class="name">{m.label}</span>
      </button>
    {/each}
  </div>

  <WeatherRow {date} />

  <div class="writing">
    {#if mood}<p class="prompt">{promptFor(mood, date)}</p>{/if}
    <Editor
      doc={entry?.doc}
      onchange={(d, t) => {
        doc = d;
        text = t;
        dirty = true;
      }}
    />
    {#if photos.length}
      <div class="photos">
        {#each photos as p, i (p.id)}
          <div class="photo">
            <img src={p.url} alt="" />
            <button class="remove" aria-label="Remove photo {i + 1}" onclick={() => removePhoto(i)}>×</button>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  {#if error}<p class="error" role="alert">{error}</p>{/if}
  <div class="foot">
    {#if photos.length < MAX_PHOTOS}
      <button class="quiet" onclick={() => fileInput.click()}>Add photo</button>
    {:else}
      <span></span>
    {/if}
    <input
      type="file"
      accept="image/*"
      multiple
      hidden
      bind:this={fileInput}
      onchange={(e) => addPhotos(e.currentTarget.files)}
    />
    <button class="btn-main save" onclick={save} disabled={saving}>
      {saveLabel}
    </button>
  </div>
</dialog>

<style>
  dialog {
    width: 100%;
    max-width: 680px;
    height: 94dvh;
    max-height: none;
    margin: auto auto 0;
    padding: 8px var(--gutter) calc(16px + env(safe-area-inset-bottom));
    border: 0;
    border-radius: 22px 22px 0 0;
    background: var(--sheet);
    color: var(--ink);
    box-shadow: 0 -8px 32px rgb(22 25 37 / 0.2);
  }
  dialog[open] {
    display: flex;
    flex-direction: column;
  }
  dialog:focus {
    outline: none;
  }
  dialog.leaving {
    transform: translateY(100%);
    transition: transform 260ms cubic-bezier(0.4, 0, 1, 1);
  }
  dialog.leaving::backdrop {
    opacity: 0;
    transition: opacity 260ms;
  }
  dialog::backdrop {
    background: rgb(22 25 37 / 0.5);
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .quiet {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    font-size: 15px;
    color: var(--stone);
    cursor: pointer;
  }
  input[type='date'] {
    font: inherit;
    font-size: 15px;
    color: var(--ink);
    background: none;
    border: 0;
    text-align: right;
  }
  h2 {
    font-size: 22px;
    margin: 8px 0 10px;
  }
  .moods {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px 0;
  }
  .mood {
    border: 0;
    background: none;
    padding: 2px 0;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .pic {
    height: 34px;
    width: 34px;
    margin-top: 6px;
  }
  .bar {
    height: 3px;
    width: 0;
    margin: 5px 0 2px;
    border-radius: 2px;
    background: var(--accent);
    transition: width 160ms ease-out;
  }
  .on .bar {
    width: 22px;
  }
  .name {
    font-size: 12px;
    color: var(--stone);
  }
  .on .name {
    color: var(--ink);
    font-weight: 600;
  }
  /* Picking a mood presses its stamp. */
  .on .pic {
    animation: press 300ms ease-out;
  }
  @keyframes press {
    40% { transform: scale(0.85) rotate(-4deg); }
  }
  .writing {
    flex: 1;
    overflow-y: auto;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 0.5px solid var(--hair);
  }
  .prompt {
    margin: 0 0 6px;
    font-size: 15px;
    font-style: italic;
    color: var(--stone);
  }
  .writing :global(.ProseMirror) {
    min-height: 8em;
  }
  .photos {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    margin-top: 12px;
  }
  .photo {
    position: relative;
  }
  .photo img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 6px;
    display: block;
  }
  .remove {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 50%;
    background: rgb(22 25 37 / 0.6);
    color: #fff;
    cursor: pointer;
  }
  .error {
    margin: 8px 0 0;
    font-size: 14px;
    color: var(--ink);
  }
  .foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
  }
  .save {
    width: auto;
    padding: 10px 20px;
  }
</style>
