<script lang="ts">
  import DayView from './components/DayView.svelte';
  import Garden from './components/Garden.svelte';
  import Nav from './components/Nav.svelte';
  import Search from './components/Search.svelte';
  import ShareView from './components/ShareView.svelte';
  import Lock from './components/Lock.svelte';
  import Settings from './components/Settings.svelte';
  import { AUTO_LOCK_MS, getLock, type Lock as LockData } from './lib/lock';
  import { decodeShare } from './lib/share';
  import Toast from './components/Toast.svelte';
  import WriteSheet from './components/WriteSheet.svelte';
  import YearView from './components/YearView.svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import { diaryToday, parseISODate } from './lib/dates';
  import { getMeta, setMeta } from './lib/db';
  import { garden, load } from './lib/store.svelte';
  import type { Entry, ISODate } from './lib/types';

  type Tab = 'garden' | 'year' | 'search' | 'settings';
  let today = $state(diaryToday());
  let tab = $state<Tab>('garden');
  let openDay = $state<ISODate | null>(null);
  let monthOffset = $state(0);
  let writing = $state<{ date: ISODate; entry?: Entry } | null>(null);
  let shared = $state(decodeShare(location.hash));
  load();

  // Desktop (960px+): the garden stays on the left and the chosen day sits on the right.
  const wide = new MediaQuery('min-width: 960px');
  const split = $derived(wide.current && tab === 'garden');

  // Motion: the save moment on one plot, and plants that grew since the last visit growing in once.
  let planting = $state<{ date: ISODate; full: boolean } | null>(null);
  let plantTimer: ReturnType<typeof setTimeout>;
  let catchUpSince = $state<number | null>(null);
  getMeta<number>('lastVisit').then((t) => {
    catchUpSince = t ?? null;
    setMeta('lastVisit', Date.now());
  });

  function closeSheet(saved?: { date: ISODate; planted: boolean }) {
    writing = null;
    if (!saved) return;
    planting = { date: saved.date, full: saved.planted };
    clearTimeout(plantTimer);
    plantTimer = setTimeout(() => (planting = null), 2000);
  }

  // PIN lock: the diary isn't rendered until the first unlock; later auto-locks cover it with the lock screen.
  let lock = $state<LockData | undefined>();
  let lockReady = $state(false);
  let locked = $state(false);
  let unlockedOnce = $state(false);
  let lastActive = Date.now();
  getLock().then((l) => {
    lock = l;
    locked = !!l;
    unlockedOnce = !l;
    lockReady = true;
  });
  const refreshLock = async () => (lock = await getLock());
  function maybeLock() {
    if (lock && !locked && Date.now() - lastActive >= AUTO_LOCK_MS) locked = true;
  }
  setInterval(maybeLock, 30_000);

  // The app may stay open past the 4am rollover.
  const refreshToday = () => {
    today = diaryToday();
    maybeLock();
  };

  function go(t: Tab) {
    tab = t;
    openDay = null;
    catchUpSince = null;
    if (t === 'garden') monthOffset = 0;
    scrollTo(0, 0);
  }

  function openMonth(year: number, month: number) {
    const now = parseISODate(today);
    monthOffset = (year - now.getFullYear()) * 12 + (month - now.getMonth());
    tab = 'garden';
    scrollTo(0, 0);
  }

  function pick(date: ISODate) {
    openDay = date;
    catchUpSince = null;
    if (!split) scrollTo(0, 0);
  }
</script>

<svelte:document onvisibilitychange={refreshToday} />
<svelte:window
  onhashchange={() => (shared = decodeShare(location.hash))}
  onpointerdown={() => (lastActive = Date.now())}
  onkeydown={() => (lastActive = Date.now())}
/>

<main class:wide={split}>
  {#if shared}
    <ShareView
      {shared}
      hasGarden={garden.entries.length > 0}
      onstart={() => {
        history.replaceState(null, '', location.pathname);
        shared = null;
      }}
    />
  {:else if garden.ready && unlockedOnce}
    {#if split}
      {@const date = openDay ?? today}
      <div class="split">
        <div class="left">
          <Garden
            {today}
            bind:offset={monthOffset}
            onpick={pick}
            onwrite={() => (writing = { date: today })}
            {planting}
            {catchUpSince}
          />
        </div>
        <DayView {date} onwrite={(entry) => (writing = { date, entry })} />
      </div>
    {:else if openDay}
      {@const date = openDay}
      <DayView {date} onback={() => (openDay = null)} onwrite={(entry) => (writing = { date, entry })} />
    {:else if tab === 'year'}
      <YearView {today} onopenmonth={openMonth} />
    {:else if tab === 'search'}
      <Search onpick={pick} />
    {:else if tab === 'settings'}
      <Settings onlockchange={refreshLock} />
    {:else}
      <Garden
        {today}
        bind:offset={monthOffset}
        onpick={pick}
        onwrite={() => (writing = { date: today })}
        {planting}
        {catchUpSince}
      />
    {/if}
  {/if}
</main>

{#if !shared}<Nav current={openDay && !split ? null : tab} ongo={go} />{/if}

{#if writing}
  <WriteSheet date={writing.date} entry={writing.entry} {today} onclose={closeSheet} />
{/if}
<Toast />
{#if !shared && lockReady && locked && lock}
  <Lock
    {lock}
    onunlock={async () => {
      locked = false;
      unlockedOnce = true;
      lastActive = Date.now();
      await refreshLock(); // the PIN may have been reset via the security question
    }}
  />
{/if}

<style>
  main {
    max-width: 680px;
    margin: 0 auto;
    padding: 20px var(--gutter) calc(88px + env(safe-area-inset-bottom));
  }
  main.wide {
    max-width: 1120px;
  }
  .split {
    display: grid;
    grid-template-columns: minmax(0, 520px) minmax(0, 1fr);
    gap: 56px;
  }
  .left {
    position: sticky;
    top: 20px;
    align-self: start;
  }
</style>
