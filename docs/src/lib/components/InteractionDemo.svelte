<!--
  Landing hero media: a mock Discord interaction above the code that produces it. The mock always uses Discord's dark
  colours (literal values below), whatever the docs theme, because that is what the reader sees in their client.
-->
<div class="flex min-w-0 flex-col gap-3">
  <figure
    class="m-0 rounded-lg border border-[#2c2c31] bg-[#1a1a1e] px-[1.1rem] pt-4 pb-[1.1rem] text-[#dfe0e2]"
    aria-label="Example: a user runs /ping and the bot replies Pong!"
  >
    <div class="flex gap-3.5" aria-hidden="true">
      <img class="size-10 flex-none rounded-full bg-[#242429] p-1.5" src="/logo.svg" alt="" width="40" height="40" />
      <div class="min-w-0">
        <p class="text-xs text-[#9b9ca3]">Luke used <span class="text-[#c9cdfb]">/ping</span></p>
        <p class="font-semibold text-white">
          Honocord Bot
          <span class="ms-1 rounded-[3px] bg-[#5865f2] px-1 py-px align-[0.1em] text-[0.65rem] font-semibold">APP</span>
        </p>
        <div class="embed relative mt-1.5 rounded border border-s-0 border-[#2c2c31] bg-[#242429] px-3 py-2">Pong!</div>
        <span class="mt-2 inline-block rounded border border-[#2c2c31] bg-[#2a2a2f] px-3 py-1 text-sm font-semibold text-white">
          Ping again
        </span>
      </div>
    </div>
  </figure>

  <!-- Hand-highlighted: the landing page is a Svelte route, which the markdown highlighter never sees. -->
  <pre
    class="code m-0 overflow-x-auto rounded-lg border border-[#2c2c31] bg-[#121214] p-4 font-mono text-[0.8rem] leading-relaxed text-[#dfe0e2]"><code
      ><span class="k">new</span> <span class="f">SlashCommandHandler</span>()
  .<span class="f">setName</span>(<span class="s">"ping"</span>)
  .<span class="f">setDescription</span>(<span class="s">"Replies with Pong!"</span>)
  .<span class="f">addHandler</span>(<span class="k">async</span> (interaction) <span class="k">=&gt;</span> {"{"}
    <span class="k">await</span> interaction.<span class="f">reply</span>(<span class="s">"Pong!"</span>);
  {"}"});</code
    ></pre>
</div>

<style>
  .embed::before {
    background: linear-gradient(var(--hc-flame-from), var(--hc-flame-to));
    border-radius: 4px 0 0 4px;
    content: "";
    inset: -1px auto -1px -1px;
    position: absolute;
    width: 4px;
  }

  .code .k {
    color: #ff8c5a;
  }

  .code .f,
  .code .s {
    color: #a3abff;
  }
</style>
