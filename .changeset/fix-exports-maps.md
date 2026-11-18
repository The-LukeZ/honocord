---
"honocord": patch
"@honocord/cache-base": patch
"@honocord/cache-memory": patch
"@honocord/cache-do": patch
"@honocord/cache-mongo": patch
---

Fix `main`, `types` and `exports` to point at the files tsdown actually emits (`index.cjs`, `index.mjs`, `index.d.cts`, `index.d.mts`). `require()` and CJS type resolution previously pointed at missing `dist/index.js` / `dist/index.d.ts`.
