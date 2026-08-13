import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules/', 'dist/', '.output/', '.wxt/'] },

  js.configs.recommended,

  // Type-aware rules. Slower than the syntax-only set, and the reason we are
  // here: a forgotten `await` is invisible to a linter that cannot see types.
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Hook rules catch what types cannot: a stale closure in a dependency array
  // compiles perfectly and renders the wrong data.
  reactHooks.configs.flat['recommended-latest'],

  // Plain JavaScript outside the TypeScript project: the type-aware rules have
  // nothing to work with here.
  {
    files: ['eslint.config.js', 'scripts/**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      // Spread first: disableTypeChecked turns the type-aware parser off here,
      // and replacing this key outright would turn it back on.
      ...tseslint.configs.disableTypeChecked.languageOptions,
      // Node globals, declared rather than pulled from a preset: this is the
      // whole list these scripts use.
      globals: { Buffer: 'readonly', console: 'readonly', URL: 'readonly' },
    },
  },

  {
    rules: {
      // Unused arguments are usually a real mistake; a leading underscore is
      // the explicit way to say "required by the signature, not needed here".
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // Must stay last: switches off every rule that only argues about formatting,
  // which is Prettier's job. Two tools with opinions about the same comma is a
  // fight nobody wins.
  prettier,
);
