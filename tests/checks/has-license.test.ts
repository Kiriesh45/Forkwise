import { describe, expect, it } from 'vitest';
import { hasLicense } from '../../src/core/checks/has-license.js';
import { makeInput } from '../helpers/check-input.js';

describe('hasLicense', () => {
  it('passes a recognised license', () => {
    const result = hasLicense(makeInput({ repo: { license: { kind: 'spdx', id: 'MIT' } } }));

    expect(result.status).toBe('pass');
    expect(result.evidence[0]?.text).toContain('MIT');
  });

  it('warns when a license exists but nobody could identify it', () => {
    // torvalds/linux: GPL-2.0 with a syscall note, reported as NOASSERTION.
    // Collapsing this into "no license" would accuse the kernel of having none.
    const result = hasLicense(makeInput({ repo: { license: { kind: 'unidentified' } } }));

    expect(result.status).toBe('warn');
  });

  it('fails when there is no license at all', () => {
    const result = hasLicense(makeInput({ repo: { license: { kind: 'none' } } }));

    expect(result.status).toBe('fail');
  });
});
