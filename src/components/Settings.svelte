<script lang="ts">
  import PinFields from './PinFields.svelte';
  import { readBackup, restoreBackup } from '../lib/backup';
  import { downloadBackup } from '../lib/backupAction';
  import { getMeta, setMeta } from '../lib/db';
  import { getLock, removeLock, setLock, AUTO_LOCK_MS, type Lock } from '../lib/lock';
  import { load } from '../lib/store.svelte';
  import { showToast } from '../lib/toast.svelte';
  import { askPlace, type Place } from '../lib/weather';

  let { onlockchange }: { onlockchange: () => void } = $props();

  let lastBackup = $state<number>();
  let lock = $state<Lock>();
  let place = $state<Place | 'denied'>();
  getMeta<number>('lastBackup').then((v) => (lastBackup = v));
  getLock().then((v) => (lock = v));
  getMeta<Place | 'denied'>('location').then((v) => (place = v));

  // Backup
  let restoreError = $state('');
  let fileInput: HTMLInputElement;

  async function backUp() {
    await downloadBackup();
    lastBackup = Date.now();
    showToast('Backup downloaded');
  }

  async function restore(files: FileList | null) {
    const file = files?.[0];
    fileInput.value = '';
    if (!file) return;
    restoreError = '';
    try {
      const parsed = await readBackup(file);
      const n = parsed.entries.length;
      if (!confirm(`Replace this diary with the backup’s ${n} ${n === 1 ? 'entry' : 'entries'}? What’s here now will be gone.`)) return;
      await restoreBackup(parsed);
      await load();
      showToast('Backup restored');
    } catch (e) {
      restoreError = (e as Error).message;
    }
  }

  const ago = (t: number) => {
    const days = Math.floor((Date.now() - t) / 86_400_000);
    return days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
  };

  // PIN
  let editing = $state(false);
  let newPin = $state<string | null>(null);
  let question = $state('');
  let answer = $state('');
  let pinError = $state('');

  async function savePin(e: SubmitEvent) {
    e.preventDefault();
    if (!newPin) return void (pinError = 'Enter the same 4 to 6 digit PIN in both boxes.');
    if (!question.trim() || !answer.trim()) return void (pinError = 'Add a security question and its answer.');
    await setLock(newPin, question, answer);
    lock = await getLock();
    editing = false;
    question = answer = pinError = '';
    onlockchange();
    showToast('PIN saved');
  }

  async function turnOff() {
    await removeLock();
    lock = undefined;
    onlockchange();
    showToast('PIN turned off');
  }

  // Location
  async function useLocation() {
    try {
      place = await askPlace();
      await setMeta('location', place);
    } catch {
      showToast('Location is blocked for this site in your browser settings.');
    }
  }
  async function stopLocation() {
    place = 'denied';
    await setMeta('location', 'denied');
  }
</script>

<section>
  <h1>Settings</h1>

  <h2>Backup</h2>
  <p>Last backup: {lastBackup ? ago(lastBackup) : 'never'}.</p>
  <div class="actions">
    <button class="main" onclick={backUp}>Download backup</button>
    <button onclick={() => fileInput.click()}>Restore from a backup</button>
    <input type="file" accept="application/json,.json" hidden bind:this={fileInput} onchange={(e) => restore(e.currentTarget.files)} />
  </div>
  {#if restoreError}<p class="error" role="alert">{restoreError}</p>{/if}

  <h2>PIN lock</h2>
  <p class="quiet">
    A PIN keeps people out of the app on this device. It doesn’t encrypt your entries, so it won’t stop someone who
    knows their way around browser developer tools.
  </p>
  {#if editing}
    <form onsubmit={savePin}>
      <PinFields onvalue={(v) => (newPin = v)} />
      <label>Security question, for when you forget the PIN <input type="text" bind:value={question} placeholder="First street I lived on?" /></label>
      <label>Answer <input type="text" autocomplete="off" bind:value={answer} /></label>
      {#if pinError}<p class="error" role="alert">{pinError}</p>{/if}
      <div class="actions">
        <button class="main" type="submit">Save PIN</button>
        <button type="button" onclick={() => ((editing = false), (pinError = ''))}>Cancel</button>
      </div>
    </form>
  {:else if lock}
    <p>On. The app locks after {AUTO_LOCK_MS / 60_000} minutes without use.</p>
    <div class="actions">
      <button onclick={() => (editing = true)}>Change PIN</button>
      <button onclick={turnOff}>Turn off PIN</button>
    </div>
  {:else}
    <div class="actions"><button class="main" onclick={() => (editing = true)}>Add a PIN</button></div>
  {/if}

  <h2>Weather</h2>
  {#if place && place !== 'denied'}
    <p>Looked up from your location, rounded to about 1 km.</p>
    <div class="actions"><button onclick={stopLocation}>Stop using my location</button></div>
  {:else if place === 'denied'}
    <p>Off. You can pick the weather by hand when you write.</p>
    <div class="actions"><button onclick={useLocation}>Use my location</button></div>
  {:else}
    <p>You’ll be asked the first time you add the weather.</p>
  {/if}

  <h2>Your data</h2>
  <p>
    Everything stays in this browser on this device. To look up the weather, only a date and your rounded location go
    to Open-Meteo. Shared months carry moods and weather, never your words or photos.
  </p>
</section>

<style>
  h1 {
    font-size: 40px;
    margin-bottom: 8px;
  }
  h2 {
    font-size: 22px;
    margin: 28px 0 8px;
  }
  p {
    margin: 0 0 8px;
    max-width: 65ch;
    font-size: 16px;
  }
  .quiet {
    color: var(--stone);
    font-size: 15px;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 20px;
    align-items: center;
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
  .actions .main {
    color: var(--ink);
    font-weight: 600;
  }
  form {
    display: grid;
    gap: 12px;
    max-width: 420px;
  }
  label {
    display: grid;
    gap: 4px;
    font-size: 14px;
    color: var(--stone);
  }
  input[type='text'] {
    padding: 8px 12px;
    border: 1px solid var(--hair);
    border-radius: 10px;
    background: var(--sheet);
    color: var(--ink);
    font: inherit;
  }
  .error {
    font-size: 15px;
  }
</style>
