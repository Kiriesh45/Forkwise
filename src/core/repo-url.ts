export interface RepoLocation {
  owner: string;
  repo: string;
}

/**
 * First path segments that belong to GitHub itself rather than to a user.
 * Without this list, /settings/profile reads as the repository "settings/profile".
 */
const RESERVED = new Set([
  'about',
  'account',
  'apps',
  'codespaces',
  'collections',
  'contact',
  'dashboard',
  'enterprise',
  'events',
  'explore',
  'features',
  'issues',
  'join',
  'login',
  'logout',
  'marketplace',
  'new',
  'notifications',
  'organizations',
  'orgs',
  'pricing',
  'pulls',
  'search',
  'security',
  'sessions',
  'settings',
  'sponsors',
  'stars',
  'topics',
  'trending',
  'watching',
]);

/**
 * Guards data coming back out of extension storage, which was written by
 * whichever version of Forkwise ran last and is not covered by our types.
 */
export function isRepoLocation(value: unknown): value is RepoLocation {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<RepoLocation>;
  return typeof candidate.owner === 'string' && typeof candidate.repo === 'string';
}

/** Null for anything that is not a repository page. */
export function parseRepoUrl(url: string): RepoLocation | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  // Subdomains are different products: gist.github.com, docs.github.com.
  if (parsed.hostname !== 'github.com') {
    return null;
  }

  const [owner, repo] = parsed.pathname.split('/').filter(Boolean);
  if (owner === undefined || repo === undefined || RESERVED.has(owner.toLowerCase())) {
    return null;
  }

  // Clone URLs carry the suffix; the web UI does not.
  return { owner, repo: repo.replace(/\.git$/, '') };
}
