/**
 * Failure modes of the GitHub data layer.
 *
 * These exist because the side panel has to show a different screen for each
 * one. A single generic error would force the UI to parse message strings.
 */

export abstract class GitHubApiError extends Error {}

/** 404, and also what a private repository looks like to an anonymous caller. */
export class RepoNotFound extends GitHubApiError {
  constructor(readonly owner: string, readonly repo: string) {
    super(`Repository ${owner}/${repo} not found, or not visible to you`);
    this.name = 'RepoNotFound';
  }
}

/** 403 or 429 with no requests left in the window. */
export class RateLimited extends GitHubApiError {
  constructor(readonly resetAt: Date) {
    super(`GitHub API rate limit exceeded, resets at ${resetAt.toISOString()}`);
    this.name = 'RateLimited';
  }
}

/**
 * 409 — the repository exists but has no commits yet. GitHub reports this for
 * trees and commits alike, and it is an answer rather than a failure.
 */
export class RepoIsEmpty extends GitHubApiError {
  constructor() {
    super('The repository has no commits yet');
    this.name = 'RepoIsEmpty';
  }
}

/** 401 — the stored token is expired or revoked. */
export class InvalidToken extends GitHubApiError {
  constructor() {
    super('GitHub rejected the token. Remove or replace it in the settings.');
    this.name = 'InvalidToken';
  }
}

/** 5xx, DNS failures, offline — anything that is worth retrying later. */
export class GitHubUnavailable extends GitHubApiError {
  constructor(cause: unknown) {
    super('GitHub is unreachable', { cause });
    this.name = 'GitHubUnavailable';
  }
}
