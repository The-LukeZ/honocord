<script lang="ts">
  import { content } from "svelte-docsmith/content";
  import { DocsShell, Sidebar, type NavGroup } from "svelte-docsmith";
  import type { Snippet } from "svelte";

  const { area, children }: { area: "guides" | "reference"; children: Snippet } = $props();

  // Two sidebars: the API reference under /reference, and the guides (every other doc page). Scoping the content
  // also scopes the pager and breadcrumbs to the same area.
  const isReference = (path: string) => path === "/reference" || path.startsWith("/reference/");
  const areaContent = $derived({
    ...content,
    docs: content.docs.filter((d) => isReference(d.path) === (area === "reference")),
  });

  // Links that are not doc pages of this app. Appended to the guides sidebar only, so the pager and breadcrumbs never
  // point at them. The llms files come from src/routes/llms*.txt.
  const resources: NavGroup = {
    title: "More resources",
    items: [
      { title: "Example bots", url: "https://github.com/The-LukeZ/honocord-examples" },
      { title: "llms.txt", url: "/llms.txt" },
      { title: "llms-full.txt", url: "/llms-full.txt" },
    ],
  };
</script>

<DocsShell content={areaContent} readingTime={false} search={() => import("svelte-docsmith/search").then((m) => m.docs)} copyPage>
  {#snippet sidebar({ nav })}
    <Sidebar nav={area === "guides" ? [...nav, resources] : nav} />
  {/snippet}
  {@render children()}
</DocsShell>
