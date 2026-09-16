---
"honocord": minor
---

Add dynamic command handlers for slash commands and context menu commands. Register `DynamicGuildSlashCommandHandler` / `DynamicGlobalSlashCommandHandler` and `DynamicGuildContextCommandHandler` / `DynamicGlobalContextCommandHandler` via `loadHandlers` to catch interactions whose command name isn't known ahead of time (e.g. per-guild custom commands) or that don't match any registered handler. Guild-scoped dynamic handlers are tried first for guild interactions, falling back to the global dynamic handler if no guild handler is registered.
