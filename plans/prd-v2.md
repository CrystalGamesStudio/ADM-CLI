# ADM CLI v2 — Product Requirements Document (Blueprint)

## Context

ADM CLI v1 was a phased project with commander.js-based CLI and readline REPL. The rebuild (v2) replaces this with a single full-screen TUI (ink + React) that unifies all interaction. The goal: one command (`adm`) opens an OpenCode-like interface where everything happens — AI chat, setup, GitHub/GitLab management, tool installation, and configuration.

---

## Problem Statement

### Current State (v1)
- Two separate interfaces: CLI subcommands (`adm setup`, `adm pr list`) and readline REPL (`adm` → `ai <q>`)
- commander.js adds complexity with no benefit — user must remember two syntaxes
- readline REPL is limited — no colors in input, no scrollable history, no proper layout
- Extension catalog is small (5-6 tools) with no categorization
- AI backend is hardcoded to GLM with no provider switching
- AI has no knowledge about ADM itself

### Desired State (v2)
- **One entry point**: `adm` → full-screen TUI, period
- **Unified command system**: everything through `/` prefix in the TUI input
- **AI mode toggle**: `/ai` activates blue input for continuous AI conversation
- **Massive extension catalog**: 200+ tools in 10 categories with multi-step setup
- **Multi-provider AI**: GLM (free default) + OpenAI/Claude/Ollama configurable via `/model`
- **AI with knowledge**: learns ADM docs on first run, caches for subsequent runs

---

## Architectural Decisions

### AD-1: ink v5 + React 18 as TUI Framework
- **Decision**: Use ink (React for CLI) v5 with React 18
- **Rationale**: Full-screen layout, component model, JSX, flexbox — same approach as Claude Code's terminal UI
- **Consequence**: Removes commander.js, inquirer, and readline dependencies. All UI is React components.

### AD-2: Single Entry Point — `adm`
- **Decision**: Only `adm` (no subcommands). No `adm setup`, no `adm pr list`.
- **Rationale**: Eliminates dual-mode confusion. Everything happens inside the TUI.
- **Consequence**: bin/adm becomes a simple ink bootstrapper (~10 lines).

### AD-3: Unified Command Registry with `/` Prefix
- **Decision**: All commands accessed via `/command` in TUI input. Merged former CLI and REPL commands into one registry.
- **Rationale**: One mental model for the user. Tab completion on `/` shows all commands.
- **Consequence**: New module `src/tui/commands/registry.js` replaces both bin/adm commander routes and src/repl/shell.js dispatch.

### AD-4: AI Mode Toggle (not auto-detect)
- **Decision**: `/ai` explicitly toggles AI mode. Input turns blue. `/exit` or `Esc` exits.
- **Rationale**: Explicit toggle prevents accidental AI queries. Blue color gives clear visual feedback.
- **Consequence**: InputBar component needs two rendering modes (normal + AI).

### AD-5: Multi-Provider AI Backend
- **Decision**: Pluggable provider system with `/model` configuration command.
- **Rationale**: Users want choice. Free GLM as default lowers barrier to entry.
- **Providers**: GLM (free, no key), GLM (with key, better), OpenAI, Anthropic, Ollama (local)

### AD-6: AI Knowledge System — Learn Once, Cache
- **Decision**: On first run, AI reads ADM documentation (README, PRD, command list) and caches a compact knowledge base in `~/.adm/ai-knowledge.json`.
- **Rationale**: Full docs in system prompt wastes tokens. Cached summary is cheaper and sufficient.
- **Consequence**: New module `src/integrations/ai-knowledge.js` handles learning + caching.

### AD-7: Extension Catalog in JSON
- **Decision**: `src/data/extensions.json` contains all 200+ tools organized by category.
- **Rationale**: Easy to edit, version, and extend. No database needed.
- **Consequence**: Each tool entry has: name, description, category, installMethod, installCommand.

### AD-8: Auto-Detect Installer
- **Decision**: Each tool specifies its installer type (npm, brew, apt, pip, cargo, go, gem, composer, etc.). ADM auto-detects the right command.
- **Rationale**: 200+ tools can't each have custom scripts. Convention over configuration.
- **Consequence**: Installer module maps `installMethod` → shell command.

---

## Deep Modules

### Module 1: TUI App Shell (`src/tui/app.js`)
**Interface**: `render()` → full-screen TUI with input, messages, status bar
**Encapsulates**: Entire rendering lifecycle, screen routing, theme application, input handling
**Dependencies**: ink, React, all other modules

### Module 2: Command Registry (`src/tui/commands/registry.js`)
**Interface**: `dispatch(input: string, context: object) → { output: string, shouldExit: boolean }`
**Encapsulates**: All command definitions, routing, validation, help generation
**Deep because**: 20+ commands behind one narrow interface. Adding a command = one entry in the map.

### Module 3: AI Provider System (`src/integrations/ai-provider.js`)
**Interface**: `query(prompt: string, options?: object) → Promise<string>`
**Encapsulates**: Provider selection, API calls, model fallback, error handling, rate limiting
**Deep because**: Multiple providers with different APIs behind one `query()` call.

### Module 4: AI Knowledge (`src/integrations/ai-knowledge.js`)
**Interface**: `learn() → void` (runs once), `getKnowledge() → string` (returns cached summary)
**Encapsulates**: File reading, summarization, caching, cache invalidation
**Deep because**: Complex learning pipeline behind two simple functions.

### Module 5: Extension Installer (`src/installer/auto-detect.js`)
**Interface**: `install(tools: string[]) → Promise<InstallResult[]>`
**Encapsulates**: Package manager detection, install command generation, execution, error handling
**Deep because**: Platform-specific logic for 10+ install methods behind one call.

---

## Component Tree (ink/React)

```
<App>
  <StatusBar />          ← theme name, AI mode indicator, provider
  <MessageList>          ← scrollable output area
    <Message />          ← individual command output or AI response
    <Message />
  </MessageList>
  <InputBar />           ← text input with / autocomplete
</App>
```

### Setup Screen (overlay/replaces main)
```
<SetupScreen>
  <StepIndicator />      ← shows current step (1/4, 2/4...)
  <CategorySelect />     ← multi-select of categories
  <ToolSelect />         ← checkboxes for tools in category
  <InstallProgress />    ← spinner + progress for each tool
</SetupScreen>
```

---

## Command Reference (Unified Registry)

### Core Commands
| Command | Description | Former Location |
|---|---|---|
| `/help` | Show all commands with descriptions | REPL help |
| `/exit` | Exit ADM TUI | REPL exit |
| `/clear` | Clear message history | NEW |

### Setup & Config
| Command | Description | Former Location |
|---|---|---|
| `/setup` | Launch setup wizard (categories → tools → install) | CLI `adm setup` |
| `/model` | Configure AI provider (GLM/OpenAI/Claude/Ollama) | NEW |
| `/theme` | Change color theme | CLI `adm theme` |
| `/config` | Show/edit current configuration | NEW |

### AI
| Command | Description | Former Location |
|---|---|---|
| `/ai` | Toggle AI mode (input turns blue) | REPL `ai` |
| `/ai <question>` | Ask one-off AI question without toggling mode | REPL `ai <q>` |

### Git Integration
| Command | Description | Former Location |
|---|---|---|
| `/connect` | Connect GitHub/GitLab account | CLI `adm connect` |
| `/pr list` | List open pull requests | CLI + REPL |
| `/pr draft <title>` | Create draft PR | CLI + REPL |
| `/pr comment <id> <msg>` | Comment on PR | CLI |
| `/mr list` | List open merge requests | CLI |
| `/mr draft <title>` | Create draft MR | CLI |
| `/mr comment <id> <msg>` | Comment on MR | CLI |
| `/issue list` | List issues | CLI |
| `/commit suggest` | Suggest commit message | REPL |
| `/status` | Show git status, PRs, issues | REPL |

### Utilities
| Command | Description | Former Location |
|---|---|---|
| `/clock` | Show ASCII clock | CLI |
| `/clock theme` | Change clock color | CLI |
| `/dotfiles sync` | Sync dotfiles from repo | CLI |
| `/open <repo>` | Clone/open repo | REPL |
| `/app launch <name>` | Launch application | REPL |
| `/uninstall` | Remove ADM | CLI |

### Plugins
| Command | Description | Former Location |
|---|---|---|
| `/plugins` | List loaded plugins | NEW |
| `/<plugin-name>` | Execute plugin command | CLI fallback |

---

## Extension Catalog Structure

`src/data/extensions.json`:
```json
{
  "categories": [
    {
      "id": "javascript",
      "name": "JavaScript / TypeScript",
      "icon": "🟨",
      "tools": [
        { "id": "node", "name": "Node.js", "installMethod": "nvm", "description": "JavaScript runtime" },
        { "id": "pnpm", "name": "pnpm", "installMethod": "npm", "description": "Fast package manager" }
      ]
    }
  ]
}
```

**Install methods**: `nvm`, `npm`, `brew`, `apt`, `pip`, `pipx`, `cargo`, `go`, `gem`, `composer`, `dotnet`, `script`, `manual`

---

## User Stories

### US-1: Launch ADM TUI
**As a** developer  
**I want to** type `adm` and see a full-screen terminal interface  
**So that** I have a unified place for all my dev tools

**Acceptance Criteria:**
1. `adm` launches full-screen TUI with ink
2. StatusBar shows theme, AI mode status, provider
3. Input bar at bottom with blinking cursor
4. Message area shows welcome text + help hint
5. `Ctrl+C` or `/exit` cleanly exits

### US-2: Unified Command Input
**As a** developer  
**I want to** type `/` followed by a command name and see autocomplete  
**So that** I don't need to remember exact syntax

**Acceptance Criteria:**
1. Typing `/` shows autocomplete dropdown with all commands
2. Tab completes the command
3. `/help` lists all commands with descriptions
4. Unknown `/command` shows error with suggestion
5. Commands without `/` prefix in normal mode show hint

### US-3: AI Mode Toggle
**As a** developer  
**I want to** toggle AI conversation mode with `/ai`  
**So that** I can have continuous chat without prefixing every message

**Acceptance Criteria:**
1. `/ai` turns input blue and shows "AI mode ON" in status
2. In AI mode, any text goes directly to AI
3. `/exit` or `Esc` turns input back to normal color
4. `/ai <question>` works as one-off without toggling mode
5. AI responses appear in message area with provider name

### US-4: Multi-Provider AI
**As a** developer  
**I want to** switch AI providers via `/model`  
**So that** I can use my preferred API or run local models

**Acceptance Criteria:**
1. `/model` shows list of providers (GLM free, GLM with key, OpenAI, Claude, Ollama)
2. Free GLM works without API key
3. Other providers prompt for API key on selection
4. Selected provider persists in config
5. Fallback to GLM free if selected provider fails

### US-5: AI Knowledge About ADM
**As a** developer  
**I want to** ask AI "how do I install pnpm?" and get an ADM-specific answer  
**So that** AI acts as an ADM expert, not a generic chatbot

**Acceptance Criteria:**
1. First run: AI reads README + PRD + command list, caches summary
2. Subsequent runs: cached knowledge injected into AI context
3. AI answers ADM-specific questions accurately
4. Cache updates when ADM version changes

### US-6: Extension Setup Wizard
**As a** developer  
**I want to** run `/setup` and pick tools from organized categories  
**So that** I can install my entire dev stack in one go

**Acceptance Criteria:**
1. `/setup` shows category list (10 categories with icons)
2. Selecting a category shows tools with checkboxes
3. Selected tools are installed sequentially with progress
4. Auto-detects correct installer per tool (npm/brew/pip/cargo/etc.)
5. Skips already-installed tools with "already installed" message

### US-7: GitHub/GitLab Integration
**As a** developer  
**I want to** manage PRs and issues from the TUI  
**So that** I don't need to leave my terminal

**Acceptance Criteria:**
1. `/connect github` stores token securely
2. `/pr list` shows open PRs in message area
3. `/pr draft <title>` creates draft PR
4. `/status` shows git status + PRs + issues summary

---

## Validation Strategy

| User Story | Verification Method |
|---|---|
| US-1 Launch TUI | Manual: run `adm`, verify full-screen render, `/exit` works |
| US-2 Unified Commands | E2E test: type `/help`, verify output; type `/unknown`, verify error |
| US-3 AI Mode Toggle | Manual: `/ai` → blue input → type → AI response → `Esc` → normal |
| US-4 Multi-Provider | Unit test: mock providers, verify switching; manual: `/model` flow |
| US-5 AI Knowledge | Unit test: verify learn() creates cache; manual: ask "how to setup node" |
| US-6 Extension Setup | E2E: mock installer, verify category→tool→install flow |
| US-7 Git Integration | Integration test: mock GitHub API, verify /pr list output |

---

## Assumptions

1. **ink v5 + React 18** are compatible and stable for full-screen TUI
2. **Target terminals** support ANSI escape codes (all modern terminals do)
3. **Network available** for AI queries and tool installation
4. **Node.js v18+** is installed (ADM is a Node.js app)
5. **macOS/Linux only** — no Windows support in v2
6. **Free GLM API** remains available without authentication
7. **Users prefer explicit AI toggle** over auto-detection
8. **Extension catalog** grows incrementally — community can submit PRs to JSON

---

## Tradeoffs Considered

| Alternative | Rejected Reason |
|---|---|
| ink v7 + React 19 | React 19 breaks compatibility with existing deps; v5 is stable |
| Auto-detect AI mode | Ambiguous — short commands like "ls" could trigger AI accidentally |
| Remote extension registry | Requires server infrastructure; JSON in repo is simpler for MVP |
| Custom scripts per tool | 200+ tools × maintenance burden; auto-detect scales better |
| Keep commander.js for CLI args | User explicitly wants only `adm` — no subcommands |
| Blessed/neo-blessed | Lower-level, harder to maintain complex UI; ink's React model is more productive |

---

## File Structure (v2)

```
src/
├── tui/                          ← NEW: ink React app
│   ├── app.js                    ← Main App component
│   ├── components/
│   │   ├── InputBar.js           ← Input with / autocomplete + AI mode
│   │   ├── MessageList.js        ← Scrollable output area
│   │   ├── Message.js            ← Single message/output block
│   │   ├── StatusBar.js          ← Theme, AI mode, provider
│   │   ├── SetupScreen.js        ← Multi-step setup wizard
│   │   └── Autocomplete.js       ← Command autocomplete dropdown
│   └── commands/
│       ├── registry.js           ← Unified command registry
│       ├── help.js               ← /help command
│       ├── setup.js              ← /setup command
│       ├── ai.js                 ← /ai command + AI mode
│       ├── model.js              ← /model command
│       ├── connect.js            ← /connect command
│       ├── pr.js                 ← /pr subcommands
│       ├── mr.js                 ← /mr subcommands
│       ├── issue.js              ← /issue subcommands
│       ├── status.js             ← /status command
│       ├── commit.js             ← /commit subcommands
│       ├── clock.js              ← /clock command
│       ├── theme.js              ← /theme command
│       ├── dotfiles.js           ← /dotfiles command
│       ├── config.js             ← /config command
│       └── plugins.js            ← /plugins command
├── integrations/
│   ├── ai-provider.js            ← NEW: Multi-provider AI system
│   ├── ai-knowledge.js           ← NEW: Learn + cache knowledge
│   └── ai-backend.js             ← KEEP: GLM provider (refactored)
├── installer/
│   ├── auto-detect.js            ← NEW: Auto-detect install method
│   ├── node-installer.js         ← KEEP
│   ├── package-manager-installer.js ← KEEP
│   ├── system-packages.js        ← KEEP
│   ├── git-config.js             ← KEEP
│   └── ssh-setup.js              ← KEEP
├── data/
│   └── extensions.json           ← NEW: 200+ tools catalog
├── config/                       ← KEEP as-is
├── plugins/                      ← KEEP, adapt for TUI
├── utils/                        ← KEEP as-is
└── ui/theme/                     ← KEEP, adapt for ink
```

**Files to DELETE:**
- `bin/adm` (rewrite completely)
- `src/repl/shell.js` (replaced by registry)
- `src/repl/commands/` (replaced by src/tui/commands/)
- `src/commands/assistant.js` (replaced by TUI app)
- `src/setup/wizard.js` (replaced by SetupScreen component)

---

## Implementation Phases

### Phase 1: TUI Shell + Command Registry (Foundation)
- Install ink v5 + React 18
- Create bin/adm (simple ink bootstrapper)
- Build App, InputBar, MessageList, StatusBar components
- Build unified command registry
- Migrate /help, /exit, /clear, /status, /clock, /theme
- **Validation**: `adm` opens TUI, basic commands work

### Phase 2: AI System
- Build multi-provider AI system (ai-provider.js)
- Implement GLM free provider (no key)
- Implement GLM/OpenAI/Claude/Ollama with key
- Build AI knowledge system (learn + cache)
- Build /ai command with blue input toggle
- Build /model configuration command
- **Validation**: `/ai` toggles mode, AI responds, `/model` switches providers

### Phase 3: Extension Catalog + Setup
- Create extensions.json with all 200+ tools
- Build auto-detect installer
- Build SetupScreen ink component (category → tools → progress)
- Wire /setup command
- **Validation**: `/setup` shows categories, selects tools, installs them

### Phase 4: Git Integration Migration
- Migrate /connect, /pr, /mr, /issue to TUI commands
- Migrate /commit, /open, /app to TUI commands
- Migrate /dotfiles, /uninstall to TUI commands
- **Validation**: All Git commands work in TUI

### Phase 5: Polish + Documentation
- Update README.md
- Update plans/prd.md
- Update shell completion scripts
- Plugin system adaptation for TUI
- **Validation**: Fresh install works end-to-end

---

## Integration Proposals (Future Consideration)

These are NOT in scope for v2 but worth considering for v3+:

1. **File Watcher + Hot Reload** — Monitor project files, auto-restart dev server on changes. Would integrate with `/watch` command.

2. **Env/Secrets Manager** — Per-project .env management, integration with 1Password/Vault. Would add `/secrets` command.

3. **Dev Stats Dashboard** — Commit frequency, PR turnaround, language breakdown. Would add `/stats` command with visual charts.

4. **File Explorer / Fuzzy Finder** — Terminal-based file browser like fzf but integrated. Would add `/find` command.

5. **Snippet System** — Save and recall code snippets from TUI. `/snippets save`, `/snippets list`, `/snippets run <name>`.

6. **Team Sync** — Share ADM config across team via GitHub Gist. `/team push`, `/team pull`.

7. **Terminal Multiplexer** — Built-in tmux-like tabs/splits for running multiple tools. `/tab new`, `/tab split`.

8. **Changelog Generator** — Auto-generate changelogs from git history + conventional commits. `/changelog`.
