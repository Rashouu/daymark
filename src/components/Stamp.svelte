<script lang="ts">
  import type { Stage } from '../lib/garden';
  import { inkColor, STAMPS, tilt } from '../lib/stamps';
  import type { ISODate, MoodId } from '../lib/types';

  // `date` gives the stamp its hand-pressed tilt; `from` plays the ink drying from an earlier stage once.
  let { mood, stage = 4, date, from }: { mood: MoodId; stage?: Stage; date?: ISODate; from?: Stage } = $props();
</script>

<svg
  viewBox="0 0 40 40"
  aria-hidden="true"
  class:drying={from !== undefined}
  style:color={inkColor(stage)}
  style:--from={from !== undefined ? inkColor(from) : undefined}
  style:rotate={date ? `${tilt(date)}deg` : undefined}
>
  {@html STAMPS[mood]}
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .drying {
    animation: dry 1400ms ease-out;
  }
  @keyframes dry {
    from {
      color: var(--from);
    }
  }
</style>
