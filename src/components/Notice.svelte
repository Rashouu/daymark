<script lang="ts">
  import { needsBackupReminder } from '../lib/backup';
  import { downloadBackup } from '../lib/backupAction';
  import { getMeta, setMeta } from '../lib/db';
  import { garden } from '../lib/store.svelte';
  import { showToast } from '../lib/toast.svelte';

  // At most one notice at a time: the backup reminder first, then the iPhone install hint.
  let meta = $state<{ lastBackup?: number; dismissed?: number; iosDismissed?: boolean } | null>(null);
  Promise.all([getMeta<number>('lastBackup'), getMeta<number>('backupDismissed'), getMeta<boolean>('iosHintDismissed')]).then(
    ([lastBackup, dismissed, iosDismissed]) => (meta = { lastBackup, dismissed, iosDismissed }),
  );

  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const installed =
    matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

  const show = $derived.by(() => {
    if (!meta) return null;
    if (needsBackupReminder(garden.entries, meta.lastBackup, meta.dismissed)) return 'backup';
    if (ios && !installed && !meta.iosDismissed && garden.entries.length) return 'ios';
    return null;
  });

  async function backUp() {
    await downloadBackup();
    meta = { ...meta, lastBackup: Date.now() };
    showToast('Backup downloaded');
  }
  async function later() {
    const now = Date.now();
    await setMeta('backupDismissed', now);
    meta = { ...meta, dismissed: now };
  }
  async function hideIos() {
    await setMeta('iosHintDismissed', true);
    meta = { ...meta, iosDismissed: true };
  }
</script>

{#if show === 'backup'}
  <div class="notice" role="status">
    <p>It’s been a week since your diary was backed up. Browsers can clear saved data, and a backup file is your own copy.</p>
    <button class="main" onclick={backUp}>Download backup</button>
    <button onclick={later}>Not now</button>
  </div>
{:else if show === 'ios'}
  <div class="notice" role="status">
    <p>
      Add Daymark to your Home Screen: tap Share, then Add to Home Screen. Otherwise Safari may clear your diary
      after a week without opening it.
    </p>
    <button onclick={hideIos}>Got it</button>
  </div>
{/if}

<style>
  .notice {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 16px;
    margin: 0 0 16px;
    padding: 12px 16px;
    border-radius: 14px;
    background: var(--sheet);
    font-size: 14px;
    line-height: 1.5;
  }
  p {
    flex-basis: 100%;
    margin: 0;
  }
  button {
    min-height: 40px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--stone);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .main {
    color: var(--ink);
    font-weight: 600;
  }
</style>
