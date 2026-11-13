<script lang="ts">
  import { getMeta, setMeta } from '../lib/db';
  import { garden, updateDay } from '../lib/store.svelte';
  import type { ISODate, WeatherKind } from '../lib/types';
  import { askPlace, fetchWeather, formatTemp, WEATHER_KINDS, WEATHER_LABEL, type Place } from '../lib/weather';

  let { date }: { date: ISODate } = $props();

  // 'unasked' until the first tap; 'denied' is remembered so we never ask again.
  let place = $state<Place | 'denied' | 'unasked' | undefined>();
  let status = $state<'idle' | 'loading' | 'manual'>('idle');
  const day = $derived(garden.days[date]);

  getMeta<Place | 'denied'>('location').then((p) => (place = p ?? 'unasked'));

  async function fill(p: Place) {
    status = 'loading';
    try {
      await updateDay(date, await fetchWeather(date, p));
      status = 'idle';
    } catch {
      status = 'manual'; // offline or no data: let the person choose
    }
  }

  // Fetch automatically for any date without weather once we know where the person is.
  $effect(() => {
    if (place && typeof place === 'object' && !day?.weather && status === 'idle') fill(place);
  });

  async function ask() {
    status = 'loading';
    try {
      place = await askPlace();
      await setMeta('location', place);
      status = 'idle';
    } catch {
      place = 'denied';
      await setMeta('location', 'denied');
      status = 'manual';
    }
  }

  const pick = (w: WeatherKind) => updateDay(date, { weather: w, tempMax: undefined });
</script>

<div class="row">
  {#if day?.weather && status !== 'manual' && place !== 'denied'}
    <span class="swatch wx-{day.weather}"></span>
    {WEATHER_LABEL[day.weather]}{day.tempMax != null ? `, ${formatTemp(day.tempMax)}` : ''}
  {:else if status === 'loading'}
    Checking the weather…
  {:else if place === 'unasked'}
    <button class="link" onclick={ask}>Add the weather</button>
    <span class="note">uses your location once</span>
  {:else if place === 'denied' || status === 'manual'}
    <div class="chips" role="group" aria-label="Weather">
      {#each WEATHER_KINDS as w (w)}
        <button class="chip" aria-pressed={day?.weather === w} onclick={() => pick(w)}>
          <span class="swatch wx-{w}"></span>{WEATHER_LABEL[w]}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    min-height: 32px;
    margin-top: 10px;
    font-size: 14px;
    color: var(--stone);
  }
  .swatch {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: 1px solid var(--hair);
    background-color: var(--sheet);
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .note {
    font-size: 13px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 34px;
    padding: 0 10px 0 6px;
    border: 1px solid var(--hair);
    border-radius: 6px;
    background: none;
    font-size: 13px;
    color: var(--ink);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    border: 2px solid var(--ink);
  }
</style>
