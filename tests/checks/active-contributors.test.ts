import { describe, expect, it } from 'vitest';
import { activeContributors } from '../../src/core/checks/active-contributors.js';
import { daysAgo, makeInput } from '../helpers/check-input.js';

function commitsBy(authors: string[], days = 10) {
  return authors.map((author) => ({ author, committedAt: daysAgo(days) }));
}

describe('activeContributors', () => {
  it('passes with three or more recent authors', () => {
    const result = activeContributors(makeInput({ commits: commitsBy(['ada', 'grace', 'alan']) }));

    expect(result.status).toBe('pass');
  });

  it('counts each author once, however many commits they made', () => {
    const result = activeContributors(
      makeInput({ commits: commitsBy(['ada', 'ada', 'ada', 'ada']) }),
    );

    expect(result.status).toBe('warn');
    expect(result.evidence[0]?.text).toContain('1 distinct');
  });

  it('ignores commits older than the window', () => {
    const result = activeContributors(
      makeInput({ commits: commitsBy(['ada', 'grace', 'alan'], 200) }),
    );

    expect(result.status).toBe('unknown');
  });

  it('says so when the count came from a truncated sample', () => {
    const result = activeContributors(
      makeInput({ commits: commitsBy(['ada']), commitsTruncated: true }),
    );

    expect(result.evidence[0]?.text).toContain('100 most recent');
  });
});
