import { describe, expect, it } from 'vitest';
import type { CheckResult, CheckStatus } from '../src/core/types.js';
import {
  describeAge,
  describeBudget,
  describeError,
  describeFreshness,
  groupForDisplay,
} from '../src/entrypoints/sidepanel/format.js';

const NOW = new Date('2026-08-12T12:00:00Z');

function check(id: string, status: CheckStatus): CheckResult {
  return { id, title: id, status, weight: 1, evidence: [] };
}

describe('describeBudget', () => {
  const resetAt = '2026-08-12T13:00:00Z';

  it('says nothing while the budget is not the reader’s problem', () => {
    expect(describeBudget({ limit: 60, remaining: 54, resetAt })).toBeNull();
  });

  it('speaks up once the panel is close to stopping', () => {
    expect(describeBudget({ limit: 60, remaining: 4, resetAt })).toContain('4 of 60');
  });

  it('says nothing for a cached answer, which spent no budget', () => {
    expect(describeBudget(undefined)).toBeNull();
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

describe('groupForDisplay', () => {
  it('puts problems first and keeps registry order within a status', () => {
    const { findings } = groupForDisplay([
      check('a-pass', 'pass'),
      check('b-unknown', 'unknown'),
      check('c-fail', 'fail'),
      check('d-warn', 'warn'),
      check('e-fail', 'fail'),
    ]);

    expect(findings.map((result) => result.id)).toEqual([
      'c-fail',
      'e-fail',
      'd-warn',
      'b-unknown',
    ]);
  });

  it('keeps passes out of the findings, however many there are', () => {
    const { findings, passed } = groupForDisplay([
      check('a-pass', 'pass'),
      check('b-pass', 'pass'),
      check('c-fail', 'fail'),
    ]);

    expect(findings).toHaveLength(1);
    expect(passed.map((result) => result.id)).toEqual(['a-pass', 'b-pass']);
  });

  it('treats unknown as something to show, not something to hide', () => {
    // An unknown is a question we could not answer, which the reader has to see
    // to know the score was computed without it.
    const { findings, passed } = groupForDisplay([check('a-unknown', 'unknown')]);

    expect(findings.map((result) => result.id)).toEqual(['a-unknown']);
    expect(passed).toEqual([]);
  });
});
