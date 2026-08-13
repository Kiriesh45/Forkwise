import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import { toAnalysisError } from '../analysis/analysis-error.js';
import { analyzeRepo } from '../analysis/analyze-repo.js';
import type { RepoLocation } from '../core/repo-url.js';
import { AnalysisCache } from '../data/cache/analysis-cache.js';
import type { KeyValueStore } from '../data/cache/key-value-store.js';
import { GitHubClient } from '../data/github/client.js';
import { OsvClient } from '../data/osv/client.js';
import { readToken } from '../data/settings.js';
import {
  CURRENT_REPO_KEY,
  type AnalysisResponse,
  type ForkwiseMessage,
  type TokenCheckResponse,
} from '../messaging.js';

/**
 * The service worker. Every network request the extension makes happens here,
 * for two reasons: it is the context that holds `host_permissions`, so it is
 * not subject to the page's CORS rules, and it is isolated from the scripts
 * running on github.com, so a token never shares a context with them.
 *
 * It is also terminated whenever Chrome feels like it. Nothing may be kept in
 * a module-level variable and expected to survive.
 */
export default defineBackground(() => {
  // Clicking the toolbar icon opens the panel. Without this, `sidePanel` has
  // no way to be opened by a user gesture, which Chrome requires.
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: unknown) => console.error('Forkwise: cannot configure the side panel', error));

  browser.runtime.onMessage.addListener(
    (
      message: ForkwiseMessage,
      _sender,
      sendResponse: (response: AnalysisResponse | TokenCheckResponse) => void,
    ) => {
      if (message.type === 'repo-detected') {
        void browser.storage.session.set({ [CURRENT_REPO_KEY]: message.repo });
        return false;
      }

      const answer =
        message.type === 'analyze' ? analyze(message.repo) : verifyToken(message.token);

      answer
        .then(sendResponse)
        .catch((error: unknown) => sendResponse({ ok: false, error: toAnalysisError(error) }));

      // Says "the reply comes later". Without it Chrome closes the message
      // channel as soon as this function returns, and the panel waits forever
      // for an answer that can no longer be delivered.
      return true;
    },
  );
});

/**
 * Checks a token against GitHub before the options page stores it. Verifying
 * here rather than in the page keeps the token inside the worker, and reuses
 * the one endpoint that costs nothing.
 */
async function verifyToken(token: string): Promise<TokenCheckResponse> {
  try {
    const limit = await new GitHubClient(token).fetchRateLimit();
    if (limit === null) {
      return { ok: false, message: 'GitHub answered without a rate limit header' };
    }
    return { ok: true, limit: limit.limit, remaining: limit.remaining };
  } catch (error) {
    return { ok: false, message: toAnalysisError(error).message };
  }
}

/** `chrome.storage.local` behind the narrow port the cache asks for. */
const localStore: KeyValueStore = {
  get: (keys) => browser.storage.local.get(keys),
  set: (items) => browser.storage.local.set(items),
  remove: (keys) => browser.storage.local.remove(keys),
};

async function analyze(location: RepoLocation): Promise<AnalysisResponse> {
  const now = new Date();
  const cache = new AnalysisCache(localStore);
  const cached = await cache.read(location, now);

  if (cached !== null && !cached.isStale) {
    return {
      ok: true,
      analysis: cached.analysis,
      freshness: { kind: 'cached', ageMs: cached.ageMs },
    };
  }

  // Built per request: the worker may have been restarted since the last one,
  // and there is no state worth keeping alive between analyses anyway.
  const clients = {
    github: new GitHubClient(await readToken(localStore)),
    osv: new OsvClient(),
  };

  try {
    const analysis = await analyzeRepo(clients, location.owner, location.repo, now);
    await cache.write(location, analysis, now);

    const budget = clients.github.rateLimit;
    return {
      ok: true,
      analysis,
      freshness: { kind: 'fresh' },
      ...(budget === null
        ? {}
        : {
            rateLimit: {
              limit: budget.limit,
              remaining: budget.remaining,
              resetAt: budget.resetAt.toISOString(),
            },
          }),
    };
  } catch (error) {
    const failure = toAnalysisError(error);

    // Yesterday's answer beats no answer, as long as we say which it is. This
    // is what keeps the panel useful once the hourly budget is spent.
    if (cached !== null) {
      return {
        ok: true,
        analysis: cached.analysis,
        freshness: { kind: 'stale', ageMs: cached.ageMs, reason: failure },
      };
    }

    return { ok: false, error: failure };
  }
}
