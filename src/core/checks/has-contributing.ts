import { fileCheck } from './file-check.js';

export const hasContributing = fileCheck({
  id: 'has-contributing',
  title: 'Contribution guide',
  weight: 1,
  candidates: ['CONTRIBUTING.md', '.github/CONTRIBUTING.md', 'docs/CONTRIBUTING.md'],
  missingStatus: 'warn',
  // No advice: a consumer cannot act on this, and inventing something for the
  // sake of filling the field is how the panel started addressing maintainers.
  missingText: 'No CONTRIBUTING guide, so the review and release process is undocumented',
});
