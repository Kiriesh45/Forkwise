import { fileCheck } from './file-check.js';

export const hasContributing = fileCheck({
  id: 'has-contributing',
  title: 'Contribution guide',
  weight: 1,
  candidates: ['CONTRIBUTING.md', '.github/CONTRIBUTING.md', 'docs/CONTRIBUTING.md'],
  missingStatus: 'warn',
  missingText: 'No CONTRIBUTING guide, so the review and release process is undocumented',
  fix: 'Add a CONTRIBUTING.md covering how to build, test and submit changes.',
});
