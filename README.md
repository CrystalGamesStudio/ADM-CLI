# ADM CLI

## Executive Summary

**ADM** is a developer-focused CLI tool that automates environment setup on new machines and provides an AI-powered daily assistant for development workflows. It targets Node.js/web developers on macOS and Linux, reducing initial dev setup from hours to minutes while staying available as an intelligent companion throughout development.

---

## Problem Statement

### Current State
Developers joining a new team or setting up a new machine face:
- **Manual setup** — Installing Node.js, package managers (pnpm, npm), build tools, and dependencies manually
- **No standardization** — Each developer's setup differs (dotfiles, SSH keys, git configs)
- **Workflow friction** — GitHub/GitLab interactions, boilerplate PR commits, environment variables scattered
- **Context switching** — No unified interface; tools fragmented across terminal, GitHub web, git CLI

### Desired State
- **One-command setup** — `curl | sh | sudo` or `brew install` installs ADM, runs interactive setup
- **Config restoration** — Automatically syncs dotfiles, SSH keys, git config from previous setup or GitHub
- **Daily assistant** — Stays in terminal as intelligent copilot for GH/GitLab tasks, AI suggestions, repo navigation
- **Extensible** — Plugins, templates, integrations users can customize

### Success Metrics
- Time to productive dev environment: < 5 minutes
- Setup completion rate: ≥ 90% without manual intervention
- Assistant adoption: ≥ 50% of users keep ADM running during dev session
- Plugin ecosystem: ≥ 5 community plugins within 6 months

---

## User Personas

### 1. **New Team Member (Primary)**
- **Goal**: Set up a dev machine quickly, match team standards
- **Pain**: Manual brew installs, forgetting toolchain steps, missing dotfiles
- **Interaction**: Run setup once, then forget ADM exists (or enable assistant mode optionally)

### 2. **Experienced Developer (Secondary)**
- **Goal**: Automate daily GH/GitLab tasks, AI-assisted coding
- **Pain**: Repetitive PR comments, manual commit messages, terminal context switches
- **Interaction**: Keep ADM running; use commands like `adm pr draft`, `adm commit suggest`, `adm ai <question>`

### 3. **DevOps/Team Lead (Tertiary)**
- **Goal**: Standardize team toolchain via ADM templates/config
- **Pain**: Inconsistent setups, duplicate onboarding docs
- **Interaction**: Create `.adm/team-setup.yml`, distribute via team plugin registry

---

## Scope & Features

### Phase 0: Foundation (MVP)
#### 1.1 Installation & Distribution
- **curl | sh installer** — Single script downloads ADM binary, installs to `/usr/local/bin/adm`
- **Homebrew tap** — `brew install adm-cli/core/adm`
- **System prerequisites** — Detect and guide user if shell is not Bash/Zsh
- **Uninstall** — `adm uninstall` removes cleanly

#### 1.2 Interactive Setup Mode (`adm setup`)
**Workflow:**
1. Ask user what tools to install (Node.js version, pnpm/npm, Vite, Docker, etc.)
2. Ask for GH/GitLab credentials (optional; prompt for OAuth token or SSH key)
3. Ask for dotfiles location (GitHub repo URL or local path)
4. Ask for SSH key setup (generate new or restore from backup)
5. Ask if assistant mode should be enabled
6. Install selections, sync configs, write state to `~/.adm/config.json`

**Installer Features:**
- Node.js: nvm wrapper (install latest LTS or user-specified version)
- Package managers: pnpm, npm (via npm itself or custom install)
- Build tools: Vite, esbuild, webpack (quick starters)
- System packages: brew/apt wrappers for utilities (git, gh cli, etc.)
- Dotfiles sync: Clone/pull from repo, apply (bashrc, zshrc, gitconfig, ssh config)
- SSH setup: Generate ED25519 key, add to GitHub/GitLab (if connected)
- Git config: user.name, user.email, commit.gpgsign (optional)

#### 1.3 Connection Mode (`adm connect`)
- Link GitHub account (OAuth flow or PAT token)
- Link GitLab account (PAT token)
- Store tokens in secure storage (OS keychain/1password if available, else encrypted file)
- List connected services: `adm connect --list`
- Disconnect: `adm connect --disconnect github`

#### 1.4 Assistant Mode (`adm` interactive, or `adm --assistant`)
**Interactive shell** with commands:
- `ai <question>` — Ask Claude/GPT for code suggestions, debugging, explanation
- `pr list` — List open PRs for org/user (from GitHub/GitLab)
- `pr draft <title>` — Create draft PR from current branch
- `pr comment <pr#> <msg>` — Comment on PR
- `issue list` — List issues, filter by label/assignee
- `commit suggest` — Suggest commit message based on staged changes
- `open <repo/org/branch>` — Clone and open repo in editor or jump to branch
- `app launch <name>` — Launch app from launcher config (VSCode, Docker, etc.)
- `status` — Show git status, pending PRs, issues assigned to you
- `help` — Built-in command reference

**Vibe Features:**
- ASCII clock with animations (standby mode, shows time + random dev quotes)
- Theme support (colors: dark/light/custom)
- Command suggestions (fuzzy search, history)
- Live PR/issue notifications (optional)

#### 1.5 Plugin System (`~/.adm/plugins/`)
Users can:
- Write custom commands as .js files
- Share via npm or GitHub gists
- Load at startup: `adm --plugin-dir ./my-plugins`

#### 1.6 Repo Templates
- Pre-made templates for React/Node/full-stack projects
- `adm new <template>` clones template, updates git remote
- Team can publish custom templates to npm/GitHub

---

### Phase 1: Enhancements (Post-MVP)
- Secrets management (env vars, API keys, stored securely)
- GitHub Actions workflow templating
- Dotfiles auto-update (pull latest every session)
- Multi-device sync (state synced to GitHub Gist or simple cloud store)
- VS Code extension integration
- Shell completion (bash/zsh/fish)
- Telemetry & opt-in usage stats
- Community plugin registry (web interface)

---

## Technical Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────┐
│                    ADM CLI (Node.js)                    │
├─────────────────────────────────────────────────────────┤
│ bin/adm                      (entry point)              │
├─────────────────────────────────────────────────────────┤
│ src/                                                    │
│  ├─ commands/                (setup, connect, ai, etc.)│
│  ├─ integrations/            (GitHub, GitLab, SSH)     │
│  ├─ installer/               (Node, pnpm, system pkgs) │
│  ├─ ui/                      (interactive prompts, TUI)│
│  ├─ utils/                   (config, keychain, etc.)  │
│  └─ plugins/                 (plugin loader)           │
├─────────────────────────────────────────────────────────┤
│ ~/.adm/                      (user state)               │
│  ├─ config.json              (settings, tokens)        │
│  ├─ plugins/                 (custom commands)         │
│  └─ cache/                   (PR/issue cache, logs)    │
└─────────────────────────────────────────────────────────┘
```

### Key Dependencies (Node.js ecosystem)
- **CLI framework**: `commander.js` or `yargs` (argument parsing)
- **Interactive UI**: `inquirer.js` (prompts), `chalk` (colors), `ora` (spinners)
- **GitHub**: `@octokit/rest` (GitHub API)
- **GitLab**: `@gitbeaker/node` (GitLab API)
- **Execution**: `execa` (shell commands)
- **Config**: `rc` or `cosmiconfig` (dotfile parsing)
- **Security**: `keytar` (OS keychain), `crypto` (encryption)
- **ASCII art**: `figlet`, custom animations

### Install Flow (Bash/Zsh)
```bash
#!/bin/bash
# installer.sh (distributed via curl | sh)
# 1. Detect OS (macOS/Linux)
# 2. Download Node.js binary or use system node
# 3. Download ADM tarball
# 4. Extract to /usr/local/bin/adm
# 5. Make executable
# 6. Run adm setup (interactive)
```

---

## User Stories & Validation

### US-1: First-Time Setup (Persona: New Team Member)
**As a** new developer joining the team  
**I want to** run a single command and have my dev environment ready  
**So that** I can start coding within 5 minutes  

**Acceptance Criteria:**
1. `curl https://adm.sh/install | sh` or `brew install adm-cli/core/adm` installs ADM
2. `adm setup` launches interactive wizard
3. Wizard completes Node.js + pnpm + git setup in < 3 minutes
4. `node -v` and `pnpm -v` work after setup

**Validation:**
- [ ] Fresh macOS/Linux VM: run install, measure time to functional env
- [ ] E2E test: setup with mock inputs, verify binaries installed and in PATH

---

### US-2: GitHub Integration (Persona: Experienced Developer)
**As a** developer working on a team  
**I want to** optionally connect my GitHub account and manage PRs/issues from CLI  
**So that** I don't need to context-switch to GitHub web  

**Acceptance Criteria:**
1. `adm connect github` prompts for token, stores securely
2. `adm pr list` shows open PRs for my orgs
3. `adm pr draft <title>` creates draft PR from current branch
4. `adm connect --disconnect github` removes token cleanly

**Validation:**
- [ ] Integration test with GitHub API (mock or test org)
- [ ] Token stored in OS keychain (macOS) or encrypted file (Linux)
- [ ] `adm connect --list` shows connected services

---

### US-3: Daily Assistant (Persona: Experienced Developer)
**As a** developer  
**I want to** keep ADM running as an interactive assistant in my terminal  
**So that** I can quickly ask AI questions, check PR status, draft commits  

**Acceptance Criteria:**
1. `adm --assistant` or `adm` (no args) launches interactive shell
2. Shell accepts commands: `ai <q>`, `pr list`, `commit suggest`, `status`
3. ASCII clock animates in standby (every 5s, shows time + quote)
4. `exit` cleanly closes assistant

**Validation:**
- [ ] Manual test: start assistant, run 5 commands, verify output
- [ ] Verify ASCII clock renders without terminal breakage
- [ ] Test on macOS (Terminal, iTerm2) and Linux (bash, zsh)

---

### US-4: Plugin Support (Persona: Team Lead)
**As a** team lead  
**I want to** extend ADM with custom commands for my team's workflow  
**So that** we maintain a standardized set of dev tools  

**Acceptance Criteria:**
1. Plugins are .js files in `~/.adm/plugins/`
2. `adm my-custom-cmd` loads and runs plugin automatically
3. Plugins can access GitHub/GitLab APIs via ADM context
4. Example plugin ships with ADM (e.g., `audit-deps`)

**Validation:**
- [ ] E2E test: create dummy plugin, verify it loads and runs
- [ ] Verify plugin error handling (missing file, syntax error)

---

### US-5: Dotfiles Sync (Persona: New Team Member)
**As a** developer setting up a new machine  
**I want to** automatically restore my dotfiles (bashrc, zshrc, gitconfig, ssh config)  
**So that** my environment matches my previous setup  

**Acceptance Criteria:**
1. Setup wizard asks for dotfiles repo URL (or GitHub gist)
2. ADM clones repo to `~/.adm/dotfiles/`
3. Symlinks or copies `.bashrc`, `.zshrc`, `.gitconfig`, `.ssh/config`
4. `adm dotfiles sync` pulls latest updates

**Validation:**
- [ ] E2E test: setup with mock dotfiles repo, verify symlinks created
- [ ] Verify no file conflicts/overwrites without user prompt

---

### US-6: Vibe Features (Persona: Both)
**As a** developer  
**I want to** enjoy visual feedback and personality in the CLI  
**So that** the dev experience feels polished and fun  

**Acceptance Criteria:**
1. ASCII clock animates in standby mode (refreshes every 5s)
2. Color scheme adapts to terminal dark/light mode
3. Random dev quotes appear alongside clock
4. Animations do not break on slow terminals

**Validation:**
- [ ] Visual regression test: ASCII rendering on multiple terminal emulators
- [ ] Verify animations are optional (disable via config)

---

## Assumptions

1. **Target users have** Bash or Zsh installed (not fish or Windows native shells)
2. **GitHub/GitLab tokens** are optional; setup works offline
3. **macOS has** Homebrew-compatible package manager; Linux has apt
4. **Node.js v18+** is available or can be installed via installer
5. **OS keychain** is available on macOS; Linux uses encrypted file storage by default
6. **Network is available** during setup (for downloading packages and cloning dotfiles)
7. **Users want opt-in GitHub connection** rather than forced OAuth
8. **Plugin ecosystem** will grow organically; registry is manual (GitHub repo list) in MVP

---

## Tradeoffs Considered

| Alternative | Rejected Reason |
|---|---|
| Rust binary (faster, single binary) | Node.js ecosystem superior for plugins; install time acceptable |
| Python (more familiar) | Node.js has better CLI/TUI libraries; pnpm/npm fit vibe |
| Unified setup + assistant in one mode | UX friction; new devs want quick setup; assistant is opt-in |
| Mandatory GitHub connection | Privacy concern; offline setup is important for some users |
| Web-based dashboard | CLI-first design; web dashboard can be Phase 2 |
| Custom package manager | System package managers (brew/apt) are trusted; reduces maintenance |

---

## Success Criteria (Phase 0)

- [ ] ADM installs via `curl | sh` and `brew install` on macOS/Linux
- [ ] Setup wizard completes in < 5 minutes with default selections
- [ ] GitHub integration (token storage, PR list) works end-to-end
- [ ] Assistant mode runs interactively with ≥ 5 core commands
- [ ] ASCII vibe features (clock, animations) render on Terminal, iTerm2, common Linux shells
- [ ] Plugin system loads and executes custom commands
- [ ] Dotfiles sync works without conflicts
- [ ] No external dependencies beyond Node.js ecosystem

---

## Open Questions

- Should ADM auto-update? (Phase 1)
- How to handle multi-device state sync? (Phase 1)
- Should ADM expose VS Code extension? (Phase 1)
- Community plugin registry — GitHub org or npm namespace? (Phase 1)
- AI backend — OpenAI, Anthropic, or pluggable? (Phase 1, requires decision)

---

## Timeline

- **MVP (Phase 0)**: 4-6 weeks (setup, connect, basic assistant, vibe)
- **Phase 1**: 2-3 months (enhancements, plugins, multi-device sync)
- **Phase 2+**: Community feedback-driven (web dashboard, VS Code ext, etc.)
