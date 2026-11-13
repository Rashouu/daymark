<script lang="ts">
  // A PIN typed twice. Reports a valid PIN, or null while it's incomplete or mismatched.
  import { isValidPin } from '../lib/lock';

  let { label = 'PIN', onvalue }: { label?: string; onvalue: (pin: string | null) => void } = $props();
  let pin = $state('');
  let again = $state('');

  $effect(() => onvalue(isValidPin(pin) && pin === again ? pin : null));
</script>

<label>
  {label}, 4 to 6 digits
  <input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" bind:value={pin} />
</label>
<label>
  Type it again
  <input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" bind:value={again} />
</label>

<style>
  label {
    display: grid;
    gap: 4px;
    font-size: 14px;
    color: var(--stone);
  }
  input {
    width: 100%;
    max-width: 220px;
    padding: 8px 12px;
    border: 1px solid var(--hair);
    border-radius: 10px;
    background: var(--sheet);
    color: var(--ink);
    font: inherit;
    letter-spacing: 0.3em;
  }
</style>
