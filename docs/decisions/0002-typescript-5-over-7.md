# 0002 — TypeScript 5.9 instead of 7

Status: accepted, 2026-08-13

## Context

The project was started on TypeScript 7.0.2, the native-Go compiler, mostly
because it was the current release.

Adding ESLint made that impossible. `typescript-eslint`, the only maintained
way to lint TypeScript, declares a peer dependency:

```
peer typescript@">=4.8.4 <6.1.0" from typescript-eslint@8.67.0
```

No published version, including the canary channel, supports TypeScript 7 yet.
npm refused the install outright.

The rules at stake are the type-aware ones, which need the type checker to run:
`no-floating-promises`, `no-misused-promises`, `require-await`. They matter
here more than usual — this codebase is `async` from end to end, and a
forgotten `await` in a service worker produces silence rather than an error.

## Decision

Downgrade to TypeScript 5.9 and keep ESLint with the type-aware rule set.

## Alternatives considered

- **Stay on TypeScript 7, install with `--legacy-peer-deps`.** Rejected:
  `typescript-eslint` reads TypeScript's compiler API directly, so overriding
  the constraint invites failures that look like linter bugs.
- **Stay on TypeScript 7 and use Biome instead.** One fast tool covering both
  formatting and linting, and no version conflict. Rejected because Biome has
  no type-aware rules at all, which is precisely what we came for.
- **Stay on TypeScript 7 with syntax-only linting.** Rejected for the same
  reason: it would have kept the tool and dropped its value.

## Consequences

- The only thing given up is compile speed, and at twenty source files
  `tsc --noEmit` finishes in under a second either way.
- The decision paid off immediately: `no-misused-promises` caught a real
  Manifest V3 bug, where `chrome.runtime.onMessage` returned a promise instead
  of `true`. Chrome closes the message channel when the listener returns, so
  the panel would have waited forever for a reply that could no longer be
  delivered — with no error anywhere.
- The project is now tied to `typescript-eslint`'s release schedule for
  compiler upgrades.

## Revisit when

`typescript-eslint` publishes a release supporting TypeScript 7, or if
compilation time ever becomes noticeable.
