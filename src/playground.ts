/**
 * Scratch runner. `npm run play -- owner/repo` — nothing here ships.
 */

import { allChecks } from './core/checks/index.js';
import type { CheckInput } from './core/types.js';
import { GitHubClient } from './data/github/client.js';
import { GitHubApiError } from './data/github/errors.js';
import { toFileIndex, toRepoSummary } from './data/github/mappers.js';

const [owner, repo] = (process.argv[2] ?? 'react/react').split('/');

if (!owner || !repo) {
  console.error('usage: npm run play -- owner/repo');
  process.exit(1);
}

const client = new GitHubClient(process.env.GITHUB_TOKEN);

try {
  const repoSummary = toRepoSummary(await client.fetchRepo(owner, repo));
  const files = toFileIndex(
    await client.fetchTree(repoSummary.owner, repoSummary.name, repoSummary.defaultBranch),
  );

  const input: CheckInput = { repo: repoSummary, files, now: new Date() };

  console.log(`\n${repoSummary.owner}/${repoSummary.name}\n`);
  for (const check of allChecks) {
    const result = check(input);
    console.log(`[${result.status.padEnd(7)}] ${result.title}`);
    for (const evidence of result.evidence) {
      console.log(`            ${evidence.text}`);
    }
  }
} catch (error) {
  if (error instanceof GitHubApiError) {
    console.error(`${error.name}: ${error.message}`);
  } else {
    throw error;
  }
}

console.log('\nrate limit:', client.rateLimit);
