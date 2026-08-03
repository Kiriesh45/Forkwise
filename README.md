# Forkwise

> Know what you're pulling in. A browser extension that scores the health and security of any GitHub repository, right on the page.

**Status: early development (week 1). Not usable yet.**

## The problem

Developers pick dependencies by star count. Stars measure popularity, not health.
A repository can have 4,000 stars and still be unmaintained for two years, have a
single maintainer, ship no license, and depend on packages with known CVEs.

Finding that out today means opening six tabs and reading manually.

## The idea

Open any repository on GitHub. Forkwise shows a panel with:

- **Project hygiene** — README, LICENSE, SECURITY.md, CONTRIBUTING, tests, CI
- **Activity** — last commit, contributors in the last 90 days, archived status
- **Dependencies** — known vulnerabilities, via the [OSV.dev](https://osv.dev) database
- **A transparent score** — every point is explained and linked to its evidence

No account. No backend. No telemetry. Requests go only to `api.github.com` and
`api.osv.dev`, straight from your browser.

## Status

| Milestone | State |
| --- | --- |
| v0.1.0 — MVP | in progress |

See the [roadmap](https://github.com/kiresh/forkwise/issues) for details.

## Development

Requires Node.js 20+.

```bash
npm install
npm run typecheck
```

## License

MIT — see [LICENSE](LICENSE).
