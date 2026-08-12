import { commitsUrl } from '../github-links.js';
import type { Check } from '../types.js';

const id = 'active-contributors';
const title = 'More than one maintainer';
const weight = 3;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 90;

/** Below this, the project stops the day one person loses interest. */
const HEALTHY_AUTHORS = 3;

/**
 * The bus factor: how many people would have to disappear for the project to
 * stall. Counted over a sample of recent commits, so the number is a lower
 * bound — see `CommitHistory.isTruncated`.
 */
export const activeContributors: Check = ({ repo, history, now }) => {
  const since = now.getTime() - WINDOW_DAYS * MS_PER_DAY;
  const recent = history.commits.filter(
    (commit) => new Date(commit.committedAt).getTime() >= since,
  );
  const authors = new Set(recent.map((commit) => commit.author));

  if (authors.size === 0) {
    return {
      id,
      title,
      weight,
      status: 'unknown',
      evidence: [{ text: `No commits in the last ${WINDOW_DAYS} days`, url: commitsUrl(repo) }],
    };
  }

  const evidence = [
    {
      text:
        `${authors.size} distinct author(s) in the last ${WINDOW_DAYS} days` +
        (history.isTruncated ? ', counted from the 100 most recent commits' : ''),
      url: commitsUrl(repo),
    },
  ];

  if (authors.size >= HEALTHY_AUTHORS) {
    return { id, title, weight, status: 'pass', evidence };
  }

  if (authors.size === 2) {
    return { id, title, weight, status: 'warn', evidence };
  }

  return {
    id,
    title,
    weight,
    status: 'fail',
    evidence,
    fix: 'A single maintainer is a single point of failure. Check whether an organisation backs this project before depending on it.',
  };
};
