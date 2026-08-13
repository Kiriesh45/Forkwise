import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { isRepoLocation, type RepoLocation } from '../../core/repo-url.js';
import { CURRENT_REPO_KEY } from '../../messaging.js';

/**
 * The repository the user is looking at, kept in step with their browsing.
 *
 * The panel outlives any single page: it stays open while the user moves
 * around GitHub, so reading the repository once at startup would leave it
 * describing whatever happened to be open first.
 */
export function useCurrentRepo(): RepoLocation | null {
  const [repo, setRepo] = useState<RepoLocation | null>(null);

  useEffect(() => {
    const read = async (): Promise<void> => {
      const stored = await browser.storage.session.get(CURRENT_REPO_KEY);
      const value: unknown = stored[CURRENT_REPO_KEY];
      const next = isRepoLocation(value) ? value : null;

      // Storage hands back a fresh object every read. Returning the previous
      // one when nothing actually changed keeps the identity stable, so
      // effects downstream fire on real navigation rather than on every write.
      setRepo((current) => (isSameRepo(current, next) ? current : next));
    };

    void read();

    const onChanged = (changes: Record<string, unknown>): void => {
      if (CURRENT_REPO_KEY in changes) {
        void read();
      }
    };

    browser.storage.session.onChanged.addListener(onChanged);
    return () => browser.storage.session.onChanged.removeListener(onChanged);
  }, []);

  return repo;
}

function isSameRepo(a: RepoLocation | null, b: RepoLocation | null): boolean {
  if (a === null || b === null) {
    return a === b;
  }
  return a.owner === b.owner && a.repo === b.repo;
}
