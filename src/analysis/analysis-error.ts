import {
  GitHubUnavailable,
  InvalidToken,
  RateLimited,
  RepoNotFound,
} from '../data/github/errors.js';
import type { AnalysisError } from '../messaging.js';

/**
 * Turns a thrown error into something that survives the trip to the panel.
 *
 * The panel shows a different screen for each `kind`, so the classification
 * has to happen here, on the side that still has the original error object.
 */
export function toAnalysisError(error: unknown): AnalysisError {
  if (error instanceof RepoNotFound) {
    return { kind: 'not-found', message: error.message };
  }

  if (error instanceof RateLimited) {
    return {
      kind: 'rate-limited',
      message: 'GitHub API rate limit reached',
      resetAt: error.resetAt.toISOString(),
    };
  }

  if (error instanceof InvalidToken) {
    return { kind: 'invalid-token', message: error.message };
  }

  if (error instanceof GitHubUnavailable) {
    return { kind: 'unavailable', message: 'GitHub is unreachable' };
  }

  // Deliberately vague: an unexpected error may carry internals, and the panel
  // is not the place to leak them. The console keeps the real one.
  console.error('Forkwise: unexpected analysis failure', error);
  return { kind: 'unknown', message: 'Something went wrong while analysing this repository' };
}
