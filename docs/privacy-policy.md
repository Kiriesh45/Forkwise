# Privacy policy

Last updated: 2026-08-13

## The short version

Forkwise collects nothing, sends nothing to its authors, and has no server.

## What leaves your browser

Two requests, both made directly from your browser, both necessary to answer
the question you asked by opening a repository:

- **api.github.com** — public metadata about the repository you are viewing:
  its file list, recent commits, and `package.json` if it has one. If you have
  saved a token, it is sent to GitHub as authentication, which is its purpose.
- **api.osv.dev** — the names and versions of the repository's declared
  dependencies, to look up published vulnerability advisories.

Nothing else is contacted. There is no analytics service, no error reporting
service, and no author-operated backend.

## What is stored, and where

All of it stays on your computer, in the browser's extension storage:

- **Analysis results**, cached for 24 hours so that revisiting a repository
  does not spend your GitHub request budget. At most 200 repositories.
- **Your GitHub token**, if you chose to add one.
- **The repository currently open**, held in session storage, which is memory
  only and discarded when the browser closes.

Removing the extension removes all of it.

## About the token

Extension storage is not encrypted. A token saved in Forkwise is written to
your browser profile on disk in cleartext, where any program able to read that
profile can read it. Chrome provides extensions with no encrypted alternative.

Use a fine-grained token with no permissions selected — Forkwise reads only
public data — or use Forkwise without one and accept the lower request limit.

## Third parties

GitHub and OSV receive the requests described above and apply their own
policies:

- [GitHub Privacy Statement](https://docs.github.com/site-policy/privacy-policies/github-privacy-statement)
- [OSV](https://osv.dev)

## Children

Forkwise is a developer tool and is not directed at children.

## Changes

Material changes will be noted in [CHANGELOG.md](../CHANGELOG.md) and reflected
in the date at the top of this file.

## Contact

Open an issue at https://github.com/Kiriesh45/Forkwise/issues.
