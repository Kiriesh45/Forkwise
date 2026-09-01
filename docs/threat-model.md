# Threat model

A browser extension runs with more privilege than a web page and sits between
the user and every site they visit. This document states what Forkwise is
trusted with, what could go wrong, and what has been done about it.

Scope: Forkwise v0.1.0, Manifest V3, Chrome.

## What is worth protecting

| Asset                           | Why it matters                                                      |
| ------------------------------- | ------------------------------------------------------------------- |
| The user's GitHub token         | Grants API access as them. Optional, but real.                      |
| Browsing activity on github.com | Which repositories someone reads can be sensitive on its own.       |
| The integrity of the verdict    | A security tool that can be made to lie is worse than none.         |
| The user's browser              | Extension code runs with extension privileges, not page privileges. |

## Trust boundaries

```
github.com page   │ untrusted: attacker-controlled content
──────────────────┼────────────────────────────────────────
content script    │ our code, but in a hostile neighbourhood
──────────────────┼────────────────────────────────────────
background worker │ trusted: holds the token and host permissions
──────────────────┼────────────────────────────────────────
api.github.com    │ semi-trusted: correct, but not ours
api.osv.dev       │ semi-trusted
```

Repository owners control names, descriptions, file paths, commit messages and
`package.json` contents. All of it is attacker-controlled input.

## Threats and what we do about them

### Path traversal through a repository name

A repository or branch name is taken from the address bar and interpolated into
an API URL. A crafted name containing `../` could redirect an authenticated
request to a different endpoint.

**Mitigation.** Every path segment goes through `encodeURIComponent` in
`GitHubClient`. This is why the helper is named `segment()` and has a comment
explaining it, rather than being inlined and forgotten.

### Injection through repository content

Descriptions, file paths and advisory summaries are rendered in the panel.

**Mitigation.** React escapes text by default and the code never uses
`dangerouslySetInnerHTML`. Evidence links are rendered as `href` on `<a>`
elements; a `javascript:` URL in that position does not execute in an
extension page under the default Manifest V3 content security policy.

**Residual risk.** Evidence URLs are built by us from GitHub data rather than
taken verbatim from it, which limits this further, but a future check that
surfaces an arbitrary URL from a third party would reopen it.

### Token theft

The token is the most valuable thing here.

**Mitigations.**

- It is only ever read inside the background service worker. The content
  script, which shares a process with page scripts, never sees it.
- It is never rendered back into the options page. The page reports that a
  token exists, not what it is.
- It is never logged. The catch-all error handler deliberately logs a generic
  message rather than request details.
- The options page asks for a fine-grained token with no permissions, which is
  sufficient for public data and grants access to nothing else.

**Residual risk, stated plainly.** `chrome.storage.local` is **not encrypted**.
The token sits in the browser profile on disk in cleartext, readable by any
process that can read the profile. Chrome offers no encrypted storage to
extensions, so this cannot be fixed, only disclosed — which the options page
does, in as many words. Users who find this unacceptable can run without a
token at 60 requests an hour.

### Over-broad permissions

An extension that can read every page can read banking sessions.

**Mitigations.**

- `host_permissions` lists exactly two hosts: `api.github.com` and
  `api.osv.dev`. Not `*://*/*`.
- The content script matches `*://github.com/*` only.
- Permissions are `storage` and `sidePanel`. No `tabs`, so Forkwise cannot
  enumerate open tabs or read browsing history.
- No `activeTab`, no `scripting`, no `webRequest`.

### Exfiltration of browsing activity

**Mitigation.** There is no backend and no telemetry. The only outbound
requests are to the two API hosts, and both are needed to answer the question
the user asked. Nothing records which repositories were visited beyond the
local cache, which never leaves the machine.

`chrome.storage.session` holds the current repository in memory only, so it
does not persist a browsing trail to disk. The analysis cache in
`storage.local` does persist and can be cleared by removing the extension's
data.

### Supply chain

The extension ships whatever its dependencies contain.

**Mitigations.** Runtime dependencies are React and React DOM, and nothing
else. `npm ci` in CI installs exactly what `package-lock.json` records.
Manifest V3 forbids loading remote code, so a compromised CDN cannot inject
anything after installation.

**Residual risk.** Build-time dependencies are numerous, as they always are.
GitHub Actions are pinned by commit SHA, so moving a tag no longer changes what
runs, but the npm dependency tree is still trusted wholesale at install time.
Dependabot raises pull requests for both; nothing reviews them but the author.

### A wrong verdict

Not a classic security threat, but the one most likely to do harm. A false
"clean" reading gives false confidence; a false accusation destroys trust in
every other finding.

**Mitigations.**

- Heuristics never report `fail`, only `warn`. Facts report `fail`.
- Anything undetermined is `unknown` and leaves the score alone rather than
  counting as a failure.
- Every finding carries evidence the user can click and verify.
- Coverage is stated: "56 of 68 dependencies checked", never a bare "clean".

## Out of scope

- A malicious extension already installed in the same browser. Chrome's
  extension isolation is the boundary there, not ours.
- A compromised local machine. If the profile is readable, so is the token.
- GitHub or OSV returning deliberately false data.
- Denial of service against GitHub. We are a read-only client with a hard
  request cap.

## Reporting

Vulnerabilities go to the address in [SECURITY.md](../SECURITY.md), privately,
before any public disclosure.
