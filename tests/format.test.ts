import { describe, expect, it } from 'vitest';
import type { CheckResult, CheckStatus } from '../src/core/types.js';
import {
  describeAge,
  describeError,
  describeFreshness,
  scoreBand,
  sortForDisplay,
} from '../src/entrypoints/sidepanel/format.js';

const NOW = new Date('2026-08-12T12:00:00Z');

function check(id: string, status: CheckStatus): CheckResult {
  return { id, title: id, status, weight: 1, evidence: [] };
}

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

describe('describeAge', () => {
  it('scales the unit to the age', () => {
    expect(describeAge(30_000)).toBe('just now');
    expect(describeAge(20 * 60_000)).toBe('20 min ago');
    expect(describeAge(3 * 60 * 60_000)).toBe('3 h ago');
    expect(describeAge(50 * 60 * 60_000)).toBe('2 d ago');
  });
});

describe('describeFreshness', () => {
  it('never lets cached data read as a fresh measurement', () => {
    expect(describeFreshness({ kind: 'fresh' })).toBe('Checked just now');
    expect(describeFreshness({ kind: 'cached', ageMs: 3 * 60 * 60_000 })).toBe('Checked 3 h ago');
    expect(
      describeFreshness({
        kind: 'stale',
        ageMs: 26 * 60 * 60_000,
        reason: { kind: 'rate-limited', message: 'limit' },
      }),
    ).toContain('could not refresh');
  });
});

describe('describeError', () => {
  it('tells the user when the limit resets', () => {
    const notice = describeError(
      { kind: 'rate-limited', message: 'limit', resetAt: '2026-08-12T12:43:00Z' },
      NOW,
    );

    expect(notice.detail).toContain('43 min');
  });

  it('copes with a reset time already in the past', () => {
    const notice = describeError(
      { kind: 'rate-limited', message: 'limit', resetAt: '2026-08-12T11:00:00Z' },
      NOW,
    );

    expect(notice.detail).toContain('should have reset');
  });

  it('does not blame the user for a missing repository', () => {
    const notice = describeError({ kind: 'not-found', message: 'gone' }, NOW);

    expect(notice.title).toBe('Repository not available');
  });
});

describe('sortForDisplay', () => {
  it('puts problems first and keeps registry order within a status', () => {
    const sorted = sortForDisplay([
      check('a-pass', 'pass'),
      check('b-unknown', 'unknown'),
      check('c-fail', 'fail'),
      check('d-warn', 'warn'),
      check('e-fail', 'fail'),
    ]);

    expect(sorted.map((result) => result.id)).toEqual([
      'c-fail',
      'e-fail',
      'd-warn',
      'b-unknown',
      'a-pass',
    ]);
  });
});
