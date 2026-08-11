import { FileIndex } from '../../core/file-index.js';
import type { LicenseInfo, RepoSummary } from '../../core/types.js';
import type { GitHubLicense, GitHubRepoResponse, GitHubTreeResponse } from './api-types.js';

/** GitHub's placeholder for a license file it found but could not identify. */
const UNIDENTIFIED = 'NOASSERTION';

/**
 * The single translation point between GitHub's vocabulary and ours.
 *
 * Owner and name come from the response rather than from the caller's
 * arguments: renamed or transferred repositories answer through a redirect, so
 * what we asked for is not always what we got.
 */
export function toRepoSummary(response: GitHubRepoResponse): RepoSummary {
  return {
    owner: response.owner.login,
    name: response.name,
    description: response.description,
    license: toLicenseInfo(response.license),
    defaultBranch: response.default_branch,
    primaryLanguage: response.language,
    pushedAt: response.pushed_at,
    createdAt: response.created_at,
    stars: response.stargazers_count,
    openIssuesAndPrs: response.open_issues_count,
    isArchived: response.archived,
    isFork: response.fork,
  };
}

/**
 * Only blobs become entries: a directory named `LICENSE` is not a license, and
 * a submodule (`type: 'commit'`) has no contents we can see at all.
 */
export function toFileIndex(tree: GitHubTreeResponse): FileIndex {
  const filePaths = tree.tree.filter((entry) => entry.type === 'blob').map((entry) => entry.path);
  return new FileIndex(filePaths, !tree.truncated);
}

function toLicenseInfo(license: GitHubLicense | null): LicenseInfo {
  if (license === null) {
    return { kind: 'none' };
  }
  if (license.spdx_id === UNIDENTIFIED) {
    return { kind: 'unidentified' };
  }
  return { kind: 'spdx', id: license.spdx_id };
}
