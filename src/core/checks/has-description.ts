import type { Check } from '../types.js';

const id = 'has-description';
const title = 'Repository description';
const weight = 1;

/**
 * The cheapest maturity signal there is. A repository nobody bothered to
 * describe in one line is usually one nobody bothered to maintain either.
 */
export const hasDescription: Check = ({ repo }) => {
  const description = repo.description?.trim() ?? '';

  if (description.length > 0) {
    return { id, title, weight, status: 'pass', evidence: [{ text: description }] };
  }

  return {
    id,
    title,
    weight,
    status: 'warn',
    // No advice, for the same reason as the contribution guide: there is
    // nothing here for a reader to do.
    evidence: [{ text: 'The repository has no description' }],
  };
};
