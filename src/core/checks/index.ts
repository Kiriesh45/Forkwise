import type { Check } from '../types.js';
import { activeContributors } from './active-contributors.js';
import { hasCi } from './has-ci.js';
import { hasContributing } from './has-contributing.js';
import { hasDescription } from './has-description.js';
import { hasLicense } from './has-license.js';
import { hasReadme } from './has-readme.js';
import { hasSecurityPolicy } from './has-security-policy.js';
import { hasTests } from './has-tests.js';
import { noKnownVulnerabilities } from './no-known-vulnerabilities.js';
import { notArchived } from './not-archived.js';
import { recentActivity } from './recent-activity.js';

/**
 * Every check Forkwise runs, in the order the panel shows them: the ones that
 * change a decision first, the ones that describe polish last.
 *
 * Adding a check means adding a file and one line here. Nothing else in the
 * codebase needs to know it exists.
 */
export const allChecks: Check[] = [
  notArchived,
  noKnownVulnerabilities,
  hasLicense,
  recentActivity,
  activeContributors,
  hasTests,
  hasCi,
  hasReadme,
  hasSecurityPolicy,
  hasContributing,
  hasDescription,
];
