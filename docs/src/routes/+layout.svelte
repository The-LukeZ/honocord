<script lang="ts">
  import "../app.css";
  import type { Snippet } from "svelte";

  const { children }: { children: Snippet } = $props();

  // Open links to other sites in a new tab. One listener covers every link (markdown, sidebar, components), where
  // docsmith only sets a target on its header links. Modified clicks (ctrl, shift, middle) keep the browser's behaviour.
  function openExternalInNewTab(event: MouseEvent) {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    const link = (event.target as Element | null)?.closest?.("a[href]");
    if (!(link instanceof HTMLAnchorElement) || link.target || link.hasAttribute("download")) return;
    const url = new URL(link.href, location.href);
    // Same-origin short links (/discord, /github) are marked rel="external" by docsmith and redirect off the site.
    const external = url.origin !== location.origin || link.relList.contains("external");
    if (!url.protocol.startsWith("http") || !external) return;
    event.preventDefault();
    window.open(url.href, "_blank", "noopener,noreferrer");
  }
</script>

<svelte:document onclick={openExternalInNewTab} />

{@render children()}
