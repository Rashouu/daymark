<script lang="ts" module>
  import type { Stage } from '../lib/garden';
  import type { MoodId, WeatherKind } from '../lib/types';

  /**
   * One day's square. `ink` (0–1) is how much was written, shown as the underline's length.
   * `from`: the stamp's ink was wetter at the last visit, so it dries once on screen.
   */
  export type Plot = { mood: MoodId | null; stage: Stage; weather?: WeatherKind; ink: number; label: string; from?: Stage };
</script>

<script lang="ts">
  import Stamp from './Stamp.svelte';
  import { monthWeeks } from '../lib/dates';
  import { inkColor } from '../lib/stamps';
  import type { ISODate } from '../lib/types';

  // Without `onpick` the calendar is read-only (a shared month); `grow` stamps the days in one by one.
  // `planting` plays the save moment on one day: the full press for a new stamp, the underline only otherwise.
  let {
    year,
    month,
    today,
    weekStart,
    plot,
    onpick,
    grow = false,
    planting = null,
  }: {
    year: number;
    month: number;
    today: ISODate;
    weekStart: number;
    plot: (d: ISODate) => Plot;
    onpick?: (d: ISODate) => void;
    grow?: boolean;
    planting?: { date: ISODate; full: boolean } | null;
  } = $props();

  const rows = $derived(monthWeeks(year, month, weekStart));
  // 2026-11-01 is a Sunday; offset from it to name the weekdays in the user's language.
  const weekdays = $derived(
    Array.from({ length: 7 }, (_, i) =>
      new Date(2026, 10, 1 + weekStart + i).toLocaleDateString(undefined, { weekday: 'narrow' }),
    ),
  );
</script>

{#snippet inner(p: Plot, date: ISODate)}
  {@const pl = planting?.date === date ? planting : null}
  <span class="pane {p.mood && p.weather ? `wx-${p.weather}` : ''}">
    {#if p.mood}
      <span
        class="stamp"
        class:press={grow || pl?.full}
        style:animation-delay={grow ? `${Number(date.slice(8)) * 45}ms` : undefined}
      >
        <Stamp mood={p.mood} stage={p.stage} {date} from={p.from} />
      </span>
      <span class="ink" class:draw={!!pl} style:width="{12 + p.ink * 80}%" style:background={inkColor(p.stage)}></span>
    {/if}
  </span>
  <span class="num">{Number(date.slice(8))}</span>
{/snippet}

<div class="bed">
  <div class="week names" aria-hidden="true">
    {#each weekdays as w, i (i)}<span>{w}</span>{/each}
  </div>
  {#each rows as row, r (r)}
    <div class="week">
      {#each row as date, i (date ?? `x${r}-${i}`)}
        {#if !date}
          <div></div>
        {:else}
          {@const p = plot(date)}
          {#if date > today || !onpick}
            <div class="plot" class:future={date > today} role="img" aria-label={p.label}>{@render inner(p, date)}</div>
          {:else}
            <button class="plot" class:today={date === today} aria-label={p.label} onclick={() => onpick(date)}>
              {@render inner(p, date)}
            </button>
          {/if}
        {/if}
      {/each}
    </div>
  {/each}
</div>

<style>
  .bed {
    padding: 8px 6px 2px;
    border: 2px solid var(--ink);
    border-radius: 10px;
    background: var(--sheet);
  }
  .week {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0 2px;
    margin-bottom: 4px;
  }
  .names {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 11px;
    color: var(--stone);
    text-align: center;
    margin-bottom: 4px;
  }
  .plot {
    display: flex;
    flex-direction: column;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
    min-width: 0;
  }
  .pane {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 50px;
    border-radius: 4px;
  }
  .stamp {
    position: relative;
    display: block;
    width: 26px;
    height: 26px;
  }
  .ink {
    display: block;
    height: 3px;
    margin-top: 5px;
    border-radius: 2px;
  }
  /* The save moment: the stamp comes down tilted and lands, a ring of ink spreads, the underline draws in. */
  .press {
    animation: press 380ms cubic-bezier(0.3, 0, 0.4, 1) both;
  }
  .press::after {
    content: '';
    position: absolute;
    inset: -4px;
    border: 2px solid var(--accent);
    border-radius: 50%;
    opacity: 0;
    animation: ring 600ms 300ms ease-out;
  }
  @keyframes press {
    from {
      transform: scale(1.8) rotate(-14deg);
      opacity: 0;
    }
    70% {
      transform: scale(0.92);
      opacity: 1;
    }
  }
  @keyframes ring {
    from {
      transform: scale(0.7);
      opacity: 0.8;
    }
    to {
      transform: scale(1.6);
      opacity: 0;
    }
  }
  .draw {
    animation: draw 500ms 300ms ease-out both;
  }
  @keyframes draw {
    from {
      width: 0;
    }
  }
  .num {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 11px;
    line-height: 1.7;
    text-align: center;
    color: var(--stone);
  }
  .today .num {
    color: var(--accent-text);
    font-weight: 800;
  }
  .future {
    cursor: default;
    opacity: 0.35;
  }
</style>
