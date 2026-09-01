import { describe, expect, it } from 'vitest';
import type { CheckResult, CheckStatus, RepoAnalysis } from '../src/core/types.js';
import { verdictFor } from '../src/core/verdict.js';

interface Finding {
  id: string;
  status: CheckStatus;
  weight: number;
  ceiling?: number;
  consequence?: string;
}

function check({ id, status, weight, ceiling, consequence }: Finding): CheckResult {
  return {
    id,
    title: id,
    status,
    weight,
    evidence: [],
    ...(ceiling === undefined ? {} : { ceiling }),
    ...(consequence === undefined ? {} : { consequence }),
  };
}

function analysis(score: number | null, findings: Finding[]): RepoAnalysis {
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
    checks: findings.map(check),
    generatedAt: '2026-08-12T00:00:00Z',
    score,
    scoringVersion: '1',
  };
}

describe('verdictFor', () => {
  it('leads with the finding that caps the score hardest, not the heaviest one', () => {
    const verdict = verdictFor(
      analysis(30, [
        { id: 'has-license', status: 'fail', weight: 9, ceiling: 45, consequence: 'No license' },
        { id: 'not-archived', status: 'fail', weight: 1, ceiling: 30, consequence: 'Archived' },
      ]),
    );

    expect(verdict.headline).toBe('Archived');
    expect(verdict.detail).toBe('No license');
  });

  it('falls back to weight between findings that cap the score alike', () => {
    const verdict = verdictFor(
      analysis(40, [
        { id: 'light', status: 'fail', weight: 1, ceiling: 45, consequence: 'Light' },
        { id: 'heavy', status: 'fail', weight: 5, ceiling: 45, consequence: 'Heavy' },
      ]),
    );

    expect(verdict.headline).toBe('Heavy');
  });

  it('never headlines a finding that left the score untouched', () => {
    // The regression this rule exists for: a well-run library abandoned three
    // years ago fails one check that sets no ceiling, so it still scores 87.
    // Announcing the gap over a green 87 reads as a broken tool.
    const verdict = verdictFor(
      analysis(87, [
        { id: 'recent-activity', status: 'fail', weight: 4, consequence: 'No commits in 3 years' },
      ]),
    );

    expect(verdict.headline).toBe('Looks safe to depend on');
  });

  it('never lets a warning into the headline, however it is worded', () => {
    // Heuristics are only allowed to warn, so this is the rule that stops a
    // guess from being stated as a fact at the top of the panel.
    const verdict = verdictFor(
      analysis(60, [{ id: 'has-tests', status: 'warn', weight: 4, consequence: 'No tests found' }]),
    );

    expect(verdict.headline).toBe('Usable, with gaps');
    expect(verdict.detail).toBeNull();
  });

  it('ignores a failing check that has nothing to say to the reader', () => {
    const verdict = verdictFor(analysis(85, [{ id: 'has-readme', status: 'fail', weight: 3 }]));

    expect(verdict.headline).toBe('Looks safe to depend on');
  });

  it('stops at two findings, however many failed', () => {
    const verdict = verdictFor(
      analysis(20, [
        { id: 'a', status: 'fail', weight: 5, ceiling: 30, consequence: 'First' },
        { id: 'b', status: 'fail', weight: 5, ceiling: 45, consequence: 'Second' },
        { id: 'c', status: 'fail', weight: 5, ceiling: 50, consequence: 'Third' },
      ]),
    );

    expect(verdict.headline).toBe('First');
    expect(verdict.detail).toBe('Second');
  });

  it('leaves the detail empty when a single finding decided it', () => {
    const verdict = verdictFor(
      analysis(30, [
        { id: 'not-archived', status: 'fail', weight: 5, ceiling: 30, consequence: 'Archived' },
      ]),
    );

    expect(verdict.detail).toBeNull();
  });

  it('admits it does not know rather than guessing at a headline', () => {
    expect(verdictFor(analysis(null, [])).headline).toBe('Not enough data to judge');
  });
});
