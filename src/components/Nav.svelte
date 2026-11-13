<script lang="ts">
  type Tab = 'garden' | 'year' | 'search' | 'settings';
  let { current, ongo }: { current: Tab | null; ongo: (t: Tab) => void } = $props();
  const TABS: [Tab, string][] = [
    ['garden', 'Calendar'],
    ['year', 'Year'],
    ['search', 'Search'],
    ['settings', 'Settings'],
  ];
</script>

<nav aria-label="Main">
  {#each TABS as [tab, label] (tab)}
    <button class:on={current === tab} aria-current={current === tab ? 'page' : undefined} onclick={() => ongo(tab)}>
      {label}
    </button>
  {/each}
</nav>

<style>
  nav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    gap: 8px;
    padding: 4px var(--gutter) env(safe-area-inset-bottom);
    background: var(--sky);
    border-top: 0.5px solid var(--hair);
  }
  button {
    flex: 0 1 110px;
    min-height: 48px;
    border: 0;
    background: none;
    font-size: 15px;
    color: var(--stone);
    cursor: pointer;
  }
  .on {
    color: var(--ink);
    font-weight: 600;
    text-decoration: underline 2px var(--accent);
    text-underline-offset: 6px;
  }
</style>
