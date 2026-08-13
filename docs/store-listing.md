# Chrome Web Store listing

Source text for the store submission, kept in the repository so it can be
reviewed and updated like anything else.

## Name

Forkwise

## Short description (132 characters max)

Grades the health and security of any GitHub repository, in a side panel,
before you add it as a dependency.

## Detailed description

Stars measure popularity, not health. A repository can have thousands of them
and still be unmaintained for two years, have a single maintainer, ship no
license, and depend on packages with published vulnerabilities.

Forkwise answers the question stars cannot: should I depend on this?

Open any repository on github.com and the side panel shows:

- Whether the project is archived or has stopped receiving commits
- Its license, including the case where nobody can identify it
- Known vulnerabilities in its declared dependencies, from the OSV database
- Whether it has tests, continuous integration, a README, a security policy
- How many people have touched it recently
- A score from 0 to 100, with every point traceable to a finding

Every claim comes with evidence you can click and check for yourself. Nothing
is guessed: where Forkwise cannot determine something, it says so instead of
assuming the worst.

Forkwise has no account, no backend and no telemetry. Requests go from your
browser to api.github.com and api.osv.dev, and nowhere else.

Open source under the MIT license: https://github.com/kiresh/forkwise

## Category

Developer Tools

## Permission justifications

Reviewers ask for these individually. Each answer says what breaks without it.

**storage**
Caches analysis results for 24 hours and stores an optional GitHub token.
GitHub allows 60 API requests an hour and one analysis costs up to five;
without caching, the extension stops working after about twelve repositories.

**sidePanel**
The analysis is displayed in Chrome's side panel. This is the extension's only
user interface.

**host permission: https://api.github.com/**
Reads public repository metadata, file lists, recent commits and manifests.
This is the data being analysed; the extension has no other source for it.

**host permission: https://api.osv.dev/**
Looks up published vulnerability advisories for the dependency versions found
in the repository's lockfile. OSV is an open database operated by the OpenSSF.

**Content script on github.com**
Reads the address bar to know which repository is open. It does not read page
content, does not modify the page, and does not have access to the stored
token.

**Remote code**
None. All code is bundled in the package, as Manifest V3 requires.

**Data collection disclosure**
No user data is collected, transmitted to the developer, or sold. The extension
has no backend.

## Single purpose statement

Forkwise has one purpose: showing an evidence-backed assessment of the health
and security of the GitHub repository the user is currently viewing.
