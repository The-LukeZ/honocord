# Security Policy

## Scope

This policy covers vulnerabilities in **honocord** itself: its source, the published npm
package, and anything this repository ships. That includes Discord request signature
verification and the bundled cache adapters.

Out of scope: bots built with honocord, Discord itself, Cloudflare, MongoDB, and the
discord.js packages honocord depends on. Report those to their maintainers.

## Reporting a vulnerability

Please report privately. Do **not** open a public issue for a security report.

- Use GitHub's [private vulnerability reporting](https://github.com/The-LukeZ/honocord/security/advisories/new)
  (the repository's _Security_ tab, then _Report a vulnerability_).

Include the affected file or component, a minimal reproduction, the impact as you understand it,
and any fix you have in mind.

## What to expect

- Credit in the release notes if you would like it; coordinated disclosure once a fix has landed.

This project is maintained on a best-effort basis, so there are no fixed response times.

## Supported versions

Fixes land on `main` and go out in the next release. There is no back-port of
security fixes to older versions; update to the latest release.
