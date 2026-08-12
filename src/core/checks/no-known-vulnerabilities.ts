import type { Check, Evidence, Vulnerability } from '../types.js';

const id = 'no-known-vulnerabilities';
const title = 'No known vulnerable dependencies';
const weight = 5;

/** Beyond this the panel becomes a wall of text; the count carries the rest. */
const MAX_LISTED = 5;

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
    fix: 'Update the affected packages, or check whether a patched release exists.',
  };
};

function describe(vulnerability: Vulnerability): Evidence {
  const severity = vulnerability.severity === null ? '' : `${vulnerability.severity}: `;
  const what = vulnerability.summary ?? vulnerability.id;

  return { text: `${severity}${vulnerability.packageName} — ${what}`, url: vulnerability.url };
}
