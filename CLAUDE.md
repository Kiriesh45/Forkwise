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
   what it does, where it sits in the architecture, and *why it is built this
   way rather than the obvious alternative*. The "why" matters most — that is
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
npm run typecheck   # tsc --noEmit, must be green before committing
npm run play        # scratch runner, src/playground.ts
npm run lesson      # TypeScript teaching file, src/lessons/
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

Stage 0 complete: repository skeleton, strict TypeScript setup, domain types in
`src/core/types.ts` (`RepoSummary`, `CheckStatus`, `Evidence`, `CheckResult`,
`RepoAnalysis`).

**Next: Stage 1 — the GitHub data layer.** See `docs/ROADMAP.md`.
