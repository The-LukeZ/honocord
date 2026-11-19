# Contributing

Thanks for considering a contribution to **honocord**. The essentials are below; the full
house rules live in [`CONVENTIONS.md`](CONVENTIONS.md).

## Prerequisites

- **Node.js 24+**
- **pnpm** (the version pinned in `packageManager` in `package.json`)

```bash
pnpm install
```

## Checks

CI runs these on every pull request. Run them before you push:

```bash
pnpm build              # Build the package
pnpm typecheck          # TypeScript check
pnpm test               # Vitest tests
pnpm check              # Prettier check (pnpm format fixes it)
```

Run a single test file with `pnpm vitest run src/tests/path/to/file.test.ts`.

## What a good change looks like

- **Keep the changeset complete.** A change updates any affected docs (README, the guides in
  `docs/`, JSDoc) in the **same** PR. Docs are part of the change, not a follow-up.
- **Add a changeset** with `pnpm changeset` for anything that changes package behavior. Pick the
  bump type by [semver](https://semver.org/): `patch` for fixes, `minor` for features, `major`
  for breaking changes.
- **Test behavior, type-check types.** Runtime behavior gets a Vitest test under `src/tests/`.
  Type-level guarantees go in `src/test/`, which `pnpm typecheck` checks.
- **Keep the public API documented.** New exports carry JSDoc, since the API reference is
  generated from it.

## Pull requests

- Branch off `main`; PRs target `main`.
- **Conventional commits** (`feat:` / `fix:` / `docs:` / `refactor:` / `test:` / `chore:`).
- Describe what you changed and why, and confirm the checks above pass.

By contributing you agree your work is licensed under the repository's
[MIT](LICENSE) license, and you agree to the
[Code of Conduct](CODE_OF_CONDUCT.md).
