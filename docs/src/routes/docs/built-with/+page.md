---
title: Built with Honocord
description: Discord bots that run on Honocord.
section: Resources
order: 90
---

<script>
  import { Card } from "svelte-docsmith";
  import { builtWith } from "#lib/built-with.ts";
</script>

Do you use Honocord for your Discord bot? Open a PR that adds your bot to the list in [`docs/src/lib/built-with.ts`](https://github.com/The-LukeZ/honocord/blob/main/docs/src/lib/built-with.ts).
Please include the following information:

- Bot name
- Short description (max. 200 characters)
- Link to the bot's repository or website/docs

## Bots built with Honocord

<div class="not-prose grid gap-3 sm:grid-cols-2">
  {#each builtWith as bot (bot.link)}
    <Card title={bot.title.slice(0, 50)} href={bot.link} external>{bot.description.slice(0, 200)}</Card>
  {/each}
</div>
