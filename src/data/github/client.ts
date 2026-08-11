import type { GitHubRepoResponse, GitHubTreeResponse } from './api-types.js';
import {
  GitHubApiError,
  GitHubUnavailable,
  InvalidToken,
  RateLimited,
  RepoNotFound,
} from './errors.js';

const API_ROOT = 'https://api.github.com';

/** GitHub can hang; a side panel that never resolves looks broken. */
const REQUEST_TIMEOUT_MS = 10_000;

export interface RateLimitSnapshot {
  limit: number;
  remaining: number;
  resetAt: Date;
}

/**
 * Talks to the GitHub REST API. Knows nothing about checks or scoring — it
 * returns GitHub's own shapes and lets `mappers.ts` translate them.
 *
 * Holds the token and the most recent rate-limit reading, which is why this is
 * a class rather than loose functions: both are state that every request
 * updates and the UI needs to read.
 */
export class GitHubClient {
  private latestRateLimit: RateLimitSnapshot | null = null;

  constructor(private readonly token?: string) {}

  /** Null until the first response comes back. */
  get rateLimit(): RateLimitSnapshot | null {
    return this.latestRateLimit;
  }

  async fetchRepo(owner: string, repo: string): Promise<GitHubRepoResponse> {
    return this.request(`/repos/${segment(owner)}/${segment(repo)}`, new RepoNotFound(owner, repo));
  }

  /**
   * The whole file tree in one request. Fetching directories one by one would
   * cost a request per folder, and the anonymous budget is 60 per hour.
   */
  async fetchTree(owner: string, repo: string, branch: string): Promise<GitHubTreeResponse> {
    const path = `/repos/${segment(owner)}/${segment(repo)}/git/trees/${segment(branch)}?recursive=1`;
    return this.request(path, new RepoNotFound(owner, repo));
  }

  private async request<T>(path: string, notFound: GitHubApiError): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    let response: Response;
    try {
      // Redirects are followed on purpose: renamed and transferred repos answer
      // with 301, and we want the current data. The consequence is that the
      // response may describe a different owner/repo than the one requested —
      // callers must trust the response, not their own arguments.
      response = await fetch(`${API_ROOT}${path}`, {
        headers,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (cause) {
      throw new GitHubUnavailable(cause);
    }

    this.latestRateLimit = readRateLimit(response.headers) ?? this.latestRateLimit;

    if (response.ok) {
      // Asserted, not validated. See docs/decisions/0001-no-runtime-validation.md.
      return (await response.json()) as T;
    }

    throw this.errorFor(response, notFound);
  }

  private errorFor(response: Response, notFound: GitHubApiError): GitHubApiError {
    switch (response.status) {
      case 401:
        return new InvalidToken();
      case 403:
      case 429:
        // 403 also covers secondary rate limits, which report Retry-After
        // instead of a spent budget.
        if (this.latestRateLimit?.remaining === 0) {
          return new RateLimited(this.latestRateLimit.resetAt);
        }
        return retryAfter(response) ?? new GitHubUnavailable(`HTTP ${response.status}`);
      case 404:
        return notFound;
      default:
        return new GitHubUnavailable(`HTTP ${response.status}`);
    }
  }
}

/**
 * Owner and repo names come from a page URL, so they are untrusted input.
 * Without encoding, a crafted name containing `../` would let a page point our
 * authenticated requests at a different endpoint.
 */
function segment(value: string): string {
  return encodeURIComponent(value);
}

function readRateLimit(headers: Headers): RateLimitSnapshot | null {
  const limit = headers.get('x-ratelimit-limit');
  const remaining = headers.get('x-ratelimit-remaining');
  const reset = headers.get('x-ratelimit-reset');

  if (limit === null || remaining === null || reset === null) {
    return null;
  }

  return {
    limit: Number(limit),
    remaining: Number(remaining),
    // GitHub sends Unix time in seconds; Date wants milliseconds.
    resetAt: new Date(Number(reset) * 1000),
  };
}

function retryAfter(response: Response): RateLimited | null {
  const seconds = response.headers.get('retry-after');
  if (seconds === null) {
    return null;
  }
  return new RateLimited(new Date(Date.now() + Number(seconds) * 1000));
}
