import { browser } from 'wxt/browser';
import type { RepoLocation } from '../../core/repo-url.js';
import { CURRENT_REPO_KEY } from '../../messaging.js';

/**
 * Placeholder panel: it proves the plumbing works before any analysis runs
 * through it. Real UI arrives in stage 8.
 */

const app = document.querySelector('#app');

async function render(): Promise<void> {
  if (app === null) {
    return;
  }

  const stored = await browser.storage.session.get(CURRENT_REPO_KEY);
  const repo = stored[CURRENT_REPO_KEY] as RepoLocation | null | undefined;

  app.textContent =
    repo == null ? 'Open a repository on github.com.' : `${repo.owner}/${repo.repo}`;
}

// The panel stays open while the user browses, so it has to follow along
// rather than read the repository once at startup.
browser.storage.session.onChanged.addListener((changes) => {
  if (CURRENT_REPO_KEY in changes) {
    void render();
  }
});

void render();
