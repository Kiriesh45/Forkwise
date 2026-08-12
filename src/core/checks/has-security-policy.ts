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
  fix: 'Add a SECURITY.md with a contact address and an expected response time.',
});
