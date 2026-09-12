# 0004 — Preact replaces React in the shipped bundle

Status: draft — answer the questions below in your own words, delete them, then
change this line to `accepted, <date>`.

## Context

- How large was the extension, and how much of it was React?
- What was React actually doing for this panel? Name the features used.
- Does bundle size matter for a browser extension? Argue it honestly — a user
  installs once and never downloads it again.

## Decision

- What exactly changed? Name the file and the number of lines.
- What did _not_ change, and why does that matter?

## Alternatives considered

- **Leave React.** What is the honest case for doing nothing?
- **Rewrite the imports to `preact` directly, and drop `@types/react`.** Why
  alias in the build instead of changing the source?
- **Drop the framework and write plain DOM.** Four components, two `useState`
  calls. Why is a framework earning its place here at all?

## Consequences

- `preact/compat` is a reimplementation of an API, not the API. What is no
  longer guaranteed?
- What was verified, and by what means? What was left unverified, and who has
  to check it?
- What happens the day the panel needs something `preact/compat` does not
  implement?
- `scripts/preview.ts` still renders with React while the extension ships
  Preact. Is that a problem, or a feature?

## Revisit when
