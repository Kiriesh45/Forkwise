import { commitsUrl } from '../github-links.js';
import type { Check } from '../types.js';

const id = 'recent-activity';
const title = 'Recent activity';
const weight = 4;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Under three months: normal even for a finished, stable library. */
const FRESH_DAYS = 90;
/** Over a year with no push is the point where "stable" becomes "abandoned". */
const STALE_DAYS = 365;

export const recentActivity: Check = ({ repo, now }) => {
  const days = Math.floor((now.getTime() - new Date(repo.pushedAt).getTime()) / MS_PER_DAY);
  const evidence = [{ text: `Last push ${days} days ago`, url: commitsUrl(repo) }];

  if (days <= FRESH_DAYS) {
    return { id, title, weight, status: 'pass', evidence };
  }

  if (days <= STALE_DAYS) {
    return {
      id,
      title,
      weight,
      status: 'warn',
      evidence,
      fix: 'Check whether the maintainers are still responding to issues.',
    };
  }

  return {
    id,
    title,
    weight,
    status: 'fail',
    evidence,
    // No ceiling, and so deliberately no `consequence` either: a finished,
    // stable library looks exactly like an abandoned one from here, and this
    // check is not certain enough to headline the panel over a green score.
    fix: 'Treat this as unmaintained unless the maintainers say otherwise.',
  };
};
