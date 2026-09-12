import { describe, expect, it } from 'vitest';
import { allChecks } from '../src/core/checks/index.js';
import { verdictFor } from '../src/core/verdict.js';
import { scoreReport } from '../src/core/scoring.js';
import type { CheckInput, CheckResult } from '../src/core/types.js';
import { daysAgo, makeInput, NOW } from './helpers/check-input.js';

/**
 * Invariants every check has to satisfy, whatever it looks at.
 *
 * The individual check suites prove each one answers correctly. These prove
 * the answers fit together — the failures that are silent, where nothing
 * throws and the panel simply says less than it knows.
 */

/** Everything wrong at once, so every check reaches its failing branch. */
const WORST_CASE: CheckInput = makeInput({
  repo: {
    isArchived: true,
    license: { kind: 'none' },
    description: null,
    pushedAt: daysAgo(900),
  },
  files: [],
  commits: [],
  vulnerabilities: {
    kind: 'checked',
    vulnerabilities: [
      {
        id: 'GHSA-aaaa-bbbb-cccc',
        packageName: 'left-pad',
        severity: 'CRITICAL',
        summary: 'Something bad',
        url: 'https://osv.dev/vulnerability/GHSA-aaaa-bbbb-cccc',
      },
    ],
    packagesChecked: 4,
    packagesSkipped: 0,
  },
});

/** A repository with nothing wrong with it. */
const BEST_CASE: CheckInput = makeInput({
  files: ['README.md', 'LICENSE', 'SECURITY.md', 'CONTRIBUTING.md', 'src/app.test.ts'],
  commits: ['ada', 'grace', 'alan'].map((author) => ({ author, committedAt: daysAgo(3) })),
  vulnerabilities: {
    kind: 'checked',
    vulnerabilities: [],
    packagesChecked: 4,
    packagesSkipped: 0,
  },
});

function resultsFor(input: CheckInput): CheckResult[] {
  return allChecks.map((check) => check(input));
}

describe('every check result', () => {
  const everything = [...resultsFor(WORST_CASE), ...resultsFor(BEST_CASE)];

  it('explains itself', () => {
    for (const result of everything) {
      expect(result.evidence.length, `${result.id} produced no evidence`).toBeGreaterThan(0);
    }
  });

  it('uses an id and a title that a person can read', () => {
    for (const result of everything) {
      expect(result.id).toMatch(/^[a-z][a-z-]*$/);
      expect(result.title.length).toBeGreaterThan(0);
    }
  });

  it('pairs a ceiling with a consequence, in both directions', () => {
    // The verdict needs both: a ceiling without a consequence caps the score
    // and never explains why, and a consequence without a ceiling would put an
    // alarming headline above a comfortable number. Declaring one alone breaks
    // nothing loudly — it just makes the panel quieter than it should be.
    for (const result of everything) {
      expect(
        result.ceiling === undefined,
        `${result.id} declares one of ceiling/consequence without the other`,
      ).toBe(result.consequence === undefined);
    }
  });

  it('never caps the score inside the good band', () => {
    // A headline says "do not depend on this" while the number says "safe to".
    // Whichever the reader believes, the panel has lied to them once.
    for (const result of everything) {
      if (result.ceiling !== undefined) {
        expect(result.ceiling, `${result.id} has a ceiling in the good band`).toBeLessThan(80);
      }
    }
  });

  it('offers advice only when something is wrong with the repository', () => {
    for (const result of everything) {
      if (result.status === 'pass') {
        expect(
          result.advice,
          `${result.id} advises the reader about a passing check`,
        ).toBeUndefined();
      }
    }
  });
});

describe('the registry', () => {
  it('has no duplicate ids, which the cache and the panel both key on', () => {
    const ids = resultsFor(BEST_CASE).map((result) => result.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('agrees with the verdict on the worst case it can produce', () => {
    const analysis = scoreReport({
      repo: WORST_CASE.repo,
      checks: resultsFor(WORST_CASE),
      generatedAt: NOW.toISOString(),
    });

    // Nothing here is asserted about the wording: only that a repository this
    // broken gets a headline drawn from a finding rather than from the score,
    // and a number low enough to match it.
    expect(verdictFor(analysis).headline).not.toBe('Weak on several fronts');
    expect(analysis.score).toBeLessThan(50);
  });

  it('leads with the score when nothing failed outright', () => {
    const analysis = scoreReport({
      repo: BEST_CASE.repo,
      checks: resultsFor(BEST_CASE),
      generatedAt: NOW.toISOString(),
    });

    expect(verdictFor(analysis)).toEqual({ headline: 'Looks safe to depend on', detail: null });
  });
});
