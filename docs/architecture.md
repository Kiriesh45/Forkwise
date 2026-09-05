# Architecture

## The shape of it

```
src/
  core/        pure TypeScript: no fetch, no chrome.*, no clock
    checks/      one file per check, registered in index.ts
    scoring.ts   check results -> a score
    types.ts     the domain vocabulary
  data/        everything that talks to the outside world
    github/      REST client, raw response shapes, mappers
    osv/         vulnerability lookups
    npm/         manifest and lockfile parsing
    cache/       chrome.storage.local behind a narrow port
  analysis/    composition: fetches what checks need, runs them, scores them
  entrypoints/ the extension itself
```

The dependency arrows only point one way: `entrypoints` → `analysis` →
(`core`, `data`), and `core` depends on nothing.

## Why the analysis logic is pure

`src/core/` may not call `fetch`, touch `chrome.*`, or read the clock. Anything
a check needs arrives as an argument, including the current time.

Three things follow:

- **Tests run in milliseconds** against hand-written inputs, with no network,
  no browser and no mocking framework.
- **A test for "abandoned for two years" keeps meaning that** in two years,
  because the clock is an argument rather than an ambient fact.
- **The engine is not tied to the extension.** The same code runs under
  `npm run play` in Node today, and could run in a CLI or a GitHub Action
  without a line changed.

The cost is ceremony: `analyze-repo.ts` has to fetch everything up front,
because a check cannot go and get anything itself. That is the trade, and it is
worth it.

## Why `data/` owns the foreign vocabulary

GitHub returns about a hundred fields per repository under names like
`stargazers_count` and `open_issues_count`. `RepoSummary` has twelve fields
with our names. `mappers.ts` is the only place the two meet.

When GitHub changes something, one file breaks instead of twenty. The mapping
layer is also where foreign traps get defused once and for all — the honest
name `openIssuesAndPrs` exists because GitHub's counter includes pull requests,
and every check would otherwise have to remember that.

## The three extension contexts

```
content script  ──message──►  background worker  ──storage──►  side panel
(least trusted)               (all network access)             (Preact UI)
```

- **Content script** runs inside github.com, alongside scripts we do not
  control. It reads the address bar and nothing else — no DOM scraping, no page
  data — and it cannot write to storage. It reports; the worker decides.
- **Background service worker** holds `host_permissions`, so it is the only
  context that can reach the APIs without the page's CORS rules applying, and
  the only one that ever sees the user's token. It is also terminated whenever
  Chrome feels like it, so nothing is kept in module-level variables.
- **Side panel** renders. It never fetches anything itself.

Everything crossing between them is declared in `src/messaging.ts` and must
survive structured cloning: no class instances, no `Date`. An `Error` sent
across this boundary arrives as an empty object, which is why failures are
converted to a plain `AnalysisError` on the worker side.

## The request budget

GitHub allows 60 API requests an hour without a token. One analysis costs:

| Request              | Always?                         |
| -------------------- | ------------------------------- |
| repository metadata  | yes                             |
| file tree, recursive | yes                             |
| recent commits       | yes                             |
| `package.json`       | only if the tree says it exists |
| `package-lock.json`  | only if the tree says it exists |

Up to five, so roughly twelve repositories an hour unauthenticated. This single
constraint explains most of the design: one recursive tree request instead of
one per directory, a manifest fetched only when it is known to exist, a
24-hour cache, and an optional token.

OSV requests do not count against GitHub's budget. They are still bounded: one
batch query for every package, then at most eight detail lookups.

## Cache

`chrome.storage.local`, keyed by `analysis:<format>:<scoring version>:owner/repo`.

Including the scoring version means changing a weight invalidates every entry
at once, instead of leaving old numbers to be compared against new ones.

Entries are written under both the requested and the canonical name, because
renamed repositories answer through a redirect: `facebook/react` and
`react/react` are one analysis, not two.

Expired entries are kept, not deleted. When a refresh fails — usually because
the budget is spent — the panel shows the old result and says how old it is.

## Deliberate non-goals

- **No backend.** Requests go to `api.github.com` and `api.osv.dev` from the
  user's own browser. This is why the extension needs no privacy policy beyond
  "nothing is collected".
- **No telemetry.** A security tool that phones home is not a security tool.
- **No remote code.** Forbidden by Manifest V3, and we would not want it.
