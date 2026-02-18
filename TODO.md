# TODO

Add caching for channels, guilds and users:

```json package.json
"./memory-cache": {
  "import": "./dist/memory-cache.mjs",
  "require": "./dist/memory-cache.js",
  "types": "./dist/memory-cache.d.ts",
  "default": "./dist/memory-cache.mjs",
  "node": "./dist/memory-cache.mjs",
  "module-sync": "./dist/memory-cache.js"
},
"./mongo-cache": {
  "import": "./dist/mongo-cache.mjs",
  "require": "./dist/mongo-cache.js",
  "types": "./dist/mongo-cache.d.ts",
  "default": "./dist/mongo-cache.mjs",
  "node": "./dist/mongo-cache.mjs",
  "module-sync": "./dist/mongo-cache.js"
},
```
