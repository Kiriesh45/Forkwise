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
    evidence: [{ text: 'The repository has no description' }],
    fix: 'Add a one-line description so people can tell what this is without opening it.',
  };
};
