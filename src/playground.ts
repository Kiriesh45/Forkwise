/**
 * Runs the whole analysis in a terminal: `npm run play -- owner/repo`.
 *
 * Not part of the extension bundle — it is not an entry point — but it is the
 * fastest way to work on checks, because the engine has no browser
 * dependencies at all. Debugging the same logic through three extension
 * consoles costs minutes per iteration instead of seconds.
 */

import { analyzeRepo } from './analysis/analyze-repo.js';
import { GitHubClient } from './data/github/client.js';
import { GitHubApiError } from './data/github/errors.js';
import { OsvClient } from './data/osv/client.js';

const [owner, repo] = (process.argv[2] ?? 'react/react').split('/');

if (!owner || !repo) {
  console.error('usage: npm run play -- owner/repo');
  process.exit(1);
}

const github = new GitHubClient(process.env.GITHUB_TOKEN);

try {
  const report = await analyzeRepo({ github, osv: new OsvClient() }, owner, repo);

  console.log(`\n${report.repo.owner}/${report.repo.name} — ${report.score ?? '—'}/100\n`);
  for (const check of report.checks) {
    console.log(`[${check.status.padEnd(7)}] ${check.title}`);
    for (const evidence of check.evidence) {
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

console.log('\nrate limit:', github.rateLimit);
