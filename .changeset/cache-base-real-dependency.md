---
"@honocord/cache-memory": patch
"@honocord/cache-mongo": patch
"@honocord/cache-do": patch
---

Declare `@honocord/cache-base` as a real dependency instead of resolving it through tsconfig `paths`. The adapters no longer inline the base adapter's code into their own bundle — it is now installed and imported as a shared package, so consumers get a single `BaseCacheAdapter` identity across adapters.

Also fixes `@honocord/cache-do` failing to build: it imported types from `@cloudflare/workers-types`, which is a global ambient declaration file with no exports.
