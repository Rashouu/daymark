<script lang="ts">
  import { Editor, type JSONContent } from '@tiptap/core';
  import { onMount } from 'svelte';
  import { extensions } from '../lib/editor';

  let { doc, onchange }: { doc?: JSONContent; onchange: (doc: JSONContent, text: string) => void } = $props();
  let el: HTMLDivElement;

  onMount(() => {
    const editor = new Editor({
      element: el,
      extensions,
      content: doc ?? '',
      editorProps: { attributes: { class: 'prose', 'aria-label': 'Entry text', role: 'textbox', 'aria-multiline': 'true' } },
      onUpdate: ({ editor }) => onchange(editor.getJSON(), editor.getText({ blockSeparator: '\n' })),
    });
    return () => editor.destroy();
  });
</script>

<div bind:this={el}></div>
