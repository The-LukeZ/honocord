<script lang="ts">
  import { Changelog, DocsShell } from "svelte-docsmith";
  import { releases } from "svelte-docsmith/changelog";
  import { content } from "svelte-docsmith/content";
</script>

<svelte:head>
  <title>Changelog | Honocord</title>
</svelte:head>

<DocsShell {content} search={() => import("svelte-docsmith/search").then((m) => m.docs)} layout="page">
  <Changelog {releases} description="Every release of honocord, generated from the package CHANGELOG.md." />
</DocsShell>
