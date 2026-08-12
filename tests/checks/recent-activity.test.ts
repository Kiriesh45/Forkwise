import { describe, expect, it } from 'vitest';
import { recentActivity } from '../../src/core/checks/recent-activity.js';
import { daysAgo, makeInput } from '../helpers/check-input.js';

describe('recentActivity', () => {
  it('passes a repository pushed within three months', () => {
    const result = recentActivity(makeInput({ repo: { pushedAt: daysAgo(30) } }));

    expect(result.status).toBe('pass');
  });

  it('warns between three months and a year', () => {
    const result = recentActivity(makeInput({ repo: { pushedAt: daysAgo(200) } }));

    expect(result.status).toBe('warn');
  });

  it('fails after a year', () => {
    const result = recentActivity(makeInput({ repo: { pushedAt: daysAgo(400) } }));

    expect(result.status).toBe('fail');
  });

  it('treats the boundaries as inclusive', () => {
    expect(recentActivity(makeInput({ repo: { pushedAt: daysAgo(90) } })).status).toBe('pass');
    expect(recentActivity(makeInput({ repo: { pushedAt: daysAgo(365) } })).status).toBe('warn');
  });
});
