# Security policy

## Supported versions

Forkwise is pre-1.0. Only the latest release receives fixes.

## Reporting a vulnerability

Please report privately, before any public disclosure.

Use GitHub's [private vulnerability reporting](https://github.com/kiresh/forkwise/security/advisories/new)
on this repository. If that is unavailable to you, open an issue titled
"Security contact request" containing no details, and a private channel will be
arranged.

Please include what you can:

- what an attacker can do, and what they need in order to do it
- steps to reproduce
- the version or commit you tested

**Expect a first reply within 7 days.** This is a student project maintained by
one person in their spare time, so that is a realistic promise rather than an
ambitious one.

## What is in scope

The extension itself: its permissions, how it handles the optional GitHub
token, what it renders from untrusted repository content, and the requests it
makes.

[docs/threat-model.md](docs/threat-model.md) documents the trust boundaries and
the risks already known and accepted — most notably that Chrome's extension
storage is not encrypted, which is disclosed to the user in the options page.

## What is out of scope

- Reports that extension storage is unencrypted. This is a documented Chrome
  limitation with no fix available to extensions.
- Vulnerabilities in GitHub or OSV. Report those to them.
- Findings against build-time dependencies with no path to exploiting an
  installed extension.
- Automated scanner output with no demonstrated impact.

## Disclosure

Once a fix is released, the advisory will be published and credited to the
reporter unless they prefer otherwise.
