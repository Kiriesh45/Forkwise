/**
 * Scratch file for experiments. Run it with `npm run play`.
 * Nothing here is production code — it exists so you can poke at types and
 * see results immediately. It will be deleted before v0.1.0.
 */

import type { CheckResult, RepoSummary } from './core/types.js';

const repo: RepoSummary = {
  owner: 'facebook',
  name: 'react',
  description: 'The library for web and native user interfaces.',
  licenseId: 'MIT',
  defaultBranch: 'main',
  primaryLanguage: 'JavaScript',
  pushedAt: '2026-08-01T10:00:00Z',
  createdAt: '2013-05-24T16:15:54Z',
  stars: 232000,
  openIssuesAndPrs: 900,
  isArchived: false,
  isFork: false,
};

const check: CheckResult = {
  id: 'has-security-policy',
  title: 'Security policy present',
  status: 'fail',
  weight: 3,
  evidence: [{ text: 'No SECURITY.md found in the repository root' }],
  fix: 'Add a SECURITY.md describing how to report vulnerabilities privately.',
};

console.log(`${repo.owner}/${repo.name} — license: ${repo.licenseId}`);
console.log(`[${check.status}] ${check.title} — ${check.evidence[0]?.text}`);
