<script lang="ts">
  import { getPhoto } from '../lib/db';

  let { id }: { id: string } = $props();
  let url = $state<string>();

  $effect(() => {
    let u: string | undefined;
    getPhoto(id).then((p) => {
      if (p) url = u = URL.createObjectURL(p.blob);
    });
    return () => u && URL.revokeObjectURL(u);
  });
</script>

{#if url}<img src={url} alt="" />{/if}

<style>
  img {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 6px;
  }
</style>
