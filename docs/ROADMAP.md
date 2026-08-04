# Roadmap to v0.1.0 (MVP)

The build order is bottom-up: data layer → analysis logic → scoring → tests →
browser extension → UI. Every stage before stage 6 runs in plain Node and is
verifiable from the terminal. Debugging inside a browser extension is slow, so
we keep as much logic as possible outside of it.

| # | Stage | Deliverable | Runs in |
| --- | --- | --- | --- |
| 0 | Skeleton & domain types | `src/core/types.ts` | — |
| 1 | GitHub data layer | Real repo → `RepoSummary` + file tree | Node |
| 2 | Checks | 10 pure check functions | Node |
| 3 | Scoring | `RepoAnalysis` with a 0–100 score | Node |
| 4 | Tests & CI | Vitest suite, green GitHub Actions | CI |
| 5 | Dependency scanning | OSV.dev advisories for `package.json` | Node |
| 6 | Extension shell | WXT build, side panel opens on GitHub | Chrome |
| 7 | Cache & settings | `chrome.storage`, TTL, optional token | Chrome |
| 8 | UI | Score, checks, evidence, error states | Chrome |
| 9 | Release prep | Icons, docs, store listing, `v0.1.0` | — |

## Stage detail

### Stage 1 — GitHub data layer

- `src/data/github/api-types.ts` — raw API response shapes (only fields we read)
- `src/data/github/client.ts` — `fetch` wrapper: auth header, error mapping, rate-limit headers
- `src/data/github/mappers.ts` — raw response → `RepoSummary`
- `src/data/github/errors.ts` — `RepoNotFound`, `RateLimited`, `NetworkError`

Done when `npm run play facebook/react` prints real data and a readable error
for a repository that does not exist.

### Stage 2 — Checks

One file per check in `src/core/checks/`, each a pure function
`(input) => CheckResult`. No `fetch`, no `chrome.*`, no `Date.now()` — all
inputs are arguments.

MVP set: README, LICENSE, SECURITY.md, CONTRIBUTING, description, tests
present, CI configured, recent activity, archived, contributor count.

Done when every check returns a result for hand-written fixture data.

### Stage 3 — Scoring

`src/core/scoring.ts` plus `docs/scoring.md` documenting the weights and their
rationale. `unknown` checks are excluded from the denominator rather than
counted as failures.

Done when a full `RepoAnalysis` is produced end to end from a real repository.

### Stage 4 — Tests & CI

Vitest unit tests over fixtures for every check and for scoring edge cases
(empty repo, archived repo, no data). GitHub Actions running lint, typecheck
and tests on every push and pull request.

Done when the badge is green and a broken check fails the build.

### Stage 5 — Dependency scanning

`src/data/osv.ts` — batch query to the OSV.dev API. Parses `package.json`
dependency ranges into concrete versions where possible; reports "unknown"
rather than guessing when it cannot.

Done when a repository with a known-vulnerable dependency reports it.

### Stage 6 — Extension shell

WXT project with three entry points: background service worker (all network
calls), content script (detects `owner/repo`, survives GitHub's client-side
navigation), side panel (UI host). Typed message passing between them.

Done when opening a repository shows raw JSON analysis in the side panel.

### Stage 7 — Cache & settings

`chrome.storage.local` cache keyed by `owner/repo` + scoring version, with a
24-hour TTL. Options page for an optional read-only GitHub token, with an
explicit warning that extension storage is not encrypted. Remaining rate limit
surfaced in the UI.

Done when a second visit to the same repository makes zero network requests.

### Stage 8 — UI

React side panel: score header, grouped checks, expandable evidence with
links, and explicit loading / error / rate-limited / non-repository states.

Done when the panel is usable without reading any documentation.

### Stage 9 — Release prep

Icons, README with a demo GIF, `docs/architecture.md`, `docs/threat-model.md`,
`CONTRIBUTING.md`, issue templates, privacy policy, per-permission
justification for the Chrome Web Store, `CHANGELOG.md`, tag `v0.1.0`.

## Explicitly out of scope for v0.1.0

Secret scanning, non-npm ecosystems, GitLab support, a CLI, any backend
service, AI-based analysis, telemetry.
