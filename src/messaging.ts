import type { RepoLocation } from './core/repo-url.js';
import type { RepoAnalysis } from './core/types.js';

/**
 * Everything that crosses between the three extension contexts, typed in one
 * place so a sender and a receiver cannot drift apart silently.
 *
 * Every shape here has to survive structured cloning. That rules out class
 * instances, `Date` and functions: an `Error` sent across this boundary
 * arrives as an empty object, taking its message and its type with it.
 */

export type ForkwiseMessage =
  | { type: 'repo-detected'; repo: RepoLocation | null }
  | { type: 'analyze'; repo: RepoLocation }
  /** The token is checked before it is stored, so a typo is caught immediately. */
  | { type: 'verify-token'; token: string };

export type TokenCheckResponse =
  { ok: true; limit: number; remaining: number } | { ok: false; message: string };

/** Why an analysis could not be produced, in a form the panel can render. */
export interface AnalysisError {
  kind: 'not-found' | 'rate-limited' | 'invalid-token' | 'unavailable' | 'unknown';
  message: string;
  /** ISO 8601, present only for 'rate-limited'. */
  resetAt?: string;
}

/**
 * Where the shown analysis came from. The panel must never present a day-old
 * cached result as if it had just been measured.
 */
export type Freshness =
  | { kind: 'fresh' }
  | { kind: 'cached'; ageMs: number }
  /** Past its TTL, shown anyway because refreshing it failed. */
  | { kind: 'stale'; ageMs: number; reason: AnalysisError };

export interface RateLimitStatus {
  limit: number;
  remaining: number;
  /** ISO 8601. */
  resetAt: string;
}

export type AnalysisResponse =
  | {
      ok: true;
      analysis: RepoAnalysis;
      freshness: Freshness;
      /** Absent for a cached answer, which cost no requests to produce. */
      rateLimit?: RateLimitStatus;
    }
  | { ok: false; error: AnalysisError };

/**
 * Key in `chrome.storage.session` holding the repository currently on screen.
 *
 * Session storage, not local: this is throwaway state about the current
 * browsing session and has no business surviving a browser restart on disk.
 */
export const CURRENT_REPO_KEY = 'currentRepo';
