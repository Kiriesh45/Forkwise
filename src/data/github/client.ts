import type { GitHubCommitListItem, GitHubRepoResponse, GitHubTreeResponse } from './api-types.js';
import {
  FileNotFound,
  GitHubApiError,
  GitHubUnavailable,
  InvalidToken,
  RateLimited,
  RepoIsEmpty,
  RepoNotFound,
} from './errors.js';

/**
 * A file we asked for, and what actually came back. "Absent" and "too big to
 * read" lead to different messages in the panel, so they stay distinguishable
 * instead of collapsing into null.
 */
export type FetchedFile =
  | { kind: 'found'; text: string }
  | { kind: 'absent' }
  | { kind: 'too-large'; bytes: number };

/**
 * The panel runs inside the browser. A multi-megabyte lock file parsed into
 * memory there costs more than the answer is worth.
 */
const MAX_FILE_BYTES = 4_000_000;

const API_ROOT = 'https://api.github.com';

/**
 * How many recent commits we look at. One page is one request; asking for more
 * would cost another out of an hourly budget of 60.
 */
export const COMMIT_SAMPLE_SIZE = 100;

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
    try {
      return await this.request(path, new RepoNotFound(owner, repo));
    } catch (error) {
      // A repository with no commits has no files. That is a result, not a fault.
      if (error instanceof RepoIsEmpty) {
        return { tree: [], truncated: false };
      }
      throw error;
    }
  }

  /** Newest first, one page deep. */
  async fetchCommits(owner: string, repo: string, branch: string): Promise<GitHubCommitListItem[]> {
    const path =
      `/repos/${segment(owner)}/${segment(repo)}/commits` +
      `?sha=${segment(branch)}&per_page=${COMMIT_SAMPLE_SIZE}`;
    try {
      return await this.request(path, new RepoNotFound(owner, repo));
    } catch (error) {
      if (error instanceof RepoIsEmpty) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Raw media type, not the JSON one: the JSON representation base64-encodes
   * the file, which inflates it by a third and then has to be decoded.
   */
  async fetchTextFile(
    owner: string,
    repo: string,
    path: string,
    ref: string,
  ): Promise<FetchedFile> {
    const url =
      `/repos/${segment(owner)}/${segment(repo)}/contents/` +
      `${path.split('/').map(segment).join('/')}?ref=${segment(ref)}`;

    let response: Response;
    try {
      response = await this.send(url, 'application/vnd.github.raw', new FileNotFound(path));
    } catch (error) {
      if (error instanceof FileNotFound) {
        return { kind: 'absent' };
      }
      throw error;
    }

    const declaredSize = Number(response.headers.get('content-length') ?? 0);
    if (declaredSize > MAX_FILE_BYTES) {
      return { kind: 'too-large', bytes: declaredSize };
    }

    return { kind: 'found', text: await response.text() };
  }

  private async request<T>(path: string, notFound: GitHubApiError): Promise<T> {
    const response = await this.send(path, 'application/vnd.github+json', notFound);
    // Asserted, not validated. See docs/decisions/0001-no-runtime-validation.md.
    return (await response.json()) as T;
  }

  private async send(path: string, accept: string, notFound: GitHubApiError): Promise<Response> {
    const headers: Record<string, string> = {
      Accept: accept,
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

    if (!response.ok) {
      throw this.errorFor(response, notFound);
    }

    return response;
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
      case 409:
        return new RepoIsEmpty();
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
