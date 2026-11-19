# honocord

## 4.1.0

### Minor Changes

- 0e16ad9: Require Node.js 24 or newer (`engines.node` is now `>=24`).

### Patch Changes

- 4f1ab1b: Export `AutocompleteHelper` from the package entry point. It was documented but could not be imported.

## 4.0.0

### Major Changes

- 1592944: Merge the cache adapter packages into `honocord`. The separate `@honocord/cache-*` packages no longer exist and are exposed as subpath exports instead:

  - `@honocord/cache-base` -> `honocord/cache`
  - `@honocord/cache-memory` -> `honocord/cache/memory`
  - `@honocord/cache-do` -> `honocord/cache/do`
  - `@honocord/cache-mongo` -> `honocord/cache/mongo`

  `mongoose` is an optional peer dependency, only needed when importing `honocord/cache/mongo`. To migrate, update your imports and uninstall the old `@honocord/cache-*` packages.

  Also removed the unused `CacheAdapter` interface and `CacheSetOptions` type: they did not match `BaseCacheAdapter` (`delete()` returned `boolean`, `set()` took an options object instead of `ttlMs`). Extend `BaseCacheAdapter` for custom adapters. The `mset()` entry shape is now exported as `CacheEntry`.

### Patch Changes

- a9cb3fc: Fix `main`, `types` and `exports` to point at the files tsdown actually emits (`index.cjs`, `index.mjs`, `index.d.cts`, `index.d.mts`). `require()` and CJS type resolution previously pointed at missing `dist/index.js` / `dist/index.d.ts`.
- bd266f6: Update dependencies: `@discordjs/builders` 1.15.0, `@discordjs/core` 2.7.0, `discord-api-types` 0.38.58.

## 3.2.0

### Minor Changes

- ee95cdb: Add dynamic command handlers for slash commands and context menu commands. Register `DynamicGuildSlashCommandHandler` / `DynamicGlobalSlashCommandHandler` and `DynamicGuildContextCommandHandler` / `DynamicGlobalContextCommandHandler` via `loadHandlers` to catch interactions whose command name isn't known ahead of time (e.g. per-guild custom commands) or that don't match any registered handler. Guild-scoped dynamic handlers are tried first for guild interactions, falling back to the global dynamic handler if no guild handler is registered.

## 3.1.0

### Minor Changes

- 10bdca2: Export previously-internal types needed for full type coverage of the public API: `HonocordOptions`, `HonocordAppOptions`, `CommandInteraction`, `UserContextInteraction`, `MessageContextInteraction`, `AutocompleteInteraction`, `AutocompleteFocusedOption`, `APIModalData` (and its `BaseModalData`/`TextInputModalData`/`SelectMenuModalData` members), `BlankVariables`, `CachedDMChannel`, `CachedThreadChannel`, `CachedTextGuildChannel`, `CachedVoiceGuildChannel`, `NamespaceAccessor`, `MemberNamespaceAccessor`, and the `Colors` interface. These were already reachable through other exported types' signatures but couldn't be imported or named directly.

  Also added comprehensive JSDoc coverage across the library's public classes, methods, and types, improving editor IntelliSense and powering the new auto-generated API reference docs.

## 3.0.1

### Patch Changes

- 8837133: Fix partial guild role caching for interaction payloads; roles.list() now reflects the full guild role set from Discord instead of a truncated interaction-resolved subset.

## 3.0.0

### Major Changes

- 83a3c57: Move `hono` and `mongoose` to peerDependencies. Consumers must now install these themselves (`hono@^4.13.1`, `mongoose@^9.9.1`).

## 2.2.0

### Minor Changes

- c0aad78: Add DM channel caching support with user ID lookups

## 2.1.1

### Patch Changes

- cd2f46b: chore: update deps and restructure deps for docs
