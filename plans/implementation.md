# ADM CLI — Implementation Plan

> Source: PRD at `/home/akow/Documents/ADM-CLI/plans/prd.md`

## Architectural Decisions

Durable decisions that apply across all phases:

- **Architecture Style**: Node.js CLI application with plugin system
- **Data Model**: Single-user config at `~/.adm/config.json` (JSON format)
- **Security**: Tokens stored in OS keychain (macOS) / encrypted file (Linux)
- **CLI Framework**: `commander.js` for argument parsing, `inquirer.js` for interactive prompts
- **Third-party Integrations**: GitHub API (`@octokit/rest`), GitLab API (`@gitbeaker/node`)
- **Target Platforms**: macOS and Linux (Bash/Zsh shells only)
- **Package Managers**: npm/pnpm for Node.js dependencies, brew/apt for system packages
- **Distribution**: Curl installer script, Homebrew tap, direct shell execution (bash/zsh/sudo support)

---

## Implementation Phases Overview

| # | Phase | Status | User Stories | Duration |
|---|-------|--------|--------------|----------|
| 1 | [Foundation + Installer](./phase-1-foundation-installer.md) | TODO | US-1 | 1-2 weeks |
| 2 | [GitHub Integration](./phase-2-github-integration.md) | TODO | US-2 | 1 week |
| 3 | [Assistant Shell](./phase-3-assistant-shell.md) | TODO | US-3 | 1-2 weeks |
| 4 | [Vibe Features](./phase-4-vibe-features.md) | TODO | US-6 | 3-5 days |
| 5 | [Plugins & Dotfiles](./phase-5-plugins-dotfiles.md) | TODO | US-4, US-5 | 1 week |
| 6 | [Polish & Release](./phase-6-polish-release.md) | TODO | All | 3-5 days |

**Total Estimated Duration**: 4-6 weeks (MVP)

---

## Quick Links

- See each phase file for detailed acceptance criteria, assumptions, and out-of-scope items
- See [prd.md](./prd.md) for full product requirements
- See [../src/](../src/) for implementation source code

