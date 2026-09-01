import { beforeEach, describe, expect, it } from 'vitest';
import { SCORING_VERSION } from '../../src/core/scoring.js';
import { AnalysisCache, MAX_AGE_MS } from '../../src/data/cache/analysis-cache.js';
import type { KeyValueStore } from '../../src/data/cache/key-value-store.js';
import type { RepoAnalysis } from '../../src/core/types.js';

class MemoryStore implements KeyValueStore {
  readonly items = new Map<string, unknown>();

  get(keys: string[] | null): Promise<Record<string, unknown>> {
    const wanted = keys ?? [...this.items.keys()];
    return Promise.resolve(
      Object.fromEntries(
        wanted.filter((key) => this.items.has(key)).map((key) => [key, this.items.get(key)]),
      ),
    );
  }

  set(items: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(items)) {
      this.items.set(key, value);
    }
    return Promise.resolve();
  }

  remove(keys: string[]): Promise<void> {
    for (const key of keys) {
      this.items.delete(key);
    }
    return Promise.resolve();
  }
}

const NOW = new Date('2026-08-12T12:00:00Z');

function analysisOf(owner: string, name: string): RepoAnalysis {
  return {
    repo: {
      owner,
      name,
      description: null,
      license: { kind: 'spdx', id: 'MIT' },
      defaultBranch: 'main',
      primaryLanguage: null,
      pushedAt: '2026-08-01T00:00:00Z',
      createdAt: '2020-01-01T00:00:00Z',
      stars: 0,
      openIssuesAndPrs: 0,
      isArchived: false,
      isFork: false,
    },
    checks: [],
    score: 90,
    scoringVersion: '1',
    generatedAt: NOW.toISOString(),
  };
}

describe('AnalysisCache', () => {
  let store: MemoryStore;
  let cache: AnalysisCache;

  beforeEach(() => {
    store = new MemoryStore();
    cache = new AnalysisCache(store);
  });

  it('returns nothing for a repository it has never seen', async () => {
    expect(await cache.read({ owner: 'acme', repo: 'widget' }, NOW)).toBeNull();
  });

  it('returns what it stored', async () => {
    await cache.write({ owner: 'acme', repo: 'widget' }, analysisOf('acme', 'widget'), NOW);

    const cached = await cache.read({ owner: 'acme', repo: 'widget' }, NOW);

    expect(cached?.analysis.score).toBe(90);
    expect(cached?.isStale).toBe(false);
  });

  it('ignores the case of the repository name, as GitHub does', async () => {
    await cache.write({ owner: 'acme', repo: 'widget' }, analysisOf('acme', 'widget'), NOW);

    expect(await cache.read({ owner: 'ACME', repo: 'Widget' }, NOW)).not.toBeNull();
  });

  it('marks an entry stale past the ttl but still returns it', async () => {
    await cache.write({ owner: 'acme', repo: 'widget' }, analysisOf('acme', 'widget'), NOW);

    const later = new Date(NOW.getTime() + MAX_AGE_MS + 1);
    const cached = await cache.read({ owner: 'acme', repo: 'widget' }, later);

    // Stale data with a warning beats an empty panel when a refresh is
    // impossible, which is exactly what happens once the rate limit is spent.
    expect(cached?.isStale).toBe(true);
    expect(cached?.analysis.score).toBe(90);
  });

  it('finds an analysis under the name the repository was renamed to', async () => {
    // facebook/react now answers as react/react through a redirect.
    await cache.write({ owner: 'facebook', repo: 'react' }, analysisOf('react', 'react'), NOW);

    expect(await cache.read({ owner: 'react', repo: 'react' }, NOW)).not.toBeNull();
    expect(await cache.read({ owner: 'facebook', repo: 'react' }, NOW)).not.toBeNull();
  });

  it('discards entries written under a different scoring model', async () => {
    await cache.write({ owner: 'acme', repo: 'widget' }, analysisOf('acme', 'widget'), NOW);

    // Built from the constant rather than spelled out: the claim is that the
    // key carries the model version, not that the version is any one number.
    // Written out, this assertion broke on the bump to 2 and, worse, quietly
    // stopped the junk test below from reaching anything.
    const [key] = [...store.items.keys()];
    expect(key).toContain(`analysis:1:${SCORING_VERSION}:acme/widget`);
  });

  it('ignores stored junk instead of trusting it', async () => {
    await store.set({ [`analysis:1:${SCORING_VERSION}:acme/widget`]: { storedAt: 'yesterday' } });

    expect(await cache.read({ owner: 'acme', repo: 'widget' }, NOW)).toBeNull();
  });

  it('evicts the oldest entries once the cap is passed', async () => {
    for (let index = 0; index < 205; index += 1) {
      const at = new Date(NOW.getTime() + index);
      await cache.write(
        { owner: 'acme', repo: `widget-${index}` },
        analysisOf('acme', `widget-${index}`),
        at,
      );
    }

    expect(store.items.size).toBe(200);
    expect(await cache.read({ owner: 'acme', repo: 'widget-0' }, NOW)).toBeNull();
    expect(await cache.read({ owner: 'acme', repo: 'widget-204' }, NOW)).not.toBeNull();
  });
});
