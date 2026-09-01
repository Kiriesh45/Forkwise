import type { Check, Evidence, Vulnerability } from '../types.js';

const id = 'no-known-vulnerabilities';
const title = 'No known vulnerable dependencies';
const weight = 5;

/** Beyond this the panel becomes a wall of text; the count carries the rest. */
const MAX_LISTED = 5;

/**
 * Applied when an advisory is known to be critical or high severity.
 *
 * 45 rather than 50 because `scoreBand` calls 50 "fair": at the old value the
 * worst security finding this tool can make was painted amber and labelled
 * FAIR. It matches the missing-license ceiling deliberately — an exploitable
 * dependency disqualifies a repository no less than an unusable license does.
 */
const SEVERE_CEILING = 45;

/**
 * Applied to any confirmed advisory, whatever its severity.
 *
 * Without it a single moderate advisory left the score at 86, and the panel
 * opened with "Looks safe to depend on" directly above its own red row naming
 * the advisory. This is not a claim that the finding is severe — it is the
 * model refusing to call a repository good while it knows something is wrong
 * with its dependencies.
 */
const VULNERABLE_CEILING = 70;

/**
 * The only check backed by an external security database rather than by
 * inference, so a finding is a fact and `fail` is justified.
 *
 * It reports on direct dependencies with a known exact version. Everything it
 * could not check is stated in the evidence rather than passed over silently —
 * "no vulnerabilities found in the four packages we could resolve" is a very
 * different claim from "this project is clean".
 */
export const noKnownVulnerabilities: Check = ({ vulnerabilities }) => {
  if (vulnerabilities.kind === 'not-checked') {
    return {
      id,
      title,
      weight,
      status: 'unknown',
      evidence: [{ text: vulnerabilities.reason }],
    };
  }

  const { packagesChecked, packagesSkipped } = vulnerabilities;
  const coverage =
    packagesSkipped === 0
      ? `${packagesChecked} direct dependencies checked`
      : `${packagesChecked} of ${packagesChecked + packagesSkipped} direct dependencies checked; ` +
        `the rest declare version ranges that no lockfile resolves`;

  if (vulnerabilities.vulnerabilities.length === 0) {
    return { id, title, weight, status: 'pass', evidence: [{ text: coverage }] };
  }

  return {
    id,
    title,
    weight,
    status: 'fail',
    evidence: [
      ...vulnerabilities.vulnerabilities.slice(0, MAX_LISTED).map(describe),
      { text: coverage },
    ],
    advice:
      'Depending on this means inheriting these. Check whether a newer release has updated them.',
    consequence: describeExposure(vulnerabilities.vulnerabilities),
    ceiling: hasSevereFinding(vulnerabilities.vulnerabilities)
      ? SEVERE_CEILING
      : VULNERABLE_CEILING,
  };
};

/**
 * Severity is named only when it was actually looked up. Advisories past the
 * detail budget arrive with a null severity, and calling those severe would be
 * inventing the worst case to make a better headline.
 */
function describeExposure(vulnerabilities: Vulnerability[]): string {
  const count =
    vulnerabilities.length === 1
      ? '1 dependency with a known vulnerability'
      : `${vulnerabilities.length} dependencies with known vulnerabilities`;

  return hasSevereFinding(vulnerabilities) ? `${count}, at least one severe` : count;
}

/**
 * Only findings we are sure about earn the harsher ceiling. Severity is missing
 * for advisories beyond the detail-lookup budget, and treating "unknown
 * severity" as severe would punish repositories for our own request limit.
 */
function hasSevereFinding(vulnerabilities: Vulnerability[]): boolean {
  return vulnerabilities.some(
    (vulnerability) => vulnerability.severity === 'CRITICAL' || vulnerability.severity === 'HIGH',
  );
}

function describe(vulnerability: Vulnerability): Evidence {
  const severity = vulnerability.severity === null ? '' : `${vulnerability.severity}: `;
  const what = vulnerability.summary ?? vulnerability.id;

  return { text: `${severity}${vulnerability.packageName} — ${what}`, url: vulnerability.url };
}
