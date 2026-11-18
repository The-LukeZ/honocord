---
"honocord": major
---

Merge the cache adapter packages into `honocord`. The separate `@honocord/cache-*` packages no longer exist and are exposed as subpath exports instead:

- `@honocord/cache-base` -> `honocord/cache`
- `@honocord/cache-memory` -> `honocord/cache/memory`
- `@honocord/cache-do` -> `honocord/cache/do`
- `@honocord/cache-mongo` -> `honocord/cache/mongo`

`mongoose` is an optional peer dependency, only needed when importing `honocord/cache/mongo`. To migrate, update your imports and uninstall the old `@honocord/cache-*` packages.

Also removed the unused `CacheAdapter` interface and `CacheSetOptions` type: they did not match `BaseCacheAdapter` (`delete()` returned `boolean`, `set()` took an options object instead of `ttlMs`). Extend `BaseCacheAdapter` for custom adapters. The `mset()` entry shape is now exported as `CacheEntry`.
