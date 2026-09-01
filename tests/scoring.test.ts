import { describe, expect, it } from 'vitest';
import { scoreBand, scoreReport } from '../src/core/scoring.js';
import type { CheckResult, CheckStatus, RepoReport } from '../src/core/types.js';

function check(id: string, status: CheckStatus, weight: number, ceiling?: number): CheckResult {
  return {
    id,
    title: id,
    status,
    weight,
    evidence: [],
    ...(ceiling === undefined ? {} : { ceiling }),
  };
}

function report(checks: CheckResult[]): RepoReport {
  return {
    repo: {
      owner: 'acme',
      name: 'widget',
      description: null,
      license: { kind: 'spdx', id: 'MIT' },
      defaultBranch: 'main',
      primaryLanguage: null,
      pushedAt: '2026-08-01T00:00:00Z',
      createdAt: '2020-01-01T00:00:00Z',
      stars: 0,
      openIssuesAndPrs: 0,
      isArchived: false,
      isFork: false,
    },
    checks,
    generatedAt: '2026-08-12T00:00:00Z',
  };
}

describe('scoreReport', () => {
  it('gives full marks when everything passes', () => {
    const { score } = scoreReport(report([check('a', 'pass', 5), check('b', 'pass', 1)]));

    expect(score).toBe(100);
  });

  it('gives a warning half the weight', () => {
    const { score } = scoreReport(report([check('a', 'warn', 10)]));

    expect(score).toBe(50);
  });

  it('leaves unknown checks out of the denominator instead of failing them', () => {
    const { score } = scoreReport(report([check('a', 'pass', 5), check('b', 'unknown', 95)]));

    // Counting the unknown as a failure would produce 5.
    expect(score).toBe(100);
  });

  it('returns null when nothing could be determined', () => {
    const { score } = scoreReport(report([check('a', 'unknown', 5)]));

    expect(score).toBeNull();
  });

  it('applies a ceiling declared by a failing check', () => {
    // facebookarchive/draft-js scored 64 before ceilings existed.
    const checks = [
      check('not-archived', 'fail', 5, 30),
      ...Array.from({ length: 20 }, (_, index) => check(`filler-${index}`, 'pass', 5)),
    ];

    expect(scoreReport(report(checks)).score).toBe(30);
  });

  it('takes the lowest ceiling when several findings declare one', () => {
    const checks = [
      check('not-archived', 'fail', 5, 30),
      check('has-license', 'fail', 5, 45),
      ...Array.from({ length: 20 }, (_, index) => check(`filler-${index}`, 'pass', 5)),
    ];

    expect(scoreReport(report(checks)).score).toBe(30);
  });

  it('ignores a ceiling on a check that did not fail', () => {
    // A check that passes has found nothing to cap the score with.
    const checks = [check('a', 'pass', 5, 10), check('b', 'warn', 5)];

    expect(scoreReport(report(checks)).score).toBe(75);
  });

  it('leaves the weighted score alone when nothing fatal failed', () => {
    const { score } = scoreReport(report([check('has-readme', 'fail', 1), check('b', 'pass', 1)]));

    expect(score).toBe(50);
  });

  it('stamps the scoring version so stale cache entries can be spotted', () => {
    expect(scoreReport(report([check('a', 'pass', 1)])).scoringVersion).toBe('2');
  });
});

describe('scoreBand', () => {
  it('bands a score rather than shading it', () => {
    expect(scoreBand(95)).toBe('good');
    expect(scoreBand(80)).toBe('good');
    expect(scoreBand(79)).toBe('fair');
    expect(scoreBand(50)).toBe('fair');
    expect(scoreBand(49)).toBe('poor');
  });

  it('has a band for having no score at all', () => {
    expect(scoreBand(null)).toBe('unknown');
  });
});
