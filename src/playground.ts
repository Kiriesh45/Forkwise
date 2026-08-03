/**
 * Scratch file for experiments. Run it with `npm run play`.
 * Nothing here is production code — it exists so you can poke at types and
 * see results immediately. It will be deleted before v0.1.0.
 */

import type { RepoSummary } from './core/types.js';

const example: RepoSummary = {
  owner: 'facebook',
  name: 'react',
  licenseId: 'MIT',
  pushedAt: '2026-08-01T10:00:00Z',
  stars: 232000,
  openIssues: 900,
  isArchived: false,
  isFork: false,
};

console.log(`${example.owner}/${example.name} — license: ${example.licenseId}`);
