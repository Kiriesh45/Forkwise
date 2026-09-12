import type { RepoSummary } from './types.js';

/**
 * Links for evidence in the panel. These are github.com pages the user can
 * open, not API endpoints.
 *
 * Everything interpolated here comes from a GitHub API response rather than
 * from the address bar, so it is better constrained than the input
 * `GitHubClient` guards against. It is still encoded: the values are not ours,
 * the result goes into an `href`, and a link that silently points somewhere
 * else is exactly the kind of thing nobody notices.
 */

export function fileUrl(repo: RepoSummary, path: string): string {
  return `${repoUrl(repo)}/blob/${encodePath(repo.defaultBranch)}/${encodePath(path)}`;
}

export function commitsUrl(repo: RepoSummary): string {
  return `${repoUrl(repo)}/commits/${encodePath(repo.defaultBranch)}`;
}

function repoUrl(repo: RepoSummary): string {
  return `https://github.com/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`;
}

/**
 * Encodes each segment but keeps the separators: branch names legitimately
 * contain slashes (`release/2.x`), and GitHub expects those raw in a blob URL.
 */
function encodePath(value: string): string {
  return value.split('/').map(encodeURIComponent).join('/');
}
