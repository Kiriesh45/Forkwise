/**
 * Scratch runner. `npm run play -- owner/repo` — nothing here ships.
 */

import { analyzeRepo } from './analysis/analyze-repo.js';
import { GitHubClient } from './data/github/client.js';
import { GitHubApiError } from './data/github/errors.js';
import { parseDependencies } from './data/npm/dependencies.js';

const [owner, repo] = (process.argv[2] ?? 'react/react').split('/');

if (!owner || !repo) {
  console.error('usage: npm run play -- owner/repo');
  process.exit(1);
}

const client = new GitHubClient(process.env.GITHUB_TOKEN);

try {
  const report = await analyzeRepo(client, owner, repo);

  console.log(`\n${report.repo.owner}/${report.repo.name} — ${report.score ?? '—'}/100\n`);
  for (const check of report.checks) {
    console.log(`[${check.status.padEnd(7)}] ${check.title}`);
    for (const evidence of check.evidence) {
      console.log(`            ${evidence.text}`);
    }
  }
  // Temporary probe: dependencies are not part of the report until the
  // vulnerability check exists to carry them.
  const manifest = await client.fetchTextFile(
    report.repo.owner,
    report.repo.name,
    'package.json',
    report.repo.defaultBranch,
  );
  const lock = await client.fetchTextFile(
    report.repo.owner,
    report.repo.name,
    'package-lock.json',
    report.repo.defaultBranch,
  );

  if (manifest.kind === 'found') {
    const info = parseDependencies(manifest.text, lock.kind === 'found' ? lock.text : null);
    if (info.kind === 'resolved') {
      const known = info.dependencies.filter((dependency) => dependency.version !== null);
      console.log(
        `\ndependencies: ${info.dependencies.length} direct, ${known.length} with a known version` +
          ` (lockfile: ${info.fromLockfile})`,
      );
      console.log(info.dependencies.slice(0, 5));
    } else {
      console.log('\ndependencies:', info);
    }
  } else {
    console.log('\ndependencies: no package.json');
  }
} catch (error) {
  if (error instanceof GitHubApiError) {
    console.error(`${error.name}: ${error.message}`);
  } else {
    throw error;
  }
}

console.log('\nrate limit:', client.rateLimit);
