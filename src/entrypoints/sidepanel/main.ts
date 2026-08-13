import { browser } from 'wxt/browser';
import { isRepoLocation } from '../../core/repo-url.js';
import type { RepoAnalysis } from '../../core/types.js';
import {
  CURRENT_REPO_KEY,
  type AnalysisResponse,
  type ForkwiseMessage,
  type Freshness,
} from '../../messaging.js';

/**
 * Plumbing-only panel: it renders whatever the worker sends back, as text.
 * The real interface arrives in stage 8.
 */

const app = document.querySelector('#app');

/**
 * Which repository the visible output belongs to. Two navigations in quick
 * succession would otherwise race, and the slower answer would overwrite the
 * newer one.
 */
let showing: string | null = null;

async function onRepoChanged(): Promise<void> {
  const stored = await browser.storage.session.get(CURRENT_REPO_KEY);
  const value: unknown = stored[CURRENT_REPO_KEY];
  const repo = isRepoLocation(value) ? value : null;

  if (repo === null) {
    showing = null;
    write('Open a repository on github.com.');
    return;
  }

  const key = `${repo.owner}/${repo.repo}`;
  showing = key;
  write(`Analysing ${key}…`);

  const request: ForkwiseMessage = { type: 'analyze', repo };
  // The reply type comes from the generic, not from a cast: `sendMessage`
  // returns whatever the other side sends, and neither end checks the other.
  const response = await browser.runtime.sendMessage<ForkwiseMessage, AnalysisResponse>(request);

  // The user has moved on; this answer is about a repository nobody is looking
  // at any more.
  if (showing !== key) {
    return;
  }

  if (!response.ok) {
    write(`${response.error.kind}: ${response.error.message}`);
    return;
  }

  const budget =
    response.rateLimit === undefined
      ? ''
      : ` | ${response.rateLimit.remaining}/${response.rateLimit.limit} requests left this hour`;

  write(
    `${key} — ${response.analysis.score ?? '—'}/100\n` +
      `${freshnessLine(response.freshness)}${budget}\n\n${describe(response.analysis)}`,
  );
}

function freshnessLine(freshness: Freshness): string {
  switch (freshness.kind) {
    case 'fresh':
      return 'measured just now';
    case 'cached':
      return `from cache, ${describeAge(freshness.ageMs)} old`;
    case 'stale':
      return `from cache, ${describeAge(freshness.ageMs)} old — could not refresh: ${freshness.reason.message}`;
  }
}

function describeAge(ageMs: number): string {
  const minutes = Math.round(ageMs / 60_000);
  return minutes < 60 ? `${minutes} min` : `${Math.round(minutes / 60)} h`;
}

function describe(analysis: RepoAnalysis): string {
  return analysis.checks
    .map(
      (check) =>
        `[${check.status}] ${check.title}\n` +
        check.evidence.map((evidence) => `    ${evidence.text}`).join('\n'),
    )
    .join('\n\n');
}

function write(text: string): void {
  if (app !== null) {
    app.textContent = text;
  }
}

browser.storage.session.onChanged.addListener((changes) => {
  if (CURRENT_REPO_KEY in changes) {
    void onRepoChanged();
  }
});

void onRepoChanged();
