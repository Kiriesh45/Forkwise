# Changelog

Notable changes, newest first. Follows [Keep a Changelog](https://keepachangelog.com)
and [Semantic Versioning](https://semver.org).

## [0.1.0] — unreleased

First working version.

### Added

- Side panel that grades the GitHub repository currently open, with a score
  from 0 to 100 and evidence for every finding.
- Eleven checks: archived status, license, known vulnerabilities in
  dependencies, recent activity, active contributors, tests, CI, README,
  security policy, contribution guide and description.
- Vulnerability lookups through [OSV](https://osv.dev), with versions resolved
  from `package-lock.json` and reported as unknown when only ranges exist.
- Scoring model with documented weights and ceilings for fatal findings
  (`docs/scoring.md`).
- Local cache with a 24-hour lifetime, keyed by scoring version, serving stale
  results when a refresh is impossible.
- Options page for an optional GitHub token, verified before it is stored.
- Architecture, threat model and privacy documentation.

[0.1.0]: https://github.com/kiresh/forkwise/releases/tag/v0.1.0
