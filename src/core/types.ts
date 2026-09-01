import type { FileIndex } from './file-index.js';

/**
 * Domain types for Forkwise.
 *
 * These describe the *shape of the data we care about* — deliberately not a
 * 1:1 copy of the GitHub API response. GitHub returns ~100 fields per
 * repository; we pick the handful that feed a check, and give them our own
 * names. That way, if GitHub changes its API, only the client layer breaks —
 * not the whole codebase.
 */

/**
 * What we know about a repository's license.
 *
 * Three states rather than "a name or nothing", because they lead to three
 * different verdicts: a recognised license is fine, a file nobody could
 * identify has to be read by hand, and no license at all means the code is
 * legally not reusable — which is the worst case, not the neutral one.
 */
export type LicenseInfo =
  { kind: 'spdx'; id: string } | { kind: 'unidentified' } | { kind: 'none' };

/** A repository, reduced to what Forkwise actually needs. */
export interface RepoSummary {
  owner: string;
  name: string;
  /** Repo description, or null when the owner never wrote one. */
  description: string | null;
  license: LicenseInfo;
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
  /**
   * What this finding means for someone deciding whether to depend on the
   * repository, phrased as a headline rather than as a fact: "Archived by its
   * owner, it will not be fixed" rather than "the archived flag is set".
   *
   * Read only by the opening verdict, and only off a failing check that also
   * declares a `ceiling` — stating a consequence without capping the score
   * would let an alarming headline sit above a comfortable number. Optional
   * because most findings have no business leading a verdict: a missing
   * CONTRIBUTING.md earns a row in the list and nothing more.
   */
  consequence?: string;
  /**
   * A score this finding refuses to let the repository exceed, however well it
   * does elsewhere. Set only for findings where no amount of polish changes
   * the answer.
   *
   * It lives on the result rather than in a table inside the scoring module
   * because the decision can depend on the data: a critical advisory earns a
   * ceiling, a low-severity one does not, and only the check can tell.
   */
  ceiling?: number;
}

/** A commit, reduced to the two things activity checks ask about. */
export interface CommitSummary {
  /** GitHub login when the commit maps to an account, otherwise the author name. */
  author: string;
  committedAt: string;
}

export interface CommitHistory {
  /** Newest first. */
  commits: CommitSummary[];
  /**
   * True when the sample filled a whole page, so older commits exist that we
   * did not look at. Any count derived from this is a lower bound.
   */
  isTruncated: boolean;
}

export interface Dependency {
  name: string;
  /**
   * The exact version that would be installed, or null when the manifest only
   * gives a range and no lock file resolved it. Never guessed: "^18.2.0" can
   * install anything from 18.2.0 to 18.99.99, and picking one would turn a
   * vulnerability report into a coin toss.
   */
  version: string | null;
}

/** What we could establish about a repository's npm dependencies. */
export type DependencyInfo =
  | { kind: 'not-applicable' }
  | { kind: 'unavailable'; reason: string }
  | { kind: 'resolved'; dependencies: Dependency[]; fromLockfile: boolean };

export interface Vulnerability {
  /** OSV or GHSA identifier, e.g. "GHSA-35jh-r3h4-6jhm". */
  id: string;
  packageName: string;
  /** "CRITICAL", "HIGH", "MODERATE", "LOW" — null when the advisory omits it. */
  severity: string | null;
  summary: string | null;
  url: string;
}

/** What we could establish about known vulnerabilities in the dependencies. */
export type VulnerabilityInfo =
  | { kind: 'not-checked'; reason: string }
  | {
      kind: 'checked';
      vulnerabilities: Vulnerability[];
      /** How many packages we had exact versions for and actually queried. */
      packagesChecked: number;
      /** Declared packages we had to skip, because their version was a range. */
      packagesSkipped: number;
    };

/**
 * Everything a check is allowed to look at.
 *
 * Adding a field here is a deliberate act: it widens what every check can
 * depend on, and each field has to be fetched before any check can run.
 */
export interface CheckInput {
  repo: RepoSummary;
  files: FileIndex;
  history: CommitHistory;
  dependencies: DependencyInfo;
  vulnerabilities: VulnerabilityInfo;
  /**
   * Passed in rather than read from the clock inside a check. Otherwise a test
   * for "abandoned for two years" would start failing two years from now.
   */
  now: Date;
}

/** Every check has this signature, which is what lets the registry be a plain array. */
export type Check = (input: CheckInput) => CheckResult;

/** Everything gathered and judged, before scoring turns it into a number. */
export interface RepoReport {
  repo: RepoSummary;
  checks: CheckResult[];
  /** When this report was produced (ISO 8601). Drives cache expiry. */
  generatedAt: string;
}

/** A report plus its score — the top-level result the panel renders. */
export interface RepoAnalysis extends RepoReport {
  /**
   * 0-100, derived from checks and always recomputed rather than stored beside
   * them. Null when every check came back `unknown` and there is nothing to
   * score.
   */
  score: number | null;
  /** Version of the scoring model, so old cached results can be invalidated. */
  scoringVersion: string;
}
