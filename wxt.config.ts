import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],

  manifest: {
    name: 'Forkwise',
    description: 'Health and security scoring for GitHub repositories, in your browser.',

    // Every permission here has to be justified to Chrome Web Store reviewers,
    // and to the user reading the install prompt. Keep the list this short.
    permissions: [
      // Caching analyses, and storing an optional read-only token.
      'storage',
      // The panel the analysis is shown in.
      'sidePanel',
    ],

    // Not "*://*/*". Forkwise talks to exactly two services and nothing else,
    // which is the difference between "reads your browsing" and "reads github".
    host_permissions: ['https://api.github.com/*', 'https://api.osv.dev/*'],

    action: { default_title: 'Open Forkwise' },
  },
});
