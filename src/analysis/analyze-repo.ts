import type { FileIndex } from '../core/file-index.js';
import { allChecks } from '../core/checks/index.js';
import { scoreReport } from '../core/scoring.js';
import type { CheckInput, DependencyInfo, RepoAnalysis, RepoSummary } from '../core/types.js';
import type { GitHubClient } from '../data/github/client.js';
import { toCommitHistory, toFileIndex, toRepoSummary } from '../data/github/mappers.js';
import { parseDependencies } from '../data/npm/dependencies.js';

/**
 * Fetches what the checks need and runs them. The only place that knows both
 * layers exist — `core` stays pure, `data` stays ignorant of checks.
 *
 * The background service worker will call this. It is deliberately not a
 * class: there is no state to keep between analyses.
 */
export async function analyzeRepo(
  client: GitHubClient,
  owner: string,
  repo: string,
  now = new Date(),
): Promise<RepoAnalysis> {
  const summary = toRepoSummary(await client.fetchRepo(owner, repo));

  // Both depend on the canonical names, and neither depends on the other, so
  // they go out together: two round trips of latency instead of three.
  const [tree, commits] = await Promise.all([
    client.fetchTree(summary.owner, summary.name, summary.defaultBranch),
    client.fetchCommits(summary.owner, summary.name, summary.defaultBranch),
  ]);

  const files = toFileIndex(tree);

  const input: CheckInput = {
    repo: summary,
    files,
    history: toCommitHistory(commits),
    // Waits for the tree on purpose: the file list tells us whether these
    // requests are worth making at all.
    dependencies: await readDependencies(client, summary, files),
    now,
  };

  return scoreReport({
    repo: summary,
    checks: allChecks.map((check) => check(input)),
    generatedAt: now.toISOString(),
  });
}

async function readDependencies(
  client: GitHubClient,
  repo: RepoSummary,
  files: FileIndex,
): Promise<DependencyInfo> {
  const manifestPath = files.find('package.json');
  if (manifestPath === null) {
    return { kind: 'not-applicable' };
  }

  const lockPath = files.find('package-lock.json');
  const [manifest, lock] = await Promise.all([
    client.fetchTextFile(repo.owner, repo.name, manifestPath, repo.defaultBranch),
    lockPath === null
      ? Promise.resolve(null)
      : client.fetchTextFile(repo.owner, repo.name, lockPath, repo.defaultBranch),
  ]);

  if (manifest.kind === 'too-large') {
    return { kind: 'unavailable', reason: 'package.json is too large to read in the browser' };
  }
  if (manifest.kind === 'absent') {
    return { kind: 'unavailable', reason: 'package.json vanished between listing and reading' };
  }

  return parseDependencies(manifest.text, lock?.kind === 'found' ? lock.text : null);
}
