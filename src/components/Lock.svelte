<script lang="ts">
  import { onMount } from 'svelte';
  import PinFields from './PinFields.svelte';
  import { changePin, checkAnswer, checkPin, type Lock } from '../lib/lock';

  let { lock, onunlock }: { lock: Lock; onunlock: () => void } = $props();

  let mode = $state<'pin' | 'answer' | 'newpin'>('pin');
  let pin = $state('');
  let answer = $state('');
  let newPin = $state<string | null>(null);
  let error = $state('');
  let shake = $state(false);
  let dialog: HTMLDialogElement;

  onMount(() => dialog.showModal());

  function fail(msg: string) {
    error = msg;
    shake = false;
    requestAnimationFrame(() => (shake = true));
  }

  async function unlock(e: SubmitEvent) {
    e.preventDefault();
    if (await checkPin(lock, pin)) return done();
    pin = '';
    fail('That PIN doesn’t match.');
  }

  async function check(e: SubmitEvent) {
    e.preventDefault();
    if (await checkAnswer(lock, answer)) {
      mode = 'newpin';
      error = '';
    } else fail('That answer doesn’t match.');
  }

  async function savePin(e: SubmitEvent) {
    e.preventDefault();
    if (!newPin) return fail('Enter the same 4 to 6 digit PIN in both boxes.');
    await changePin(lock, newPin);
    done();
  }

  function done() {
    dialog.close();
    onunlock();
  }
</script>

<dialog bind:this={dialog} aria-label="Unlock Daymark" oncancel={(e) => e.preventDefault()}>
  <div class="box" class:shake>
    <h1 class="inked">Daymark</h1>
    {#if mode === 'pin'}
      <form onsubmit={unlock}>
        <label>
          Enter your PIN
          <!-- svelte-ignore a11y_autofocus -->
          <input
            type="password"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            autocomplete="off"
            autofocus
            bind:value={pin}
          />
        </label>
        <button class="btn-main" type="submit">Unlock</button>
      </form>
      <button class="quiet" onclick={() => ((mode = 'answer'), (error = ''))}>Forgot PIN?</button>
    {:else if mode === 'answer'}
      <form onsubmit={check}>
        <label>
          {lock.question}
          <input type="text" autocomplete="off" bind:value={answer} />
        </label>
        <button class="btn-main" type="submit">Check answer</button>
      </form>
      <button class="quiet" onclick={() => ((mode = 'pin'), (error = ''))}>Back to PIN</button>
    {:else}
      <form onsubmit={savePin}>
        <PinFields label="New PIN" onvalue={(v) => (newPin = v)} />
        <button class="btn-main" type="submit">Save and unlock</button>
      </form>
    {/if}
    {#if error}<p class="error" role="alert">{error}</p>{/if}
  </div>
</dialog>

<style>
  dialog {
    width: 100%;
    max-width: none;
    height: 100%;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: var(--sky);
    color: var(--ink);
  }
  dialog::backdrop {
    background: var(--sky);
  }
  .box {
    max-width: 320px;
    margin: 18vh auto 0;
    padding: 0 var(--gutter);
    display: grid;
    gap: 16px;
  }
  .shake {
    animation: shake 320ms ease-in-out;
  }
  @keyframes shake {
    25% { transform: translateX(-8px); }
    50% { transform: translateX(6px); }
    75% { transform: translateX(-3px); }
  }
  h1 {
    font-size: 33px;
  }
  form {
    display: grid;
    gap: 12px;
  }
  label {
    display: grid;
    gap: 6px;
    font-size: 15px;
  }
  input {
    padding: 10px 14px;
    border: 2px solid var(--ink);
    border-radius: 8px;
    background: var(--sheet);
    color: var(--ink);
    font: inherit;
  }
  input[type='password'] {
    letter-spacing: 0.4em;
  }
  .quiet {
    justify-self: start;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--stone);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .error {
    margin: 0;
    font-size: 15px;
  }
</style>
