# Contributing to Forkwise

Thanks for looking. This is a learning project as much as a product, so
explanations of _why_ are welcome in reviews and in code.

## Getting set up

Node.js 20 or newer.

```bash
npm ci
npm run dev     # builds the extension and opens a browser with it loaded
```

The analysis engine has no browser dependencies, so most work does not need the
extension at all:

```bash
npm run play -- expressjs/express
```

Copy `.env.example` to `.env` and add a GitHub token if you hit the request
limit. `.env` is git-ignored; never commit a token.

## Before opening a pull request

```bash
npm run format
npm run lint
npm run typecheck
npm test
```

CI runs the same four in that order.

## Adding a check

This is the most common contribution and it is deliberately cheap:

1. Add one file to `src/core/checks/`. If it only asks "does this file exist?",
   use the `fileCheck` factory; otherwise write the function by hand.
2. Register it in `src/core/checks/index.ts`.
3. Add its weight and the reasoning to the table in `docs/scoring.md`. A test
   enforces that the two agree.
4. Add tests in `tests/checks/`.

Three rules a check must follow:

- **Pure.** No `fetch`, no `chrome.*`, no `Date.now()`. Everything, including
  the current time, arrives in `CheckInput`. This is what keeps the tests fast
  and stable.
- **Evidence.** Every result explains itself, with a link where one exists.
- **`fail` is for facts.** If the check infers something from naming
  conventions or samples, the worst it may report is `warn`. If it cannot tell,
  it reports `unknown`, which is excluded from the score rather than counted
  against the repository.

Adding a field to `CheckInput` is a bigger decision than it looks: it widens
what every check may depend on, and it usually costs another API request out of
an hourly budget of 60. Say why in the pull request.

## Code style

- Comments explain **why**, never what. A comment restating the line below it
  gets deleted; a comment recording a trap in GitHub's API is valuable.
- No JSDoc on self-evident functions. Document a module's purpose and the
  surprising parts; leave the obvious alone.
- No abstraction until there is a second implementation. No interface, factory
  or wrapper added "in case we need it later".
- No defensive `try/catch` without a named failure mode. If you cannot say what
  throws and what the user should see, do not catch it.
- Names come from the domain — never `data`, `result`, `handleData`. No
  `utils.ts` or `helpers.ts`: a function with no home means the module
  boundaries are wrong.
- No emoji in code, comments, commit messages or documentation.
- Real `TODO`s stay, with a name and a date. Unresolved questions are part of
  an honest codebase.
- The README never promises what the code does not yet do.
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`.

Formatting is Prettier's job and is not worth discussing in review.

## Decisions

Anything with a real alternative gets a short record in `docs/decisions/`:
context, decision, what was rejected, consequences, and when to revisit. Five
short sections are enough.

## Reporting a wrong verdict

The most valuable bug report for this project. Use the "Wrong verdict" issue
template and include the repository, what Forkwise said, and what the truth is.
False accusations are worse than misses: one wrong claim costs the user's trust
in every other finding.

## Security

Do not open a public issue for a vulnerability. See [SECURITY.md](SECURITY.md).
