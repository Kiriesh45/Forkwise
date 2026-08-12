import { browser } from 'wxt/browser';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { parseRepoUrl } from '../core/repo-url.js';
import type { ForkwiseMessage } from '../messaging.js';

/**
 * Watches which repository the user is looking at.
 *
 * This runs in the page, so it is the least trusted context the extension has.
 * It reads the address bar and nothing else: no DOM scraping, no page data. It
 * cannot write to storage either — it reports to the background worker, which
 * decides what to record.
 */
export default defineContentScript({
  matches: ['*://github.com/*'],

  main(ctx) {
    report();

    // GitHub is a Turbo application: moving between repositories replaces the
    // page contents without a reload, so this script is never started again.
    // Without this listener the panel would keep showing the first repository
    // the user happened to open.
    ctx.addEventListener(window, 'wxt:locationchange', report);
  },
});

function report(): void {
  const message: ForkwiseMessage = { type: 'repo-detected', repo: parseRepoUrl(location.href) };

  // The worker may be asleep and the message may outlive this page. Neither is
  // worth reporting to the user, so the failure is swallowed deliberately.
  browser.runtime.sendMessage(message).catch(() => undefined);
}
