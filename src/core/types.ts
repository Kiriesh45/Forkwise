/**
 * Domain types for Forkwise.
 *
 * These describe the *shape of the data we care about* — deliberately not a
 * 1:1 copy of the GitHub API response. GitHub returns ~100 fields per
 * repository; we pick the handful that feed a check, and give them our own
 * names. That way, if GitHub changes its API, only the client layer breaks —
 * not the whole codebase.
 */

/** A repository, reduced to what Forkwise actually needs. */
export interface RepoSummary {
  /** e.g. "facebook" */
  owner: string;
  /** e.g. "react" */
  name: string;
  /** SPDX id such as "MIT", or null when the repo has no license file. */
  licenseId: string | null;
  /** ISO 8601 timestamp of the last push. */
  pushedAt: string;
  stars: number;
  openIssues: number;
  isArchived: boolean;
  isFork: boolean;

  // TODO(week 1): add the remaining fields you decide are worth keeping.
  // Look at https://api.github.com/repos/facebook/react in your browser and
  // pick them yourself. Ask: "could a check I described in the README use it?"
  // If no — leave it out.
}

// TODO(week 1): define `CheckStatus` as a union of the four literal strings
// 'pass' | 'warn' | 'fail' | 'unknown'.

// TODO(week 1): define `CheckResult` — the output of a single check.
// It needs at minimum: a stable id, a status, a weight, a human title,
// optional evidence (text + optional url), and an optional fix hint.
