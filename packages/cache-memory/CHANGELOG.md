# @honocord/cache-memory

## 0.2.1

### Patch Changes

- 4955881: Declare `@honocord/cache-base` as a real dependency instead of resolving it through tsconfig `paths`. The adapters no longer inline the base adapter's code into their own bundle — it is now installed and imported as a shared package, so consumers get a single `BaseCacheAdapter` identity across adapters.

  Also fixes `@honocord/cache-do` failing to build: it imported types from `@cloudflare/workers-types`, which is a global ambient declaration file with no exports.

## 0.2.0

### Minor Changes

- aac3e27: feat: add changesets
