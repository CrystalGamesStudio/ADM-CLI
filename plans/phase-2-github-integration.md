# Phase 2: GitHub Integration

> User Stories: US-2 (GitHub Integration)

## What to Build

Secure GitHub account connection and PR/issue management from CLI.

**Deliverables:**
1. `adm connect github` command with OAuth token or PAT token input
2. Secure token storage in OS keychain (macOS) / encrypted file (Linux)
3. `adm connect --list` to show connected services
4. `adm connect --disconnect github` to revoke and remove token
5. `adm pr list` command to fetch and display open PRs for user's orgs
6. `adm pr draft <title>` command to create a draft PR from current git branch
7. `adm pr comment <pr#> <message>` command to add comments to PRs
8. GitHub API error handling (rate limits, auth failures, network issues)

## Assumptions Carried In

- Phase 1 (setup and config storage) is complete
- User has GitHub account and can generate PAT token or use OAuth
- Network is available for API calls
- `@octokit/rest` library is available for GitHub API

## Out of Scope for This Phase

- GitLab integration (Phase 5)
- PR draft automation with templates (Phase 5+)
- GitHub Actions workflow management (Phase 1: Enhancements)
- Notifications / webhooks (Phase 1: Enhancements)
- PR review suggestions (Phase 3: Assistant)

## Acceptance Criteria

- [ ] `adm connect github` prompts for token and stores securely in keychain/encrypted file — [test: token stored in macOS Keychain via `security find-generic-password`, Linux via encrypted file]
- [ ] `adm connect --list` shows connected services with masked token — [command: `adm connect --list` outputs "GitHub: connected" without exposing token]
- [ ] `adm connect --disconnect github` removes token cleanly — [observable: token removed from keychain/file, `adm connect --list` no longer shows GitHub]
- [ ] `adm pr list` fetches and displays user's open PRs from all orgs — [command: `adm pr list` outputs formatted table of PRs (title, repo, status, URL)]
- [ ] `adm pr draft <title>` creates draft PR from current branch with provided title — [test: run command on test branch, verify draft PR exists on GitHub]
- [ ] `adm pr comment <pr#> <message>` adds comment to PR — [observable: comment appears on GitHub PR page within 2s]
- [ ] GitHub API rate limit errors are handled gracefully with user-friendly message — [test: mock rate limit error, verify error message is clear]
- [ ] Authentication failures (bad token, expired token) are caught and suggest reconnect — [test: use expired token, verify prompt to `adm connect github` again]
- [ ] Network errors (offline, timeout) are caught and suggest retry — [test: disconnect network, run command, verify network error message]
- [ ] Token rotation is supported; existing token can be replaced without issues — [command: `adm connect github` twice, verify second token overwrites first]

## Key Components to Implement

- `src/commands/connect.js` — GitHub/GitLab connection logic
- `src/integrations/github.js` — GitHub API wrapper (@octokit/rest)
- `src/integrations/gitlab.js` — Placeholder for Phase 5 (stub)
- `src/commands/pr.js` — PR list, draft, comment subcommands
- `src/utils/keychain.js` — OS keychain abstraction (macOS/Linux)
- `src/utils/token-encryption.js` — Encrypted token storage for Linux
- `src/utils/github-error-handler.js` — GitHub API error handling and user messages

