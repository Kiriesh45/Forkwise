# How the score is calculated

Scoring model version: **2** (`SCORING_VERSION` in `src/core/scoring.ts`).

The number is a summary of the checks, never a replacement for them. Anything
the score says must be traceable to a check result and its evidence.

## Principles

1. **`unknown` is excluded, never counted as a failure.** When GitHub truncates
   a file tree we cannot see whether `SECURITY.md` exists. That is our
   limitation, not the repository's fault, so the check leaves the denominator
   as well as the numerator.
2. **A warning is worth half.** "No security policy" and "archived, will never
   be fixed" are different findings. A scale that treats them alike stops
   carrying information.
3. **Heuristics never fail, they warn.** Test and CI detection match on naming
   conventions and can be wrong. Only facts — an archived flag, a missing
   license — produce a `fail`.
4. **Fatal findings cap the score.** See below.
5. **No score is better than a made-up one.** If every check returns `unknown`,
   the score is `null` and the panel shows a dash.

## Arithmetic

```
score = round(100 * Σ(credit(status) × weight) / Σ(weight))
        over checks whose status is not `unknown`

credit: pass = 1, warn = 0.5, fail = 0
```

Then the score is capped by any fatal failure. Ceilings are declared by the
check that found the problem, not by a table here, because some of them depend
on the finding itself:

| Failing check                                         | Ceiling | Why                                                                                                                                                                                                      |
| ----------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `not-archived`                                        | 30      | The owner has stated the project is read-only. Documentation quality cannot change that.                                                                                                                 |
| `has-license`                                         | 45      | Without a license the default is "all rights reserved". However good the code is, you may not legally use it.                                                                                            |
| `no-known-vulnerabilities`, critical or high severity | 50      | Applied only when the severity was actually looked up. Treating an advisory we ran out of budget to inspect as severe would punish the repository for our request limit.                                 |
| `no-known-vulnerabilities`, any other severity        | 70      | The model refuses to call a repository good while it knows one of its dependencies has a published advisory. Not a claim of severity: at 70 the panel says "usable, with gaps", not "safe to depend on". |

`facebookarchive/draft-js` is the case that forced this: nine healthy signals
averaged out to 64 for a repository abandoned three years earlier.

Version 2 added the second vulnerability ceiling. Under version 1 a single
moderate advisory left the score at 86, and the panel opened with "Looks safe
to depend on" immediately above its own red row naming that advisory. The
headline is derived from the model, so the only honest place to fix that was
the model.

## Weights

Weights live next to each check, in `src/core/checks/`.

| Check                      | Weight | Reasoning                                                               |
| -------------------------- | ------ | ----------------------------------------------------------------------- |
| `not-archived`             | 5      | Stated by the owner, not inferred. Decides the answer on its own.       |
| `no-known-vulnerabilities` | 5      | The only check backed by a security database rather than inference.     |
| `has-license`              | 5      | Legal blocker, binary, verifiable.                                      |
| `recent-activity`          | 4      | The strongest available proxy for "will a bug get fixed".               |
| `has-tests`                | 4      | Predicts whether a release will quietly break dependents.               |
| `has-ci`                   | 3      | Tests that nobody runs automatically are tests that rot.                |
| `active-contributors`      | 3      | Bus factor. Sampled, so treated as a lower bound.                       |
| `has-readme`               | 3      | Absence usually means the project was never meant to be used by others. |
| `has-security-policy`      | 2      | Maturity signal; common to lack even in healthy projects.               |
| `has-contributing`         | 1      | Matters to contributors more than to consumers.                         |
| `has-description`          | 1      | Cheapest possible signal of care.                                       |

The reasoning column is the important one. The numbers are a first calibration
and will move; the argument for why one check outranks another should not.

## Versioning

`SCORING_VERSION` changes whenever weights, credits or ceilings change. Cached
analyses are keyed by it, so results produced under an older model are
discarded rather than compared against numbers that no longer mean the same
thing.

## Known limitations

- Weights are documented here but declared in the check files, so the two can
  drift. `tests/documented-weights.test.ts` reads this table and fails when
  they do. Ceilings have no such guard.
- Every threshold (90 days, three contributors, the ceilings) is a judgement
  call, not a measurement.
- The model treats all repositories alike. A stable, finished library is
  penalised for inactivity the same way an abandoned one is.
- Scores are not strictly comparable between repositories. Excluding `unknown`
  checks means two scores can be computed over different denominators —
  `torvalds/linux` is scored on seven checks, `sindresorhus/slugify` on nine.
- The scale saturates. Any well-run project reaches 100, so the model
  distinguishes bad from good but not good from excellent. That matches the
  question we answer — "can I depend on this?" — and would not survive being
  used as a ranking.
