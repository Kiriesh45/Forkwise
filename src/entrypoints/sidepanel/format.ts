import type { CheckResult, CheckStatus } from '../../core/types.js';
import type { AnalysisError, Freshness } from '../../messaging.js';

/**
 * Presentation logic, kept out of the components so it can be tested without
 * rendering anything.
 */

export type ScoreBand = 'good' | 'fair' | 'poor' | 'unknown';

/**
 * Bands, not a gradient: a score of 71 versus 73 means nothing, and colouring
 * them differently would imply a precision the model does not have.
 */
export function scoreBand(score: number | null): ScoreBand {
  if (score === null) {
    return 'unknown';
  }
  if (score >= 80) {
    return 'good';
  }
  return score >= 50 ? 'fair' : 'poor';
}

export function describeAge(ageMs: number): string {
  // Rounded down, not to nearest: half a minute has not been "a minute ago",
  // and an age should never claim to be older than it is.
  const minutes = Math.floor(ageMs / 60_000);
  if (minutes < 1) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours} h ago` : `${Math.round(hours / 24)} d ago`;
}

export function describeFreshness(freshness: Freshness): string {
  switch (freshness.kind) {
    case 'fresh':
      return 'Checked just now';
    case 'cached':
      return `Checked ${describeAge(freshness.ageMs)}`;
    case 'stale':
      return `Checked ${describeAge(freshness.ageMs)}, could not refresh`;
  }
}

export interface Notice {
  title: string;
  detail: string;
}

/** One screen per failure, phrased for someone who did not cause the problem. */
export function describeError(error: AnalysisError, now: Date): Notice {
  switch (error.kind) {
    case 'not-found':
      return {
        title: 'Repository not available',
        detail: 'It may be private, renamed or deleted. Forkwise only reads public data.',
      };
    case 'rate-limited':
      return {
        title: 'GitHub request limit reached',
        detail: `Without a token GitHub allows 60 requests an hour. ${untilReset(error, now)} Adding a token in the settings raises the limit to 5000.`,
      };
    case 'invalid-token':
      return {
        title: 'GitHub rejected the stored token',
        detail: 'It has probably expired. Replace or remove it in the settings.',
      };
    case 'unavailable':
      return {
        title: 'Could not reach GitHub',
        detail: 'Check your connection and try again.',
      };
    case 'unknown':
      return {
        title: 'Something went wrong',
        detail: 'The details are in the extension console.',
      };
  }
}

function untilReset(error: AnalysisError, now: Date): string {
  if (error.resetAt === undefined) {
    return '';
  }
  const minutes = Math.ceil((new Date(error.resetAt).getTime() - now.getTime()) / 60_000);
  return minutes > 0 ? `It resets in ${minutes} min.` : 'It should have reset by now.';
}

/** Worst first, and within each status the order the registry declared. */
const DISPLAY_ORDER: Record<CheckStatus, number> = { fail: 0, warn: 1, unknown: 2, pass: 3 };

/**
 * The registry is ordered by how much each check matters. A reader scanning a
 * panel wants the problems first, so status wins and importance breaks ties.
 */
export function sortForDisplay(checks: CheckResult[]): CheckResult[] {
  return [...checks].sort((a, b) => DISPLAY_ORDER[a.status] - DISPLAY_ORDER[b.status]);
}
