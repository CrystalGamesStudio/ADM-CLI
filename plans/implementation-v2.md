# Plan: ADM CLI v2 — Full TUI Rebuild

> Source PRD: [plans/prd-v2.md](./prd-v2.md) — "ADM CLI v2 Blueprint"

## Architectural decisions

Durable decisions that apply across all slices:

- **Architecture style**: Single ink v5 + React 18 TUI app. No CLI subcommands — only `adm` launches full-screen terminal UI.
- **Data model**: Config at `~/.adm/config.json` (JSON). AI knowledge cache at `~/.adm/ai-knowledge.json`. Extension catalog in `src/data/extensions.json`.
- **Key entities**: Command (name, description, handler, aliases), AI Provider (id, name, apiKey, models), Extension Tool (id, name, category, installMethod), Message (id, text, type, timestamp)
- **Command dispatch**: Unified registry — `dispatch(input, context) → { output, shouldExit }`. All commands via `/` prefix. AI mode is a toggle, not auto-detect.
- **AI provider abstraction**: `query(prompt, options) → Promise<string>`. Providers plug in behind this interface.
- **Theme system**: Existing 6 themes (dark, light, cyberpunk, nord, forest, monokai) — colors consumed via ink `<Text color>` props instead of chalk hex.
- **Install method mapping**: Convention-based — each tool declares installMethod (npm/brew/apt/pip/cargo/go/gem/composer/dotnet/script/manual), installer maps to platform-specific shell command.
- **Platform**: macOS + Linux only. Bash/Zsh terminals.
- **Removed**: commander.js, inquirer (replaced by ink), readline REPL (replaced by ink input). bin/adm becomes a 10-line ink bootstrapper.

---

## Slice 1: "Hello ADM" — TUI Shell + Core Commands

**User stories**: US-1 (Launch TUI), US-2 (Unified Command Input)

### What to build

The foundation slice. User types `adm` → full-screen TUI appears with status bar at top, scrollable message area in middle, input bar at bottom. The input accepts `/`-prefixed commands with tab autocomplete. Typing `/help` shows all commands. `/exit` or `Ctrl+C` quits cleanly. Welcome message appears on launch. Theme colors from existing theme system apply to all ink components.

End-to-end: `adm` → ink render → theme resolve → input → command dispatch → message render.

### Assumptions carried in

- Existing theme system (`src/ui/theme/`, `src/utils/terminal-detection.js`) works — resolve theme colors, adapt to ink.
- Config system (`src/config/index.js`) works — read config, get theme preference.
- Node.js v18+ is installed and available.
- ink v5 + React 18 are compatible and stable.

### Out of scope for this phase

- AI commands (/ai, /model) — Slice 2
- Setup wizard (/setup, extension catalog) — Slice 4
- Git commands (/connect, /pr, /mr, /issue) — Slice 5
- Plugin system adaptation — Slice 5
- Any command beyond /help, /exit, /clear, /status, /config, /theme
- Scrollback buffer optimization / virtualization

### Acceptance criteria

- [ ] `node bin/adm` launches full-screen TUI with ink — renders status bar, message area, input bar — [test: `tests/unit/tui/app.test.js` renders without crash]
- [ ] StatusBar displays theme name, "AI: off", and "ADM v0.2.0" — [observable: visual render in terminal]
- [ ] Input bar accepts text input with visible cursor — [observable: type text, see it appear]
- [ ] `/help` command lists all registered commands with descriptions — [test: dispatch('/help') returns formatted command list]
- [ ] `/exit` command and `Ctrl+C` cleanly exit the TUI process (exit code 0) — [test: dispatch('/exit') returns `{ shouldExit: true }`]
- [ ] `/clear` clears message history — [test: messages array empties after dispatch('/clear')]
- [ ] `/theme` command lists available themes and switches active theme — [test: dispatch('/theme cyberpunk') updates theme in config]
- [ ] `/config` command shows current configuration as formatted JSON — [test: dispatch('/config') returns config object as string]
- [ ] `/status` shows git status for current directory — [test: mock git, verify output contains branch + status]
- [ ] Typing `/` shows autocomplete list of all command names — [observable: type `/` in input, see dropdown]
- [ ] Tab key completes partial command name — [test: autocomplete('hel') returns ['help']]
- [ ] Unknown `/command` shows error with nearest suggestion — [test: dispatch('/hlep') returns error suggesting '/help']
- [ ] Welcome message appears on launch with "Type /help for commands" — [observable: first message in message area]
- [ ] Existing 6 themes render correctly with ink color props — [observable: `/theme <name>` switches colors immediately]

---

## Slice 2: "Talk to Me" — AI Mode + GLM Provider + Knowledge

**User stories**: US-3 (AI Mode Toggle), US-5 (AI Knowledge About ADM)

### What to build

AI conversation mode. `/ai` toggles AI mode ON — input turns blue, status shows "AI: ON (GLM free)". Everything typed in AI mode goes directly to AI. `/exit` or `Esc` exits AI mode (input returns to normal). `/ai <question>` does a one-off query without toggling mode. AI responses appear in message area with provider label. AI knowledge system: on first run, reads ADM docs (README, PRD, command list) and caches compact summary in `~/.adm/ai-knowledge.json`. Subsequent runs inject cached knowledge into AI context. Cache updates when ADM version changes.

End-to-end: `/ai` → blue input → type question → GLM API call (with knowledge context) → response rendered in messages → `Esc` → normal input.

### Assumptions carried in

- TUI shell from Slice 1 works — input bar, message area, status bar render correctly.
- GLM API at `https://open.bigmodel.cn/api/paas/v4` is accessible.
- Free GLM models work without API key (or with embedded default key).
- Existing AI backend (`src/integrations/ai-backend.js`) query function works — extend, don't rewrite.

### Out of scope for this phase

- Multi-provider switching (/model, OpenAI, Claude, Ollama) — Slice 3
- AI streaming responses (show response token-by-token) — future polish
- AI conversation memory (multi-turn context beyond knowledge) — future

### Acceptance criteria

- [ ] `/ai` command toggles AI mode ON — input color changes to blue, status shows "AI: ON" — [test: state change verified in InputBar component]
- [ ] In AI mode, typing text and pressing Enter sends it to GLM API — [test: mock fetch, verify API call with correct body]
- [ ] AI response appears in message area prefixed with "GLM:" label — [test: message added to messages array with type 'ai-response']
- [ ] `/exit` or `Esc` exits AI mode — input returns to normal color, status shows "AI: off" — [test: state reverts, color changes back]
- [ ] `/ai <question>` sends one-off query without toggling mode — [test: dispatch('/ai what is adm') calls query, doesn't change aiMode state]
- [ ] First run: AI knowledge system reads README.md + PRD + command list, writes `~/.adm/ai-knowledge.json` — [observable: file exists after first `/ai` query, contains structured summary]
- [ ] Subsequent runs: cached knowledge injected into AI system context — [test: getKnowledge() returns cached string, verify it's in API call messages]
- [ ] Knowledge cache invalidates when ADM version changes — [test: cache has version field, mismatch triggers re-learn]
- [ ] AI query failure shows user-friendly error in message area — [test: mock API error, verify error message rendered]

---

## Slice 3: "Choose Your AI" — Multi-Provider System

**User stories**: US-4 (Multi-Provider AI)

### What to build

Provider switching. `/model` command shows interactive list of providers: GLM Free (default, no key), GLM Pro (with key), OpenAI, Anthropic Claude, Ollama (local). Selecting a non-free provider prompts for API key (stored in config). Selected provider persists across sessions. Fallback: if selected provider fails, automatically tries GLM Free.

End-to-end: `/model` → provider list → select → enter API key → config save → subsequent AI queries use new provider → fallback on failure.

### Assumptions carried in

- AI mode toggle from Slice 2 works.
- AI knowledge system from Slice 2 works (injected into any provider's context).
- Config system persists provider selection.
- Free GLM provider is always available as fallback.

### Out of scope for this phase

- Ollama process management (auto-start/stop) — future
- API key validation on entry (only validate on first query)
- Model selection within a provider (use provider's default model)

### Acceptance criteria

- [ ] `/model` command displays list of 5 providers — [test: dispatch('/model') returns formatted provider list]
- [ ] Selecting "GLM Free" sets active provider, no API key needed — [test: config.aiProvider = 'glm-free' after selection]
- [ ] Selecting "OpenAI" prompts for API key, stores in config — [test: config.ai.openaiKey set after input]
- [ ] Selecting "Anthropic Claude" prompts for API key, stores in config — [test: config.ai.anthropicKey set after input]
- [ ] Selecting "Ollama" prompts for base URL (default http://localhost:11434) — [test: config.ai.ollamaUrl set]
- [ ] Provider selection persists — `adm` restart uses same provider — [observable: config file has aiProvider field]
- [ ] AI queries use selected provider's API format — [test: mock OpenAI API, verify correct request format sent]
- [ ] If selected provider fails, falls back to GLM Free with warning message — [test: mock provider failure, verify GLM fallback attempted]
- [ ] `/model` with no arguments shows current provider — [test: dispatch('/model') includes "Current: GLM Free" in output]

---

## Slice 4: "Stack Builder" — Extension Catalog + Setup Wizard

**User stories**: US-6 (Extension Setup Wizard)

### What to build

Massive extension catalog (200+ tools in 10 categories) with multi-step setup wizard. `/setup` launches SetupScreen component that replaces main chat view. Step 1: show category list with icons (🟨 JS/TS, 🐍 Python, 🔵 Go, 🦀 Rust, ☕ Java, 🟣 C#/.NET, 💎 Ruby, 🐘 PHP, ⚙️ C/C++, 🌐 Universal). Step 2: user selects categories. Step 3: for each selected category, show tools with checkboxes. Step 4: install selected tools with progress indicators. Each tool's `installMethod` maps to a platform-specific command via auto-detect installer. Already-installed tools are skipped with a message.

End-to-end: `/setup` → category selection → tool selection → auto-detect install commands → execute with progress → summary.

### Assumptions carried in

- TUI shell from Slice 1 renders components correctly.
- Config system reads/writes installed tools list.
- Platform detection (macOS/Linux) works from existing code.
- Existing installer modules (node-installer, package-manager-installer, system-packages) can be reused/extended.

### Out of scope for this phase

- Tool version selection (install latest only)
- Tool update/uninstall through setup wizard
- Custom tool sources (only tools in extensions.json)
- Dependency resolution between tools (e.g., node required before pnpm)
- Parallel installation (sequential only)

### Acceptance criteria

- [ ] `/setup` command replaces main view with SetupScreen component — [observable: screen changes from chat to wizard]
- [ ] Step 1 shows 10 categories with icons and names — [test: SetupScreen renders 10 category items]
- [ ] User can select/deselect categories — [test: state tracks selected category IDs]
- [ ] Step 2 shows tools for selected categories with checkboxes — [test: tool list populated from extensions.json for selected categories]
- [ ] User can select/deselect individual tools — [test: state tracks selected tool IDs]
- [ ] Step 3 installs selected tools sequentially, showing progress per tool — [test: mock execa, verify install commands called in sequence]
- [ ] Auto-detect installer maps installMethod to correct shell command per platform — [test: verify 'npm' → 'npm install -g', 'brew' → 'brew install', 'pip' → 'pip install', etc.]
- [ ] Already-installed tools are detected and skipped with message — [test: mock `which <tool>` returning 0, verify skip message]
- [ ] Setup completes with summary: "Installed X, Skipped Y, Failed Z" — [observable: final message shows counts]
- [ ] `/setup --dry-run` shows planned actions without executing — [test: no shell commands executed, plan displayed]
- [ ] extensions.json contains all 10 categories with 200+ tools — [observable: `cat src/data/extensions.json | jq '.categories | length'` returns 10]
- [ ] Pressing `Esc` during setup returns to main TUI view — [test: SetupScreen unmounts, App re-renders]

---

## Slice 5: "Git Hub" — Git Integration + All Remaining Commands + Plugin Adaptation

**User stories**: US-7 (GitHub/GitLab Integration) + all remaining command migrations

### What to build

Migrate all remaining commands to TUI: `/connect github|gitlab`, `/pr list|draft|comment`, `/mr list|draft|comment`, `/issue list`, `/commit suggest`, `/open <repo>`, `/app launch <name>`, `/clock`, `/clock theme`, `/dotfiles sync`, `/uninstall`, `/plugins`. Adapt plugin system for TUI — plugins register as commands in the registry, accessible via `/<plugin-name>`. Clean up old REPL and CLI command files. Update shell completion scripts for new command structure.

End-to-end: each command renders output in message area, interactive flows (connect, clock theme) use inline TUI prompts.

### Assumptions carried in

- Command registry from Slice 1 dispatches commands correctly.
- AI mode from Slice 2 works alongside regular commands.
- GitHub/GitLab API clients (`src/commands/pr.js`, `src/commands/mr.js`, `src/commands/connect.js`) work — adapt output format for TUI.
- Plugin loader (`src/plugins/loader.js`) discovers plugins — adapt execution context for TUI.
- Token storage (keychain/encrypted file) works from existing code.

### Out of scope for this phase

- New GitHub/GitLab features beyond what v1 had
- Real-time PR/issue notifications
- VS Code extension
- Shell completion for fish shell (bash/zsh only)
- Web dashboard

### Acceptance criteria

- [ ] `/connect github` prompts for PAT token, stores securely — [test: mock readline input, verify token stored in keychain]
- [ ] `/connect gitlab` prompts for access token, stores securely — [test: same as github]
- [ ] `/pr list` shows open PRs in message area with formatted table — [test: mock Octokit, verify PR data rendered]
- [ ] `/pr draft <title>` creates draft PR from current branch — [test: mock Octokit, verify createDraft called]
- [ ] `/pr comment <id> <msg>` comments on PR — [test: mock Octokit, verify comment created]
- [ ] `/mr list`, `/mr draft`, `/mr comment` work similarly for GitLab — [test: mock GitBeaker]
- [ ] `/issue list` shows issues from connected platform — [test: mock API, verify output]
- [ ] `/commit suggest` suggests commit message from staged changes — [test: mock git diff --cached, verify suggestion]
- [ ] `/clock` shows ASCII clock in message area — [test: verify clock output rendered]
- [ ] `/dotfiles sync` clones/pulls dotfiles repo and symlinks — [test: mock git clone, verify symlink created]
- [ ] `/uninstall` removes ADM config after confirmation — [test: mock prompts, verify config deleted]
- [ ] `/plugins` lists loaded plugins — [test: verify plugin list rendered from loader output]
- [ ] `/<plugin-name>` executes plugin, output appears in message area — [test: mock plugin, verify execute called with TUI context]
- [ ] Old REPL files (`src/repl/`) deleted — [observable: `ls src/repl/` returns nothing]
- [ ] Old CLI command files (`src/commands/`) deleted or merged — [observable: no commander.js imports remain]
- [ ] Shell completion scripts updated for `/` prefix commands — [observable: `cat scripts/completion/adm.bash` contains /help /ai /setup etc.]
- [ ] All commands show in `/help` output — [test: dispatch('/help') output contains all command names]

---

## Cross-cutting: Cleanup + Documentation

**Runs after all slices are complete.**

- [ ] Update `README.md` to reflect v2 architecture (single `adm` command, TUI, /prefix commands)
- [ ] Update `plans/prd.md` to match v2 scope
- [ ] Remove commander.js from package.json dependencies
- [ ] Remove inquirer from package.json dependencies (replaced by ink)
- [ ] Verify `npm test` passes with updated tests
- [ ] Verify fresh `npm install && node bin/adm` works
- [ ] Verify all 6 themes render correctly in TUI
