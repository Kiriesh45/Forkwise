import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { allChecks } from '../src/core/checks/index.js';
import { makeInput } from './helpers/check-input.js';

/**
 * Weights are declared in the check files and explained in docs/scoring.md.
 * Two homes means they can drift, and a scoring model whose documentation
 * lies is worse than one with no documentation at all. This test is the
 * cheapest way to keep them honest.
 */
function documentedWeights(): Map<string, number> {
  const markdown = readFileSync(new URL('../docs/scoring.md', import.meta.url), 'utf8');
  const rows = markdown.matchAll(/^\| `([a-z-]+)` \| (\d+) \|/gm);

  return new Map([...rows].map(([, id, weight]) => [id as string, Number(weight)]));
}

describe('docs/scoring.md', () => {
  const documented = documentedWeights();
  const actual = allChecks.map((check) => check(makeInput()));

  it('lists every check', () => {
    expect([...documented.keys()].sort()).toEqual(actual.map((check) => check.id).sort());
  });

  it.each(actual)('states the real weight of $id', ({ id, weight }) => {
    expect(documented.get(id)).toBe(weight);
  });
});
