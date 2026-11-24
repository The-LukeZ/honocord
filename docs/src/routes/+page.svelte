<script lang="ts">
  import { Action, Card, CTA, DocsShell, Feature, FeatureGrid, Hero } from "svelte-docsmith";
  import InteractionDemo from "#lib/components/InteractionDemo.svelte";

  const installCommand = "pnpm add honocord hono";
  let copied = $state(false);

  async function copyInstallCommand() {
    try {
      await navigator.clipboard.writeText(installCommand);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      // The clipboard can be blocked. The command stays selectable in the box.
    }
  }

  // Three ways into the docs, one per kind of visitor.
  const entries = [
    { title: "New to Honocord?", text: "Build and deploy your first command.", href: "/docs/getting-started" },
    {
      title: "Coming from discord.js?",
      text: "What changes, and what stays the same.",
      href: "/docs/discord-js-differences",
    },
    { title: "Looking something up?", text: "Every class, function and type.", href: "/reference" },
  ];
</script>

<svelte:head>
  <title>Honocord | Discord bots on a single HTTP endpoint</title>
</svelte:head>

<DocsShell search={() => import("svelte-docsmith/search").then((m) => m.docs)} layout="page">
  <Hero
    description="Honocord handles Discord's interactions on Hono, so your bot runs on Cloudflare Workers, Bun or Node with no gateway connection."
  >
    {#snippet title()}
      Discord bots that run on a <span class="flame">single HTTP endpoint</span>.
    {/snippet}
    {#snippet actions()}
      <Action href="/docs/getting-started">Get started</Action>
      <Action href="https://github.com/The-LukeZ/honocord-examples" variant="secondary" external>See examples</Action>
    {/snippet}
    {#snippet media()}
      <InteractionDemo />
    {/snippet}
  </Hero>

  <div class="mx-auto max-w-xl px-4 pb-12 md:px-6">
    <div class="flex items-center gap-2 rounded-lg border bg-muted py-2 pr-2 pl-4">
      <pre class="flex-1 overflow-x-auto font-mono text-sm"><code>{installCommand}</code></pre>
      <button
        type="button"
        class="rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        onclick={copyInstallCommand}
      >
        {copied ? "Copied" : "Copy"}<span class="sr-only"> the install command</span>
      </button>
    </div>
  </div>

  <nav class="mx-auto grid max-w-5xl gap-3 px-4 pb-16 sm:grid-cols-3 md:px-6" aria-label="Where to start">
    {#each entries as entry (entry.href)}
      <Card title={entry.title} href={entry.href}>{entry.text}</Card>
    {/each}
  </nav>

  <FeatureGrid title="What you get" columns={3} background="muted">
    <Feature title="Edge-first">Runs on Cloudflare Workers, Bun and Node.js, on one HTTP endpoint.</Feature>
    <Feature title="Fully typed">Built on discord-api-types, with typed env bindings and variables for every handler.</Feature>
    <Feature title="Handler-based">Commands, components, modals and webhook events each get their own handler.</Feature>
    <Feature title="Secure by default">Every request's Ed25519 signature is verified for you.</Feature>
    <Feature title="Familiar builders">The discord.js builders are re-exported for embeds, buttons and modals.</Feature>
    <Feature title="Autocomplete built in">A helper answers slash command autocomplete in a few lines.</Feature>
  </FeatureGrid>

  <CTA
    title="Help and community"
    description="Ask in the Discord server, report bugs on GitHub, or browse working bots in the examples repo."
  >
    {#snippet actions()}
      <Action href="https://discord.gg/X4DjpZj6Nz" external>Join the Discord</Action>
      <Action href="https://github.com/The-LukeZ/honocord" variant="secondary" external>GitHub</Action>
    {/snippet}
  </CTA>

  <p class="pb-12 text-center text-sm text-muted-foreground italic">
    Yes, AI helped me build this, with the focus on <strong>helped</strong>.
  </p>
</DocsShell>

<style>
  .flame {
    background: linear-gradient(90deg, var(--hc-flame-from), var(--hc-flame-to));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
</style>
