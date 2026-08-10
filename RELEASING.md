# Releasing

This repo uses [Changesets](https://github.com/changesets/changesets) to manage versioning and publishing.
Packages are versioned independently — a change to one package does not bump others.

## Packages

- `.`
- `packages/*`

---

## Day-to-day: making a change

Every PR that modifies a publishable package **must** include a changeset.

### 1. Make your changes as normal

```bash
git checkout -b my-feature
# ... make changes to packages/foo, packages/bar, etc.
```

### 2. Create a changeset

```bash
pnpm changeset
```

The interactive CLI will:

- Ask which packages your changes affect — **only select the ones you actually touched**
- Ask for a bump type per package:
  - `patch` — bug fixes, non-breaking tweaks
  - `minor` — new features, backwards compatible
  - `major` — breaking changes
- Ask for a short summary (this becomes the changelog entry)

This writes a `.changeset/some-random-name.md` file. **Commit it with your changes.**

```bash
git add .changeset/
git commit -m "feat(foo): add new thing"
```

### 3. Open a PR as normal

The changeset file is part of the PR. Reviewers can see what bump is intended and what the changelog will say.

---

## When changesets are merged to main

The release GitHub Action runs on every push to `main` and does one of two things:

### If there are pending changesets → opens/updates a "Version Packages" PR

The PR will:

- Bump the version in `package.json` for each affected package
- Update `CHANGELOG.md` for each affected package
- Leave unaffected packages completely untouched

You can keep merging feature PRs — the "Version Packages" PR will update itself each time, batching all pending changesets together.

### If there are no pending changesets → does nothing

### The `changeset-release/main` branch

This branch is **fully managed by the Action** — never push to it manually.

When the Action detects pending changesets, it creates or force-updates `changeset-release/main` with the version bumps already applied and opens (or updates) a "Version Packages" PR. The branch will be stale between releases; once you push new changesets, the Action refreshes it automatically.

---

## Cutting a release

When you're ready to ship:

1. **Review the "Version Packages" PR** — check the version bumps and changelog entries look correct
2. **Merge it**
3. The action then automatically:
   - Publishes the bumped packages to npm
   - Creates a GitHub Release per package with the changelog as release notes
   - Creates git tags (e.g. `packages-foo@1.2.0`)

There is nothing else to do manually.

---

## Cheat sheet

| Situation                                           | Command                                                  |
| --------------------------------------------------- | -------------------------------------------------------- |
| I changed a package and need to document it         | `pnpm changeset`                                         |
| I only changed tests, docs, or CI (no package code) | No changeset needed                                      |
| I want to see what would be released right now      | `pnpm changeset status`                                  |
| I want to release immediately without waiting       | Merge the "Version Packages" PR                          |
| I made a mistake in a changeset                     | Edit or delete the `.changeset/*.md` file and amend/push |

---

## Rules of thumb

- **One changeset per PR**, not per commit. The PR is the unit of change.
- **Don't manually edit `package.json` versions** — Changesets owns that.
- **Don't manually publish** — the CI action owns that.
- If a PR touches multiple packages, a single `pnpm changeset` run can cover all of them.
- If a package is `"private": true` in its `package.json`, Changesets will skip it automatically.
