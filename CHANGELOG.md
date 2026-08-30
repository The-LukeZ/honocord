# honocord

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
