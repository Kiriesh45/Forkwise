import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GitHubClient } from '../../src/data/github/client.js';
import {
  GitHubUnavailable,
  InvalidToken,
  RateLimited,
  RepoNotFound,
} from '../../src/data/github/errors.js';

/**
 * The client is exercised through a stubbed `fetch` rather than through an
 * injected dependency: the production code keeps its plain signature, and the
 * tests still see every request it makes.
 */

let requests: Request[];
let respond: (request: Request) => Response;

beforeEach(() => {
  requests = [];
  respond = () => new Response('{}', { status: 200 });

  vi.stubGlobal('fetch', (input: string, init?: RequestInit) => {
    const request = new Request(input, init);
    requests.push(request);
    return Promise.resolve(respond(request));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function replyWith(body: unknown, init: ResponseInit = {}): void {
  respond = () => new Response(JSON.stringify(body), { status: 200, ...init });
}

function failWith(status: number, headers: Record<string, string> = {}): void {
  respond = () => new Response('{"message":"nope"}', { status, headers });
}

const RATE_LIMIT_HEADERS = {
  'x-ratelimit-limit': '60',
  'x-ratelimit-remaining': '58',
  // 2026-08-12T12:00:00Z as Unix seconds, the unit GitHub actually sends.
  'x-ratelimit-reset': '1786536000',
};

describe('GitHubClient requests', () => {
  it('identifies itself and pins the API version', async () => {
    replyWith({});
    await new GitHubClient().fetchRepo('acme', 'widget');

    expect(requests[0]?.headers.get('accept')).toBe('application/vnd.github+json');
    expect(requests[0]?.headers.get('x-github-api-version')).toBe('2022-11-28');
  });

  it('sends no authorization header without a token', async () => {
    replyWith({});
    await new GitHubClient().fetchRepo('acme', 'widget');

    expect(requests[0]?.headers.get('authorization')).toBeNull();
  });

  it('sends the token when there is one', async () => {
    replyWith({});
    await new GitHubClient('secret-token').fetchRepo('acme', 'widget');

    expect(requests[0]?.headers.get('authorization')).toBe('Bearer secret-token');
  });

  it('encodes path segments so a crafted name cannot redirect the request', async () => {
    replyWith({});
    await new GitHubClient('secret-token').fetchRepo('acme', '../../user/repos');

    // Without encoding this would leave /repos/acme/ entirely and hit an
    // unrelated endpoint with the user's token attached.
    expect(requests[0]?.url).toBe('https://api.github.com/repos/acme/..%2F..%2Fuser%2Frepos');
  });

  it('asks for file contents raw rather than base64-wrapped', async () => {
    respond = () => new Response('{"name":"widget"}', { status: 200 });
    await new GitHubClient().fetchTextFile('acme', 'widget', 'package.json', 'main');

    expect(requests[0]?.headers.get('accept')).toBe('application/vnd.github.raw');
  });
});

describe('GitHubClient failures', () => {
  it('reports a missing repository by name', async () => {
    failWith(404);

    await expect(new GitHubClient().fetchRepo('acme', 'widget')).rejects.toBeInstanceOf(
      RepoNotFound,
    );
  });

  it('reports a rejected token', async () => {
    failWith(401);

    await expect(new GitHubClient().fetchRepo('acme', 'widget')).rejects.toBeInstanceOf(
      InvalidToken,
    );
  });

  it('reports a spent budget with the time it resets', async () => {
    failWith(403, { ...RATE_LIMIT_HEADERS, 'x-ratelimit-remaining': '0' });

    const failure = await new GitHubClient()
      .fetchRepo('acme', 'widget')
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(RateLimited);
    expect((failure as RateLimited).resetAt.toISOString()).toBe('2026-08-12T12:00:00.000Z');
  });

  it('treats a secondary rate limit as a rate limit even with budget left', async () => {
    // GitHub throttles bursts with 403 and Retry-After while the hourly
    // counter still shows requests available.
    failWith(403, { ...RATE_LIMIT_HEADERS, 'retry-after': '60' });

    await expect(new GitHubClient().fetchRepo('acme', 'widget')).rejects.toBeInstanceOf(
      RateLimited,
    );
  });

  it('reports a server error as unavailable', async () => {
    failWith(500);

    await expect(new GitHubClient().fetchRepo('acme', 'widget')).rejects.toBeInstanceOf(
      GitHubUnavailable,
    );
  });

  it('reports a dead connection as unavailable rather than leaking the cause', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('network down')));

    await expect(new GitHubClient().fetchRepo('acme', 'widget')).rejects.toBeInstanceOf(
      GitHubUnavailable,
    );
  });
});

describe('GitHubClient empty repositories', () => {
  it('treats 409 as an empty tree, because a repository with no commits has no files', async () => {
    failWith(409);

    await expect(new GitHubClient().fetchTree('acme', 'widget', 'main')).resolves.toEqual({
      tree: [],
      truncated: false,
    });
  });

  it('treats 409 as no commits', async () => {
    failWith(409);

    await expect(new GitHubClient().fetchCommits('acme', 'widget', 'main')).resolves.toEqual([]);
  });
});

describe('GitHubClient files', () => {
  it('reports an absent file without throwing', async () => {
    failWith(404);

    await expect(
      new GitHubClient().fetchTextFile('acme', 'widget', 'package-lock.json', 'main'),
    ).resolves.toEqual({ kind: 'absent' });
  });

  it('refuses to read a file too large for a browser panel', async () => {
    respond = () => new Response('{}', { status: 200, headers: { 'content-length': '9000000' } });

    await expect(
      new GitHubClient().fetchTextFile('acme', 'widget', 'package-lock.json', 'main'),
    ).resolves.toEqual({ kind: 'too-large', bytes: 9_000_000 });
  });

  it('returns the file when it fits', async () => {
    respond = () => new Response('{"name":"widget"}', { status: 200 });

    await expect(
      new GitHubClient().fetchTextFile('acme', 'widget', 'package.json', 'main'),
    ).resolves.toEqual({ kind: 'found', text: '{"name":"widget"}' });
  });
});

describe('GitHubClient rate limit reporting', () => {
  it('knows nothing before the first response', () => {
    expect(new GitHubClient().rateLimit).toBeNull();
  });

  it('reads the budget from the headers, converting seconds to milliseconds', async () => {
    replyWith({}, { headers: RATE_LIMIT_HEADERS });

    const client = new GitHubClient();
    await client.fetchRepo('acme', 'widget');

    expect(client.rateLimit).toEqual({
      limit: 60,
      remaining: 58,
      resetAt: new Date('2026-08-12T12:00:00.000Z'),
    });
  });

  it('keeps the last reading when a response carries no headers', async () => {
    replyWith({}, { headers: RATE_LIMIT_HEADERS });
    const client = new GitHubClient();
    await client.fetchRepo('acme', 'widget');

    replyWith({});
    await client.fetchRepo('acme', 'widget');

    expect(client.rateLimit?.remaining).toBe(58);
  });
});
