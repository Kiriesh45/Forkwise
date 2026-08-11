/**
 * Scratch runner. `npm run play -- owner/repo` — nothing here ships.
 */

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
  const summary = toRepoSummary(await client.fetchRepo(owner, repo));
  const files = toFileIndex(
    await client.fetchTree(summary.owner, summary.name, summary.defaultBranch),
  );

  console.log(`${summary.owner}/${summary.name} — license:`, summary.license);
  console.log('tree complete:', files.isComplete);
  console.log('readme:      ', files.find('README.md', 'readme.md', 'README'));
  console.log('license file:', files.find('LICENSE', 'LICENSE.md', 'LICENCE'));
  console.log('security:    ', files.find('SECURITY.md', '.github/SECURITY.md'));
  console.log('workflows:   ', files.hasUnder('.github/workflows'));
} catch (error) {
  if (error instanceof GitHubApiError) {
    console.error(`${error.name}: ${error.message}`);
  } else {
    throw error;
  }
}

console.log('rate limit:', client.rateLimit);
