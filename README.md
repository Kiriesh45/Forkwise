# Forkwise

[![CI](https://github.com/Kiriesh45/Forkwise/actions/workflows/ci.yml/badge.svg)](https://github.com/Kiriesh45/Forkwise/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> Stars measure popularity, not health. Forkwise grades the repository you are
> looking at, in a side panel, before you add it as a dependency.

![Forkwise analysing a repository](docs/demo.gif)

## The problem

A repository can have four thousand stars and still be unmaintained for two
years, have a single maintainer, ship no license, and depend on packages with
published vulnerabilities. Finding that out means opening six tabs and reading
carefully.

Forkwise answers the question stars cannot: **should I depend on this?**

## What it checks

| Check                                                    | What a failure means                                                         |
| -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Archived                                                 | The owner has declared the project read-only. Nothing will be fixed.         |
| Known vulnerabilities                                    | A dependency version matches a published advisory in [OSV](https://osv.dev). |
| License                                                  | No license means "all rights reserved" — legally not reusable.               |
| Recent activity                                          | Nobody has pushed in over a year.                                            |
| Maintainers                                              | One person's attention is the whole project's bus factor.                    |
| Tests, CI                                                | Nothing automatically stops a release from breaking dependents.              |
| README, security policy, contribution guide, description | Signals of how the project is run.                                           |

Each finding carries evidence you can click and check. The score is a summary
of the findings, never a replacement for them — see
[docs/scoring.md](docs/scoring.md) for the model and the reasoning behind every
weight.

## Three rules it follows

1. **No claim without evidence.** Every result links to the file, commit or
   advisory it came from.
2. **Guesses never fail a repository.** Test and CI detection matches naming
   conventions and can be wrong, so it warns at worst. Only facts fail.
3. **"Unknown" is an answer.** When GitHub truncates a huge file tree, or a
   library ships no lockfile, Forkwise says so and leaves the score alone
   rather than assuming the worst.

## Privacy

No account, no backend, no telemetry. Requests go from your browser to
`api.github.com` and `api.osv.dev`, and nowhere else. Analyses are cached
locally for a day so that browsing does not exhaust GitHub's request limit.

Full text: [docs/privacy-policy.md](docs/privacy-policy.md). What could go
wrong and what was done about it: [docs/threat-model.md](docs/threat-model.md).

## Install

Not yet in the Chrome Web Store. To run it from source you need Node.js 20 or
newer:

```bash
git clone https://github.com/Kiriesh45/Forkwise.git
cd forkwise
npm ci
npm run build
```

Then open `chrome://extensions`, turn on **Developer mode**, choose **Load
unpacked**, and select `.output/chrome-mv3`.

Open any repository on github.com and click the Forkwise icon.

### Optional: a GitHub token

Without one, GitHub allows 60 API requests an hour and a single analysis costs
up to five. A fine-grained token **with no permissions selected** raises that
to 5000. Add it under the extension's options.

Extension storage is not encrypted; the options page says so before you paste
anything.

## Development

```bash
npm run dev          # extension with hot reload
npm test             # unit tests
npm run lint         # eslint, including type-aware rules
npm run typecheck    # tsc
npm run play -- owner/repo   # run the analysis in the terminal, no browser
```

`npm run play` is the fastest way to work on checks: the whole analysis engine
is plain TypeScript with no browser dependencies.

## How it is put together

- [docs/architecture.md](docs/architecture.md) — the layers and why they are
  separated
- [docs/scoring.md](docs/scoring.md) — weights, ceilings and their rationale
- [docs/decisions/](docs/decisions) — records of decisions and rejected
  alternatives
- [docs/ROADMAP.md](docs/ROADMAP.md) — what is built and what is next

## Contributing

Issues and pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).
Reports of a **wrong verdict** are especially useful: a security tool that
misjudges a repository is worse than none, and there is an issue template for
exactly that.

## License

MIT — see [LICENSE](LICENSE).
