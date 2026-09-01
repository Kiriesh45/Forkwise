import { fileCheck } from './file-check.js';

export const hasSecurityPolicy = fileCheck({
  id: 'has-security-policy',
  title: 'Security policy',
  weight: 2,
  /** The three locations GitHub looks in before showing the Security tab. */
  candidates: ['SECURITY.md', '.github/SECURITY.md', 'docs/SECURITY.md'],
  // A warning, not a failure: plenty of healthy small projects have no policy.
  // It signals maturity, not danger.
  missingStatus: 'warn',
  missingText: 'No SECURITY.md, so there is no stated way to report a vulnerability privately',
  advice:
    'There is no private channel for reporting a flaw you find, so expect to disclose it in a public issue.',
});
