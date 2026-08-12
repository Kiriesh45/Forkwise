import type { RepoSummary } from './types.js';

/**
 * Links for evidence in the panel. These are github.com pages the user can
 * open, not API endpoints.
 */

export function fileUrl(repo: RepoSummary, path: string): string {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `${repoUrl(repo)}/blob/${repo.defaultBranch}/${encodedPath}`;
}

export function commitsUrl(repo: RepoSummary): string {
  return `${repoUrl(repo)}/commits/${repo.defaultBranch}`;
}

function repoUrl(repo: RepoSummary): string {
  return `https://github.com/${repo.owner}/${repo.name}`;
}
