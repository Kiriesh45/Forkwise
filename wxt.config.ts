import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],

  /*
   * React is swapped for Preact at build time. The panel is four components,
   * two `useState` calls and no React feature beyond hooks, and React was
   * 196 kB of a 233 kB extension for that.
   *
   * Aliased rather than rewritten: the source keeps importing "react", the
   * types keep coming from @types/react, and scripts/preview.ts keeps
   * rendering with React itself. Only the shipped bundle changes.
   */
  vite: () => ({
    resolve: {
      alias: {
        react: 'preact/compat',
        'react-dom': 'preact/compat',
      },
    },
  }),

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
