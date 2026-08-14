# Forkwise — project instructions

## What this project is

A Chrome extension (Manifest V3) that scores the health and security of any
GitHub repository, shown in a side panel while browsing github.com.

**Audience: the consumer of a repository, not its maintainer.** The question we
answer is "should I depend on this?", not "how do I improve my repo". This
distinction drives every product decision — if a feature only helps
maintainers, it is out of scope.

Read `docs/ROADMAP.md` for the full plan to v0.1.0.

## Who you are working with

The author is a first-year cybersecurity student. Solid on Git and security
fundamentals, some React Native exposure, **new to TypeScript and completely
new to browser extensions**.

The project has two goals of equal weight: ship a working extension, and teach
the author how it works. A correct solution the author does not understand is
a failed solution.

## How to work in this repository

**Communicate with the author in Russian. Write all code, comments, commit
messages and documentation in English.**

Working agreement:

1. **You write the code, the author reviews it.** Do not assign large writing
   exercises. The author learns by reading and questioning working code.
2. **Explain before and after, not instead.** Every chunk of code comes with:
   what it does, where it sits in the architecture, and _why it is built this
   way rather than the obvious alternative_. The "why" matters most — that is
   the part that cannot be looked up.
3. **Small steps.** One coherent piece per turn, then stop and check
   understanding. Never dump a whole stage at once.
4. **Name the trade-offs.** When a decision could reasonably go the other way,
   say so and give your reasoning. Deliberately deferred decisions go in
   `docs/decisions/`.
5. **Teach the mistakes too.** When something breaks — a failing typecheck, a
   rate limit, a sleeping service worker — treat it as material, not as noise
   to hide.
6. **Do not skip ahead.** Follow the roadmap order. If a stage looks easy,
   it still gets its own explanation.

## Architecture rules

These are not stylistic preferences. Breaking them costs a rewrite later.

- **`src/core/` is pure.** No `fetch`, no `chrome.*`, no `Date.now()`, no
  randomness. Everything a check needs arrives as an argument. This is what
  makes the analysis logic testable in milliseconds and reusable in a future
  CLI.
- **`src/data/` owns all I/O** and translates foreign API shapes into our own
  domain types (`src/core/types.ts`). GitHub's field names never leak past
  this layer.
- **All network calls live in the background service worker.** Not in the
  content script, not in the panel. It holds `host_permissions`, avoids page
  CORS, and keeps the user's token out of a context shared with page scripts.
- **No backend, ever.** Requests go only to `api.github.com` and `api.osv.dev`,
  from the user's browser. "Nothing leaves your machine" is a core promise, not
  an implementation detail.
- **No telemetry, no analytics, no remote code.** MV3 forbids remote code, and
  a security tool that phones home is not a security tool.
- **Every claim needs evidence.** A `CheckResult` without an `Evidence` entry
  explaining it is a bug.

## Code voice

The author must be able to defend every line of this repository in an
interview. Code that reads as machine-generated boilerplate fails that test
even when it works. Concretely:

- **Comments explain _why_, never _what_.** A comment that restates the code
  below it is deleted. Good comments record a trap, a rejected alternative, or
  a fact about the outside world — e.g. GitHub's `open_issues_count` including
  pull requests.
- **No JSDoc on self-evident functions.** Document a module's purpose and the
  surprising parts; leave the obvious alone.
- **No abstraction with a single implementation.** No interface, factory or
  wrapper introduced "in case we need it later". Add it when the second case
  actually arrives.
- **No defensive `try/catch` without a named failure mode.** If you cannot say
  what throws and what the user should see, do not catch it.
- **Names come from the domain**, never `data`, `result`, `item`,
  `handleData`, `processItem`. No `utils.ts` or `helpers.ts` — if a function
  has no home, the module boundaries are wrong.
- **No emoji** in code, comments, commit messages or documentation.
- **Real `TODO`s stay**, with the author's name and a date. Unresolved
  questions are part of an honest codebase.
- **The README never promises what the code does not yet do.**

Process rules that support this:

- The author writes the commit messages and runs the commits.
- The author renames anything that does not fit their taste; this is their
  codebase, not a delivery.
- At the end of each stage the author explains the module back, and you probe
  it with "why not the other way?" and "what breaks if...".
- Decisions, including rejected options, go in `docs/decisions/` in the
  author's own words.

## Conventions

- TypeScript in strict mode. `npm run typecheck` must pass before every commit.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
  Small, focused commits — one logical change each.
- File names in kebab-case; types in PascalCase; functions in camelCase.
- One check per file in `src/core/checks/`, registered in `index.ts`. Adding a
  check must never require editing shared logic.
- `unknown` is a first-class check status. It means "could not determine" and
  is excluded from the score denominator — never treated as a failure.
- Check ids are permanent. Once released, an id is never renamed.

## Commands

```bash
npm run format:check   # prettier
npm run lint           # eslint, type-aware rules
npm run typecheck      # tsc --noEmit
npm test               # vitest
npm run play -- owner/repo   # scratch runner against the live API
```

## Hard constraints to keep in mind

- **GitHub API: 60 requests/hour unauthenticated.** One analysis costs 2–3
  requests. Caching is not an optimisation here, it is a requirement.
- The GitHub UI is a Turbo SPA — navigating between repositories does not
  reload the page, so content scripts must detect soft navigation.
- MV3 service workers are terminated when idle. No state in module variables;
  use `chrome.storage`.
- `chrome.storage.local` is not encrypted. If the user stores a token, the UI
  must say so plainly.

## Out of scope for v0.1.0

Secret scanning, ecosystems other than npm, GitLab, a CLI, any backend, AI
analysis, telemetry. These are v0.2+ and should not be started early.

## Current state

<!-- Keep this section updated: rewrite it at the end of every stage so a fresh
     session knows exactly where the work stands. -->

Stages 0 through 7 complete: the extension runs in Chrome and analyses the
repository the user is looking at.

- `src/entrypoints/`: background worker (all network access), content script
  (URL only, no DOM), side panel, options page.
- `src/data/cache/`: 24-hour cache in `chrome.storage.local`, keyed by scoring
  version, stored under both requested and canonical names, capped at 200
  entries, serving stale results when a refresh fails.
- `src/data/settings.ts`: optional GitHub token, verified against `/rate_limit`
  before it is stored.
- React side panel: score header, checks sorted worst-first with expandable
  evidence, and a screen for every failure mode. Presentation logic lives in
  `sidepanel/format.ts` and is unit tested.
- 77 tests. ESLint runs `react-hooks` rules as well as the type-aware set.

Stage 9 is built too: generated icons (`npm run icons`), README, SECURITY,
CONTRIBUTING, CHANGELOG, issue and pull request templates, architecture, threat
model, privacy policy and store listing text. Version is 0.1.0.

Outstanding before the tag:

- `docs/demo.gif` is referenced by the README and does not exist yet. Only the
  author can record it.
- `docs/decisions/0002` on choosing TypeScript 5.9 over 7 is still unwritten.
- React costs about 195 kB of the 230 kB bundle. Aliasing preact/compat would
  remove most of it.

Previously — stages 0 to 5, the analysis engine, all runnable in Node:

- Eleven checks, scoring with ceilings (`docs/scoring.md`), 50 tests, CI
  running format, lint, typecheck and tests.
- `src/data/osv/` queries osv.dev; `src/data/npm/` parses manifests and
  lockfiles.
- Up to five GitHub requests per analysis, plus OSV requests that do not count
  against the GitHub budget.

Open calibration question: a known vulnerability currently subtracts weight
but sets no ceiling, so `npm/cli` scores 79 with a live MODERATE advisory.

Previously:

- Ten checks in `src/core/checks/`, registered in `index.ts`. File-presence
  checks are generated by `fileCheck`; the rest are hand-written.
- `src/analysis/analyze-repo.ts` composes the data layer and the checks into a
  `RepoReport`. Three API requests per analysis.
- `npm run play -- owner/repo` prints every check result.

Previously:

- Domain types in `src/core/types.ts`: `RepoSummary`, `LicenseInfo`,
  `CheckStatus`, `Evidence`, `CheckResult`, `RepoAnalysis`.
- GitHub data layer in `src/data/github/`: raw response shapes, typed error
  classes, a client with timeout and rate-limit tracking, and the mapper into
  `RepoSummary`.
- `npm run play -- owner/repo` fetches a real repository and its file tree.

Known debt: API responses are asserted, not validated (see
`docs/decisions/0001-no-runtime-validation.md`). `tsconfig.json` exposes Node
types to the whole project, which must be narrowed once browser code exists.

**Next: Stage 2 — checks.** See `docs/ROADMAP.md`.
