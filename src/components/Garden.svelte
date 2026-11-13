<script lang="ts">
  import MonthBed, { type Plot } from './MonthBed.svelte';
  import Notice from './Notice.svelte';
  import OnThisDay from './OnThisDay.svelte';
  import { localeWeekStart, monthWeeks, parseISODate } from '../lib/dates';
  import { download } from '../lib/download';
  import { dayMood, growthStage, growthStart, wordCount } from '../lib/garden';
  import { moodById } from '../lib/moods';
  import { encodeShare, type SharedMonth } from '../lib/share';
  import { renderSharePng } from '../lib/sharePng';
  import { entriesOn, garden } from '../lib/store.svelte';
  import { showToast } from '../lib/toast.svelte';
  import type { ISODate, WeatherKind } from '../lib/types';
  import { formatTemp } from '../lib/weather';

  let {
    today,
    offset = $bindable(0),
    onpick,
    onwrite,
    planting = null,
    catchUpSince = null,
  }: {
    today: ISODate;
    offset?: number;
    onpick: (d: ISODate) => void;
    onwrite: () => void;
    planting?: { date: ISODate; full: boolean } | null;
    catchUpSince?: number | null;
  } = $props();

  const WEATHER_WORDS: Record<WeatherKind, string> = {
    clear: 'clear', cloud: 'cloudy', rain: 'rain', storm: 'storms', snow: 'snow', fog: 'fog',
  };
  const weekStart = localeWeekStart();
  const now = $derived(parseISODate(today));
  // `offset` counts months back from the current month; never positive (no future months).
  const shown = $derived(new Date(now.getFullYear(), now.getMonth() + offset, 1));

  const todayLine = $derived.by(() => {
    const day = garden.days[today];
    const weekday = `${now.toLocaleDateString(undefined, { weekday: 'long' })} ${now.getDate()}`;
    if (!day?.weather) return now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
    const temp = day.tempMax != null ? ` and ${formatTemp(day.tempMax)}` : '';
    return `${weekday}, ${WEATHER_WORDS[day.weather]}${temp}`;
  });

  function plot(date: ISODate): Plot {
    const entries = entriesOn(date);
    const day = garden.days[date];
    const mood = dayMood(entries, day?.pinnedEntryId);
    const words = entries.reduce((n, e) => n + wordCount(e.text), 0);
    const label = parseISODate(date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
    const start = mood ? growthStart(entries) : 0;
    const stage = mood ? growthStage(start) : 1;
    const before = mood && catchUpSince != null ? growthStage(start, catchUpSince) : stage;
    return {
      mood,
      stage,
      weather: entries.length ? day?.weather : undefined,
      // Log scale so a short entry still shows a mark; ~600 words fills the underline.
      ink: words ? Math.min(1, Math.log1p(words) / Math.log1p(600)) : 0,
      label: mood ? `${label}: ${moodById(mood).label}, ${words} words` : `${label}: nothing written`,
      from: before < stage ? before : undefined,
    };
  }

  // Sharing: only each day's stamp and weather leave the device.
  let sharing = $state(false);
  const sharedMonth = $derived.by((): SharedMonth => {
    const dates = monthWeeks(shown.getFullYear(), shown.getMonth(), 0).flat().filter((d) => d !== null);
    const days = dates.map((d) => {
      const p = plot(d);
      return p.mood ? { mood: p.mood, weather: p.weather } : {};
    });
    return { year: shown.getFullYear(), month: shown.getMonth(), days };
  });
  const stamped = $derived(sharedMonth.days.filter((d) => d.mood).length);

  async function saveImage() {
    const blob = await renderSharePng(sharedMonth, weekStart);
    const name = `daymark-${sharedMonth.year}-${String(sharedMonth.month + 1).padStart(2, '0')}.png`;
    const file = new File([blob], name, { type: 'image/png' });
    // Phones get the share sheet (which offers "Save image"); computers get a download.
    if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] }).catch(() => {});
      return;
    }
    download(blob, name);
    showToast('Image saved');
  }

  async function copyLink() {
    const url = `${location.origin}${location.pathname}#${encodeShare(sharedMonth)}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied');
    } catch {
      if (navigator.share) await navigator.share({ url }).catch(() => {});
      else showToast('Couldn’t copy the link. Your browser blocked the clipboard.');
    }
  }
</script>

<section>
  <Notice />
  <p class="quiet">{todayLine}</p>
  <header>
    <div>
      {#if shown.getFullYear() !== now.getFullYear()}<p class="quiet">{shown.getFullYear()}</p>{/if}
      <h1 class="inked">{shown.toLocaleDateString(undefined, { month: 'long' })}</h1>
      <p class="quiet">{stamped} of {sharedMonth.days.length} days stamped</p>
    </div>
    <div class="arrows">
      <button aria-label="Previous month" onclick={() => offset--}>‹</button>
      {#if offset < 0}<button aria-label="Next month" onclick={() => offset++}>›</button>{/if}
    </div>
  </header>

  <MonthBed year={shown.getFullYear()} month={shown.getMonth()} {today} {weekStart} {plot} {onpick} {planting} />
  {#if offset === 0}<OnThisDay {today} {onpick} />{/if}

  {#if stamped}
    <div class="share">
      {#if sharing}
        <p>Shares this month’s stamps and weather. Your words and photos stay on this device.</p>
        <button onclick={saveImage}>Save image</button>
        <button onclick={copyLink}>Copy link</button>
      {:else}
        <button onclick={() => (sharing = true)}>Share this month</button>
      {/if}
    </div>
  {/if}

  <div class="tear" aria-hidden="true"></div>
  <button class="btn-main" onclick={onwrite}>Write today</button>
</section>

<style>
  .quiet {
    font-size: 13px;
    color: var(--stone);
    margin: 0;
  }
  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin: 4px 0 12px;
  }
  h1 {
    font-size: 33px;
    line-height: 1.05;
    margin: 2px 0;
  }
  .arrows {
    display: flex;
    gap: 6px;
    margin-top: 4px;
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
  .share {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 16px;
    margin-top: 8px;
    font-size: 14px;
    color: var(--stone);
  }
  .share p {
    flex-basis: 100%;
    margin: 0;
  }
  .share button {
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .tear {
    margin: 12px 0 16px;
    border-top: 2px dashed var(--hair);
  }
</style>
