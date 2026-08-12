import type { CheckResult, CheckStatus, RepoAnalysis, RepoReport } from './types.js';

/**
 * Bump this whenever weights or the arithmetic change. Cached analyses are
 * keyed by it, so old results are discarded instead of being compared against
 * numbers that mean something different.
 */
export const SCORING_VERSION = '1';

/**
 * The share of a check's weight each status awards.
 *
 * A warning is worth half rather than nothing: "no SECURITY.md" and "archived,
 * will never be fixed" are not the same finding, and a scale that treats them
 * alike stops carrying information.
 */
const CREDIT: Record<Exclude<CheckStatus, 'unknown'>, number> = {
  pass: 1,
  warn: 0.5,
  fail: 0,
};

export function scoreReport(report: RepoReport): RepoAnalysis {
  return {
    ...report,
    score: scoreChecks(report.checks),
    scoringVersion: SCORING_VERSION,
  };
}

/**
 * Null when nothing could be determined at all. A repository we know nothing
 * about must not be handed a number — a confident 0 would be a lie, and a
 * confident 50 would be a guess dressed up as a measurement.
 */
function scoreChecks(checks: CheckResult[]): number | null {
  let earned = 0;
  let available = 0;

  for (const check of checks) {
    // Excluded from the denominator, not counted as a failure: a truncated
    // file tree is our limitation, not the repository's fault.
    if (check.status === 'unknown') {
      continue;
    }
    earned += CREDIT[check.status] * check.weight;
    available += check.weight;
  }

  if (available === 0) {
    return null;
  }

  const weighted = Math.round((earned / available) * 100);
  return Math.min(weighted, ...ceilings(checks));
}

/**
 * Empty when nothing fatal failed, which leaves the weighted score untouched.
 *
 * A weighted average otherwise lets nine cosmetic passes bury one fatal
 * finding: an archived repository with good docs scored 64, which reads as
 * "fine".
 */
function ceilings(checks: CheckResult[]): number[] {
  return checks
    .filter((check) => check.status === 'fail')
    .map((check) => check.ceiling)
    .filter((ceiling): ceiling is number => ceiling !== undefined);
}
