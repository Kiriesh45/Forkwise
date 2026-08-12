import type { Check } from '../types.js';

const id = 'not-archived';
const title = 'Actively maintained';
const weight = 5;

/**
 * Archiving is an explicit statement by the owner that the project is
 * read-only. Unlike every other signal here this is not an inference — it is
 * the maintainer telling you not to expect fixes.
 */
export const notArchived: Check = ({ repo }) => {
  if (!repo.isArchived) {
    return { id, title, weight, status: 'pass', evidence: [{ text: 'The repository is active' }] };
  }

  return {
    id,
    title,
    weight,
    status: 'fail',
    evidence: [
      { text: 'The owner archived this repository: it is read-only and will not be fixed' },
    ],
    fix: 'Look for a maintained fork before depending on this.',
    // No documentation, test suite or release cadence changes what the owner
    // has already announced.
    ceiling: 30,
  };
};
