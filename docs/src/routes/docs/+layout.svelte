<script lang="ts">
  import DocsLayout from "#lib/components/DocsLayout.svelte";
  import type { Snippet } from "svelte";

  const { children }: { children: Snippet } = $props();
</script>

<DocsLayout area="guides">{@render children()}</DocsLayout>
