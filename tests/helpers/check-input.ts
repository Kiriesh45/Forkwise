import { FileIndex } from '../../src/core/file-index.js';
import type { CheckInput, CommitSummary, RepoSummary } from '../../src/core/types.js';

/** A repository with nothing wrong with it, so each test can break one thing. */
const HEALTHY_REPO: RepoSummary = {
  owner: 'acme',
  name: 'widget',
  description: 'A widget library',
  license: { kind: 'spdx', id: 'MIT' },
  defaultBranch: 'main',
  primaryLanguage: 'TypeScript',
  pushedAt: '2026-08-01T00:00:00Z',
  createdAt: '2020-01-01T00:00:00Z',
  stars: 100,
  openIssuesAndPrs: 3,
  isArchived: false,
  isFork: false,
};

/** Fixed, so tests about "90 days ago" mean the same thing forever. */
export const NOW = new Date('2026-08-12T00:00:00Z');

export function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

export interface InputOverrides {
  repo?: Partial<RepoSummary>;
  files?: string[];
  treeComplete?: boolean;
  commits?: CommitSummary[];
  commitsTruncated?: boolean;
  now?: Date;
}

export function makeInput(overrides: InputOverrides = {}): CheckInput {
  return {
    repo: { ...HEALTHY_REPO, ...overrides.repo },
    files: new FileIndex(overrides.files ?? [], overrides.treeComplete ?? true),
    history: {
      commits: overrides.commits ?? [],
      isTruncated: overrides.commitsTruncated ?? false,
    },
    now: overrides.now ?? NOW,
  };
}
