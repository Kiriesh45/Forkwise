import type { RepoLocation } from './core/repo-url.js';

/**
 * The only messages that cross between contexts. Typed in one place so the
 * sender and the receiver cannot drift apart silently.
 */
export type ForkwiseMessage = {
  type: 'repo-detected';
  /** Null when the user navigated away from a repository page. */
  repo: RepoLocation | null;
};

/**
 * Key in `chrome.storage.session` holding the repository currently on screen.
 *
 * Session storage, not local: this is throwaway state about the current
 * browsing session and has no business surviving a browser restart on disk.
 */
export const CURRENT_REPO_KEY = 'currentRepo';
