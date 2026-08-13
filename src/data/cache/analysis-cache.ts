import type { RepoLocation } from '../../core/repo-url.js';
import { SCORING_VERSION } from '../../core/scoring.js';
import type { RepoAnalysis } from '../../core/types.js';
import type { KeyValueStore } from './key-value-store.js';

/** Bump when the stored shape changes in a way older entries cannot satisfy. */
const FORMAT_VERSION = '1';

const PREFIX = 'analysis';

/**
 * A day. Repository health moves slowly: a project that was maintained this
 * morning is maintained tonight. The cost of being wrong for a few hours is
 * far lower than the cost of spending the hourly request budget.
 */
export const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * `chrome.storage.local` holds about ten megabytes and an analysis is a few
 * kilobytes, so this is nowhere near the limit — it exists so the cache cannot
 * grow without bound over months of browsing.
 */
const MAX_ENTRIES = 200;

interface CacheEntry {
  storedAt: number;
  analysis: RepoAnalysis;
}

export interface CachedAnalysis {
  analysis: RepoAnalysis;
  ageMs: number;
  /** Past the TTL. Still worth showing when a refresh is impossible. */
  isStale: boolean;
}

export class AnalysisCache {
  constructor(private readonly store: KeyValueStore) {}

  async read(location: RepoLocation, now: Date): Promise<CachedAnalysis | null> {
    const key = cacheKey(location);
    const stored = await this.store.get([key]);
    const entry = stored[key];

    if (!isCacheEntry(entry)) {
      return null;
    }

    const ageMs = now.getTime() - entry.storedAt;
    return { analysis: entry.analysis, ageMs, isStale: ageMs > MAX_AGE_MS };
  }

  /**
   * Stored under the name that was asked for *and* under the canonical one.
   * Renamed and transferred repositories answer through a redirect, so
   * `facebook/react` and `react/react` are the same analysis and should not
   * cost two lookups or occupy two entries' worth of budget independently.
   */
  async write(requested: RepoLocation, analysis: RepoAnalysis, now: Date): Promise<void> {
    const entry: CacheEntry = { storedAt: now.getTime(), analysis };
    const canonical = { owner: analysis.repo.owner, repo: analysis.repo.name };
    const keys = new Set([cacheKey(requested), cacheKey(canonical)]);

    await this.store.set(Object.fromEntries([...keys].map((key) => [key, entry])));
    await this.evictOldest();
  }

  private async evictOldest(): Promise<void> {
    const everything = await this.store.get(null);
    const entries = Object.entries(everything).filter(
      (pair): pair is [string, CacheEntry] =>
        pair[0].startsWith(`${PREFIX}:`) && isCacheEntry(pair[1]),
    );

    if (entries.length <= MAX_ENTRIES) {
      return;
    }

    const doomed = entries
      .sort(([, a], [, b]) => a.storedAt - b.storedAt)
      .slice(0, entries.length - MAX_ENTRIES)
      .map(([key]) => key);

    await this.store.remove(doomed);
  }
}

/**
 * The scoring version is part of the key, so changing the model invalidates
 * every entry at once instead of leaving old numbers to be compared against
 * new ones. Names are lower-cased because GitHub treats them that way.
 */
function cacheKey({ owner, repo }: RepoLocation): string {
  return `${PREFIX}:${FORMAT_VERSION}:${SCORING_VERSION}:${owner.toLowerCase()}/${repo.toLowerCase()}`;
}

/** Entries were written by whichever version of Forkwise ran last. */
function isCacheEntry(value: unknown): value is CacheEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<CacheEntry>;
  return typeof candidate.storedAt === 'number' && typeof candidate.analysis === 'object';
}
