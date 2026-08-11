/**
 * Scratch runner. `npm run play -- owner/repo` — nothing here ships.
 */

import { GitHubClient } from './data/github/client.js';
import { GitHubApiError } from './data/github/errors.js';
import { toRepoSummary } from './data/github/mappers.js';

const [owner, repo] = (process.argv[2] ?? 'react/react').split('/');

if (!owner || !repo) {
  console.error('usage: npm run play -- owner/repo');
  process.exit(1);
}

const client = new GitHubClient(process.env.GITHUB_TOKEN);

try {
  const summary = toRepoSummary(await client.fetchRepo(owner, repo));
  console.log(summary);

  // Canonical names from the response, not the ones we asked for.
  const tree = await client.fetchTree(summary.owner, summary.name, summary.defaultBranch);
  console.log('files:', tree.tree.length, '| truncated:', tree.truncated);
} catch (error) {
  if (error instanceof GitHubApiError) {
    console.error(`${error.name}: ${error.message}`);
  } else {
    throw error;
  }
}

console.log('rate limit:', client.rateLimit);
