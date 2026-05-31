# Phase 5: Plugins & Dotfiles

> User Stories: US-4 (Plugin Support), US-5 (Dotfiles Sync)

## What to Build

Extensibility system for custom commands and automated dotfiles restoration.

**Deliverables:**
1. Plugin system loading .js files from `~/.adm/plugins/`
2. `adm my-custom-cmd` auto-loads and runs matching plugin
3. Plugin context API (access to GitHub/GitLab APIs, config, logger)
4. Example plugin shipped with ADM (e.g., `audit-deps` command)
5. Dotfiles sync system:
   - `adm dotfiles sync` pulls latest from dotfiles repo
   - Symlink or copy dotfiles (.bashrc, .zshrc, .gitconfig, .ssh/config)
   - Conflict detection and user prompts
   - Per-file selective sync option
6. GitLab integration (token storage, issue/MR list, similar to GitHub Phase 2)

## Assumptions Carried In

- Phase 1-4 are complete
- Plugin files are valid Node.js modules
- Dotfiles repo is accessible (GitHub, GitLab, or local path)
- User can make symlinks or copy files
- OS keychain is available for GitLab token (like GitHub Phase 2)

## Out of Scope for This Phase

- Plugin registry / package manager (Phase 1: Enhancements)
- Plugin auto-update (Phase 1: Enhancements)
- Multi-device dotfiles sync (Phase 1: Enhancements)
- Secrets management (env vars, API keys) — Phase 1: Enhancements

## Acceptance Criteria

- [ ] Plugin system loads .js files from `~/.adm/plugins/` directory — [test: create dummy plugin, verify it loads and is callable]
- [ ] `adm my-custom-cmd` auto-discovers and runs matching plugin — [command: `adm audit-deps` loads and runs `~/.adm/plugins/audit-deps.js`]
- [ ] Plugin context API provides access to GitHub API, config, logger — [test: plugin calls `context.github.listPRs()` and receives data]
- [ ] Example plugin (`audit-deps`) ships with ADM and runs without error — [command: `adm audit-deps` executes and produces sensible output]
- [ ] Plugin error handling (missing file, syntax error, runtime error) is graceful — [test: plugin with syntax error, verify user-friendly error message]
- [ ] `adm dotfiles sync` clones/pulls dotfiles repo to `~/.adm/dotfiles/` — [observable: `ls -la ~/.adm/dotfiles/` shows cloned repo]
- [ ] Dotfiles sync symlinks or copies files (.bashrc, .zshrc, .gitconfig, .ssh/config) without overwriting — [test: setup with existing dotfiles repo, verify no conflicts, symlinks created]
- [ ] Conflict detection: if dotfile exists locally, prompt user (skip, backup+replace, merge) — [manual test: run sync with conflicting files, verify prompts appear]
- [ ] Per-file selective sync available (e.g., `adm dotfiles sync --only bashrc,zshrc`) — [command: selective sync only updates specified files]
- [ ] `adm connect gitlab` stores token securely like GitHub (Phase 2) — [test: token stored in keychain/encrypted file]
- [ ] `adm mr list` (merge requests) works for GitLab like `adm pr list` for GitHub — [command: `adm mr list` outputs user's open MRs]
- [ ] `adm issue list` works for both GitHub and GitLab — [command: `adm issue list` shows issues from connected platforms]
- [ ] Dotfiles sync preserves file permissions (e.g., +x for executable scripts) — [test: sync executable script, verify permissions preserved]

## Key Components to Implement

- `src/plugins/loader.js` — Plugin discovery and loading from `~/.adm/plugins/`
- `src/plugins/context.js` — Plugin context API (GitHub, GitLab, config, logger)
- `src/plugins/examples/audit-deps.js` — Example plugin
- `src/commands/dotfiles.js` — Dotfiles sync command
- `src/utils/dotfiles-sync.js` — Dotfiles cloning, linking, merging logic
- `src/utils/file-conflict-handler.js` — Conflict detection and user prompts
- `src/integrations/gitlab.js` — GitLab API wrapper (@gitbeaker/node)
- `src/commands/mr.js` — Merge request list/draft/comment (GitLab)
- `src/commands/issue.js` — Issue list command supporting both GitHub and GitLab

