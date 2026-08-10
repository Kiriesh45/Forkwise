/**
 * Raw GitHub REST API response shapes.
 *
 * Hand-written from live responses, covering only the fields Forkwise reads.
 * Field names stay in GitHub's snake_case on purpose: the moment a name here
 * differs from what the API actually sends, the mapping layer stops being the
 * single place where translation happens.
 *
 * Nothing outside `src/data/github/` may import from this file.
 */

export interface GitHubLicense {
  /**
   * "MIT", "Apache-2.0", and so on — but "NOASSERTION" when GitHub found a
   * license file it could not identify. That is not a license id, and treating
   * it as one would label custom-licensed repos as properly licensed.
   */
  spdx_id: string;
}

/** GET /repos/{owner}/{repo} */
export interface GitHubRepoResponse {
  name: string;
  owner: { login: string };
  description: string | null;
  license: GitHubLicense | null;
  default_branch: string;
  language: string | null;
  pushed_at: string;
  created_at: string;
  stargazers_count: number;
  open_issues_count: number;
  archived: boolean;
  fork: boolean;
}

export interface GitHubTreeEntry {
  /** Full path from the repository root, e.g. ".github/workflows/ci.yml". */
  path: string;
  /** "commit" means a submodule — it has no contents of its own. */
  type: 'blob' | 'tree' | 'commit';
}

/** GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1 */
export interface GitHubTreeResponse {
  tree: GitHubTreeEntry[];
  /**
   * GitHub caps this response at 100,000 entries or 7 MB. Past that the tree
   * comes back partial with no error, so a missing file is not proof of
   * absence — checks must report `unknown` instead of `fail`.
   */
  truncated: boolean;
}
