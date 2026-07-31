# ADM CLI

**ADM** is a TUI-only developer tool that automates environment setup on new machines and provides an AI-powered daily assistant for development workflows. One command — `adm` — opens a full-screen terminal interface where everything happens: AI chat, setup, GitHub/GitLab management, tool installation, and configuration.

Targets Node.js/web developers on macOS, Linux, and Windows — reducing initial dev setup from hours to minutes while staying available as an intelligent companion throughout development.

---

## Installation

### npm (recommended)

```bash
npm install -g @crystalplatforms/adm
```

### macOS / Linux (curl)

```bash
curl -fsSL https://raw.githubusercontent.com/CrystalPlatforms/ADM-CLI/main/scripts/installer.sh | sh
```

### Homebrew (macOS / Linux)

```bash
brew tap CrystalPlatforms/tap
brew install CrystalPlatforms/tap/adm
```

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/CrystalPlatforms/ADM-CLI/main/scripts/install.ps1 | iex
```

**Prerequisites:** Node.js 18+ must be installed. The curl and PowerShell installers will check for this and provide installation instructions if missing.

---

## Quick Start

```bash
# Launch full-screen TUI
adm

# Inside the TUI:
/help            — Show all commands
/ai              — Toggle AI mode (blue input, chat with GLM)
/ai <question>   — One-off AI query without toggling mode
/github status   — GitHub status
/gitlab status   — GitLab status
/download        — Launch extension setup wizard
/feedback        — Open feedback page in browser
/theme cyberpunk — Switch theme
/exit            — Quit ADM
```

---

## TUI Commands

| Command | Description |
|---------|-------------|
| `/help` | Show command reference |
| `/exit` | Exit ADM |
| `/clear` | Clear message history |
| `/theme` | List or switch themes (dark, light, cyberpunk, nord, forest, monokai) |
| `/config` | Show current configuration |
| `/ai` | Toggle AI mode ON/OFF — input turns blue, questions go to GLM API |
| `/ai <question>` | One-off AI query without toggling mode |
| `/model` | Show or switch AI provider |
| `/github` | GitHub operations: status, pr, issue, commit |
| `/gitlab` | GitLab operations: status, mr, issue, commit |
| `/download` | Launch extension setup wizard |
| `/feedback` | Open feedback page in browser |
| `/connect` | Connect to GitHub or GitLab |
| `/dotfiles` | Sync dotfiles from repo |
| `/upgrade` | Check for and install updates |

### AI Mode

When AI mode is ON (`/ai`):
- Input bar turns **blue** with `AI>` prompt
- Status bar shows **AI: ON** (green)
- Everything typed goes directly to GLM API
- Responses appear with **GLM:** prefix
- Press `Esc` or type `exit` to leave AI mode

AI knowledge system: on first run, ADM reads its own docs (README, PRD) and caches a compact summary in `~/.adm/ai-knowledge.json`. This knowledge is injected as a system message in every AI query, so the AI knows about ADM itself. Cache auto-updates when ADM version changes.

---

## Technical Architecture

### Stack
- **Runtime**: Node.js 18+
- **TUI**: ink v5 + React 18 (full-screen terminal UI)
- **AI**: GLM API (Zhipu AI) — `glm-4.7-flash` model with automatic fallback
- **GitHub**: `@octokit/rest`
- **Styling**: chalk v4, 6 built-in themes
- **Testing**: Jest

### Project Structure

```
src/
├── tui/                          # Full-screen TUI (ink + React)
│   ├── app.js                    # Main App component (status bar, messages, input)
│   ├── app-state.js              # State management + AI mode logic
│   └── commands/
│       └── registry.js           # Unified command dispatch + autocomplete
├── ai/
│   └── knowledge.js              # AI knowledge cache (reads docs, invalidates on version)
├── integrations/
│   ├── ai-backend.js             # GLM API client (query, retry, fallback models)
│   ├── github.js                 # GitHub API (PRs, issues)
│   └── gitlab.js                 # GitLab API (MRs, issues)
├── installer/                    # Node.js, package managers, system packages
├── config/                       # Configuration system (~/.adm/config.json)
├── plugins/                      # Plugin loader (~/.adm/plugins/)
├── ui/                           # Themes, ASCII clock, animations, spinner
└── utils/                        # Keychain, encryption, dotfiles sync, fuzzy search
```

### User State

```
~/.adm/
├── config.json          — Settings (theme, AI provider, tokens)
├── ai-knowledge.json    — Cached ADM docs for AI context
├── plugins/             — Custom command plugins (.js)
├── tokens.enc           — Encrypted service tokens
└── history              — Command history
```

---

## Key Features

### Full-Screen TUI
Single `adm` command launches an ink-based terminal UI with:
- **Status bar** — theme name, AI mode indicator, version
- **Message area** — scrollable command output and AI responses
- **Input bar** — green `>` prompt (blue `AI>` in AI mode)

### AI Mode + Knowledge
- `/ai` toggles continuous AI chat mode
- `/ai <question>` for one-off queries
- GLM API with automatic model fallback on rate limits
- Knowledge system: ADM docs cached and injected as AI context
- Friendly error messages on API failures

### 6 Themes
dark (default), light, cyberpunk, nord, forest, monokai — switch with `/theme <name>`

### GitHub & GitLab Integration
- `/github` — PR listing, creation, commenting, issues
- `/gitlab` — MR listing, creation, commenting, issues
- Secure token storage (OS keychain on macOS, encrypted file on Linux)

### Extension Setup Wizard
`/download` launches an interactive wizard that installs:
- Node.js (via nvm wrapper)
- Package managers (pnpm, npm)
- Build tools (Vite, esbuild)
- System packages (git, gh CLI)
- SSH keys (ED25519)
- Git config (user.name, user.email)
- Dotfiles sync from repo

### Feedback
`/feedback` opens the feedback page in your default browser.

### Plugin System
Drop `.js` files in `~/.adm/plugins/` — each exports `{ execute(args, context) }` to add custom commands.

### Dotfiles Sync
`/dotfiles sync` — clone/sync dotfiles from a git repo, apply symlinks or copies for `.bashrc`, `.zshrc`, `.gitconfig`, `.ssh/config`.

---

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run TUI locally
npm start

# Run specific test suite
npx jest tests/unit/tui/ --no-coverage

# Link globally for development
npm link
```

### Test Structure
- `tests/unit/` — Unit tests
- `tests/integration/` — Integration tests
- `tests/e2e/` — End-to-end smoke tests

---

## License

MIT — see [LICENSE](./LICENSE).
