import { describe, expect, it } from 'vitest';
import { noKnownVulnerabilities } from '../../src/core/checks/no-known-vulnerabilities.js';
import type { Vulnerability } from '../../src/core/types.js';
import { makeInput } from '../helpers/check-input.js';

const LODASH: Vulnerability = {
  id: 'GHSA-35jh-r3h4-6jhm',
  packageName: 'lodash',
  severity: 'HIGH',
  summary: 'Command Injection in lodash',
  url: 'https://osv.dev/vulnerability/GHSA-35jh-r3h4-6jhm',
};

describe('noKnownVulnerabilities', () => {
  it('fails on a finding, because an advisory is a fact and not a guess', () => {
    const result = noKnownVulnerabilities(
      makeInput({
        vulnerabilities: {
          kind: 'checked',
          vulnerabilities: [LODASH],
          packagesChecked: 10,
          packagesSkipped: 0,
        },
      }),
    );

    expect(result.status).toBe('fail');
    expect(result.evidence[0]?.text).toContain('HIGH');
    expect(result.evidence[0]?.url).toContain('GHSA-35jh-r3h4-6jhm');
  });

  it('passes when the database knows nothing against the packages it saw', () => {
    const result = noKnownVulnerabilities(
      makeInput({
        vulnerabilities: {
          kind: 'checked',
          vulnerabilities: [],
          packagesChecked: 10,
          packagesSkipped: 0,
        },
      }),
    );

    expect(result.status).toBe('pass');
  });

  it('admits in the evidence how much of the manifest it could not check', () => {
    const result = noKnownVulnerabilities(
      makeInput({
        vulnerabilities: {
          kind: 'checked',
          vulnerabilities: [],
          packagesChecked: 4,
          packagesSkipped: 24,
        },
      }),
    );

    // "Clean" over four of twenty-eight packages is not the same claim as
    // "clean", and the panel must not let a reader confuse them.
    expect(result.evidence[0]?.text).toContain('4 of 28');
  });

  it('reports unknown when nothing could be looked up', () => {
    const result = noKnownVulnerabilities(
      makeInput({ vulnerabilities: { kind: 'not-checked', reason: 'No package.json' } }),
    );

    expect(result.status).toBe('unknown');
    expect(result.evidence[0]?.text).toBe('No package.json');
  });
});
