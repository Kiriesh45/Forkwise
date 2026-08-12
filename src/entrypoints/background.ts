import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import { CURRENT_REPO_KEY, type ForkwiseMessage } from '../messaging.js';

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

  browser.runtime.onMessage.addListener((message: ForkwiseMessage) => {
    if (message.type === 'repo-detected') {
      void browser.storage.session.set({ [CURRENT_REPO_KEY]: message.repo });
    }
  });
});
