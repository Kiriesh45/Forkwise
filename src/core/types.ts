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
  owner: string;
  name: string;
  /** Repo description, or null when the owner never wrote one. */
  description: string | null;
  /** SPDX id such as "MIT", or null when the repo has no license file. */
  licenseId: string | null;
  /** Branch to read files from. Not always "main" — old repos use "master". */
  defaultBranch: string;
  /** Dominant language by bytes, or null for empty/docs-only repos. */
  primaryLanguage: string | null;
  /** ISO 8601 timestamp of the last push. */
  pushedAt: string;
  /** ISO 8601 timestamp of creation. Needed to tell "young" from "abandoned". */
  createdAt: string;
  stars: number;
  /**
   * GitHub's open issue counter — which also counts open pull requests.
   * Named honestly so nobody builds a check on a wrong assumption.
   */
  openIssuesAndPrs: number;
  isArchived: boolean;
  isFork: boolean;
}

/** How a single check turned out. */
export type CheckStatus = 'pass' | 'warn' | 'fail' | 'unknown';

/**
 * One concrete fact backing a check result.
 *
 * Every claim Forkwise makes must be traceable to something the user can
 * verify. No evidence — no claim.
 */
export interface Evidence {
  /** Human-readable fact, e.g. "No SECURITY.md in the repository root". */
  text: string;
  /** Link to the file, commit or advisory. Absent when there is nothing to link to. */
  url?: string;
}

/** The output of one check. This is what the UI renders. */
export interface CheckResult {
  /** Stable machine id, e.g. "has-license". Never change it once released. */
  id: string;
  /** Short human title, e.g. "License file present". */
  title: string;
  status: CheckStatus;
  /** Relative importance in the final score. See docs/scoring.md. */
  weight: number;
  /** Always present — may be empty. See the note below on why. */
  evidence: Evidence[];
  /** Actionable advice. Only meaningful for 'warn' and 'fail'. */
  fix?: string;
}

/** The complete analysis of one repository — the top-level result. */
export interface RepoAnalysis {
  repo: RepoSummary;
  checks: CheckResult[];
  /** 0-100, derived from checks. Never stored, always recomputed. */
  score: number;
  /** Version of the scoring model, so old cached results can be invalidated. */
  scoringVersion: string;
  /** When this analysis was produced (ISO 8601). Drives cache expiry. */
  generatedAt: string;
}
