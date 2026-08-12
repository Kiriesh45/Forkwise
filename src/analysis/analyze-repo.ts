import { allChecks } from '../core/checks/index.js';
import type { CheckInput, RepoReport } from '../core/types.js';
import type { GitHubClient } from '../data/github/client.js';
import { toCommitHistory, toFileIndex, toRepoSummary } from '../data/github/mappers.js';

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
): Promise<RepoReport> {
  const summary = toRepoSummary(await client.fetchRepo(owner, repo));

  // Both depend on the canonical names, and neither depends on the other, so
  // they go out together: two round trips of latency instead of three.
  const [tree, commits] = await Promise.all([
    client.fetchTree(summary.owner, summary.name, summary.defaultBranch),
    client.fetchCommits(summary.owner, summary.name, summary.defaultBranch),
  ]);

  const input: CheckInput = {
    repo: summary,
    files: toFileIndex(tree),
    history: toCommitHistory(commits),
    now,
  };

  return {
    repo: summary,
    checks: allChecks.map((check) => check(input)),
    generatedAt: now.toISOString(),
  };
}
