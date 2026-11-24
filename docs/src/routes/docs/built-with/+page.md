---
title: Built with Honocord
description: Discord bots that run on Honocord.
section: Resources
order: 90
---

<script>
  import { Card } from "svelte-docsmith";
  import { builtWith } from "#lib/generated/built-with.ts";
</script>

Do you use Honocord for your Discord bot? [Open an issue](https://github.com/The-LukeZ/honocord/issues/new?template=built-with.yml) with the "Built with Honocord" template and I may add it to the list.
The template asks for:

- Bot name
- Short description (max. 200 characters)
- Link to the bot's repository or website/docs

## Bots built with Honocord

<div class="not-prose grid gap-3 sm:grid-cols-2">
  {#each builtWith as bot (bot.link)}
    <Card title={bot.title.slice(0, 50)} href={bot.link} external>{bot.description.slice(0, 200)}</Card>
  {/each}
</div>
