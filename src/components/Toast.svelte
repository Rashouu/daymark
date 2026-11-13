<script lang="ts">
  import { dismissToast, toast } from '../lib/toast.svelte';
</script>

<div class="wrap" role="status" aria-live="polite">
  {#if toast.current}
    {@const t = toast.current}
    <div class="toast">
      <span>{t.msg}</span>
      {#if t.action}
        <button
          onclick={() => {
            t.action!.run();
            dismissToast();
          }}>{t.action.label}</button
        >
      {/if}
    </div>
  {/if}
</div>

<style>
  .wrap {
    position: fixed;
    left: 0;
    right: 0;
    bottom: calc(68px + env(safe-area-inset-bottom)); /* above the nav */
    display: flex;
    justify-content: center;
    pointer-events: none;
    z-index: 10;
  }
  .toast {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 6px 8px 6px 18px;
    border-radius: 999px;
    background: var(--ink);
    color: var(--on-ink);
    font-size: 15px;
    pointer-events: auto;
    animation: rise 200ms ease-out;
  }
  button {
    min-height: 40px;
    padding: 0 12px;
    border: 0;
    background: none;
    color: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  @keyframes rise {
    from {
      transform: translateY(12px);
      opacity: 0;
    }
  }
</style>
