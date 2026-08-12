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

  // Only the Weights section. The ceilings table above it has the same shape,
  // and reading both left the result depending on which came last in the file.
  const weightsSection = markdown.split('## Weights').at(1) ?? '';

  // Tolerant of padding: Prettier aligns markdown table columns, and a test
  // that breaks when the formatter runs is a test nobody keeps.
  const rows = weightsSection.matchAll(/^\|\s*`([a-z-]+)`\s*\|\s*(\d+)\s*\|/gm);

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
