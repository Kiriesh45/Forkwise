# 0001 — No runtime validation of GitHub API responses

Status: accepted, 2026-08-11

## Context

`GitHubClient.request` casts the parsed JSON body to the expected type:

```ts
return (await response.json()) as T;
```

A cast is a promise to the compiler, not a check. If GitHub ever returns a
different shape, nothing fails at the boundary — the code breaks later, in a
check or in the UI, far from the cause.

## Decision

Ship without runtime validation. Describe the responses in
`src/data/github/api-types.ts` and trust the cast.

## Alternatives considered

- **Zod or Valibot at the boundary.** Correct, and the obvious answer for a
  service. Rejected for now: another dependency in an extension bundle where
  size matters, and a whole new topic at a point where the author is still
  learning the basics of the language.
- **Hand-written type guards.** No dependency, but the guards need the same
  maintenance as the types and are easy to write incorrectly, which produces
  false confidence.

## Consequences

- A change on GitHub's side surfaces as a confusing failure somewhere
  downstream rather than a clear error at the boundary.
- The risk is bounded: the API is public, versioned through the
  `X-GitHub-Api-Version` header, and we only read from it.
- Only a handful of fields are read, so the blast radius of any single change
  is small.

## Revisit when

- A second data source is added (OSV in stage 5 is a candidate), or
- we start writing data rather than only reading it, or
- a real incident is traced back to an unexpected response shape.
