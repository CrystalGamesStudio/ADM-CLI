# Plan: ADM CLI — Issue #9 Implementation

> Source PRD: [plans/prd-v3.md](./prd-v3.md) — "ADM CLI v3 — Issue #9 Fixes PRD"

## Architectural decisions

Durable decisions that apply across all slices:

- **Architecture style**: Single ink v5 + React 18 TUI app. No CLI subcommands — only `adm` launches full-screen terminal UI.
- **Data model**: Config at `~/.adm/config.json` (JSON). AI knowledge cache at `~/.adm/ai-knowledge.json`. Extension catalog in `src/data/extensions.json`.
- **Key entities**: Command (name, description, handler, aliases, subcommands), AI Provider (id, name, apiKey, models), Extension Tool (id, name, category, installMethod), Message (id, text, type, timestamp)
- **Command dispatch**: Unified registry — `dispatch(input, context) → { output, shouldExit }`. All commands via `/` prefix.
- **AI provider abstraction**: `query(prompt, options) → Promise<string>`. Providers plug in behind this interface.
- **Theme system**: Existing 6 themes — colors consumed via ink `<Text color>` props.
- **Removed commands**: /plugins, /config. Consolidated: /status, /pr, /issue, /commit → /github.

---

## Slice 1: "Cleanup" — Remove Dead Commands

**User stories**: US-2, US-4

### What to build

Remove `/plugins` and `/config` commands from the TUI registry. These serve no useful purpose. Keep the plugin fallback mechanism (it handles `/<plugin-name>` execution).

### Files to change

- `src/tui/commands/registry.js`:
  - Remove `plugins` and `config` from `BUILTIN_COMMANDS` array (line 11, 24)
  - Remove `dispatchConfig` function (lines 170-177)
  - Remove `dispatchPlugins` function (lines 680-693)
  - Remove the `if (cmdName === 'plugins')` and `if (cmdName === 'config')` dispatch branches (lines 73-75, 112-114)

### Acceptance criteria

- [ ] `/help` output does not contain `plugins` or `config`
- [ ] `/plugins` returns "Unknown command" with suggestion
- [ ] `/config` returns "Unknown command" with suggestion
- [ ] Plugin fallback (`/<plugin-name>`) still works — `dispatchPlugin` function untouched

---

## Slice 2: "Fix Clock" — Colon Visibility + Theme Gray Screen

**User stories**: US-6, US-7

### What to build

Two clock fixes:
1. Make colon separators visible by rendering them in muted color instead of accent
2. Fix `/clock theme` gray screen by adding alternate screen buffer

### Files to change

- `src/commands/clock.js`:
  - In the initial draw loop (lines 54-61), detect colon glyphs (g === 2 or g === 5) and use `mc` (muted color) instead of `ac` (accent color)
  - In the tick update loop (lines 86-96), same: use `mc` for colon positions (g === 2, g === 5)

- `src/commands/clock-theme.js`:
  - Add `\x1B[?1049h` at start of `clockThemePicker` (before `draw()`) to enter alternate screen buffer
  - Add `\x1B[?1049l` in cleanup and resolve paths to exit alternate screen buffer

### Acceptance criteria

- [ ] `/clock` renders with visible `:` between hours, minutes, seconds (muted color, distinct from digits)
- [ ] `/clock theme` shows color picker with live clock preview, no gray screen
- [ ] `/clock theme` cleanup returns to TUI without artifacts

---

## Slice 3: "Page It" — Setup Summary Pagination

**User stories**: US-1

### What to build

Fix the setup summary step so that left/right arrow keys paginate through installation results. The bug is that `allItems` (used for navigation) is empty in summary mode — pagination needs to use `installResults` instead.

### Files to change

- `src/tui/components/SetupScreen.js`:
  - In the `allItems` computation (lines 112-116), add summary step: `s.step === 'summary' ? (s.installResults || []) : []`
  - The existing `useInput` left/right handlers (lines 146-161) already use `totalPages` from `allItems`, so fixing `allItems` fixes pagination
  - Ensure cursor clamping (lines 123-125) works with result items

### Acceptance criteria

- [ ] After setup with 15+ tools, summary shows first 10 results
- [ ] Right arrow (`→`) paginates to next page of results
- [ ] Left arrow (`←`) paginates back
- [ ] Page indicator `[2/3] ←→ = more results` updates correctly

---

## Slice 4: "Model Interactive" — /model with Inline API Key Input

**User stories**: US-3

### What to build

When `/model <provider>` is called for a provider that requires auth and has no stored key, enter an inline token input mode (matching the existing `/connect` token flow). If the provider is already configured, just activate it.

### Files to change

- `src/tui/commands/registry.js`:
  - Modify `dispatchModel` to check if provider requires auth AND has no stored key in config
  - If key needed: return `{ shouldPromptModelToken: true, modelProvider: args }`
  - If already configured: activate immediately as before
  - After token is saved: auto-set `config.aiProvider = args`

- `src/tui/app-state.js`:
  - Add `modelStep` state (`null` | `'token'`)
  - Add `modelProvider` state (which provider is being configured)
  - Add `submitModelToken(token)` function that saves key to config and activates provider
  - Process `shouldPromptModelToken` flag in `processInput`

- `src/tui/app.js`:
  - Add `modelStep === 'token'` input handling in `useInput` (same pattern as connect token, lines 101-126)
  - Add `modelStep === 'token'` rendering in input bar (show `API Key: ` label, masked input)

### Acceptance criteria

- [ ] `/model groq` with no prior key → shows `API Key: ` input prompt
- [ ] Enter API key → saves to config, activates provider, shows confirmation
- [ ] `/model groq` with existing key → immediately activates, no prompt
- [ ] `/model glm-free` → activates immediately (no auth required)
- [ ] Esc cancels token input, returns to normal mode

---

## Slice 5: "GitHub Hub" — Unified /github Command

**User stories**: US-5

### What to build

Create `/github` command that:
- Without args: shows interactive list (status, PRs, issues, commits) with arrow key selection
- With args: routes to existing dispatch functions as subcommands

Remove `/status`, `/pr`, `/issue`, `/commit` from BUILTIN_COMMANDS (keep dispatch functions internally).

### Files to change

- `src/tui/commands/registry.js`:
  - Add `github` to `BUILTIN_COMMANDS` with `subcommands: ['status', 'pr', 'issue', 'commit']`
  - Remove `status`, `pr`, `issue`, `commit` from `BUILTIN_COMMANDS`
  - Add `dispatchGithub` function:
    - No args → return `{ shouldShowGithubMenu: true }`
    - `status` → call existing `dispatchStatus`
    - `pr <sub>` → call existing `dispatchPr`
    - `issue <sub>` → call existing `dispatchIssue`
    - `commit <sub>` → call existing `dispatchCommit`
  - Add `github` dispatch branch in main `dispatch` function
  - Keep `dispatchStatus`, `dispatchPr`, `dispatchIssue`, `dispatchCommit` as internal functions (not registered as top-level commands)

- `src/tui/app-state.js`:
  - Add `githubStep` state (`null` | `'menu'`)
  - Add `githubCursor` state (0-3 for menu items)
  - Process `shouldShowGithubMenu` flag
  - Add `selectGithubItem()` function that triggers the selected action

- `src/tui/app.js`:
  - Add `githubStep === 'menu'` input handling (up/down, enter, esc)
  - Add `githubStep === 'menu'` rendering (interactive list with 4 options)

### Acceptance criteria

- [ ] `/github` shows interactive list: status, PRs, issues, commits
- [ ] Arrow keys navigate, Enter selects, Esc cancels
- [ ] `/github status` shows git status directly
- [ ] `/github pr list` shows PRs directly
- [ ] `/github issue list` shows issues directly
- [ ] `/github commit suggest` suggests commit message
- [ ] `/status`, `/pr`, `/issue`, `/commit` return "Unknown command" (suggest `/github`)
- [ ] `/help` shows `/github` but not the removed commands

---

## Slice 6: "Hint Me" — Subcommand Placeholder Hints

**User stories**: US-8

### What to build

Add inline placeholder text in the input bar showing available subcommands after a command is typed. E.g. typing `/github ` shows `<status, pr, issue, commit>` as dimmed text after cursor.

### Files to change

- `src/tui/commands/registry.js`:
  - Add `subcommands` arrays to relevant command entries in `BUILTIN_COMMANDS`:
    - `github`: `['status', 'pr', 'issue', 'commit']`
    - `model`: `['<provider-id>']`
    - `connect`: `['github', 'gitlab', 'list', 'disconnect']`
    - `clock`: `['theme']`
    - `mr`: `['list', 'draft', 'comment']`
    - `dotfiles`: `['sync']`
  - Add `getSubcommands(cmdName)` function to registry return

- `src/tui/app.js`:
  - In the input bar rendering section, detect when input matches `/command ` pattern
  - Look up subcommands for that command
  - Render dimmed placeholder text after cursor: `<sub1, sub2, sub3>`

### Acceptance criteria

- [ ] Type `/github ` → see dimmed `<status, pr, issue, commit>` after cursor
- [ ] Type `/connect ` → see dimmed `<github, gitlab, list, disconnect>` after cursor
- [ ] Type `/clock ` → see dimmed `<theme>` after cursor
- [ ] Type `/help ` → no placeholder (no subcommands)
- [ ] Placeholder disappears when typing actual subcommand text

---

## Cross-cutting: Verification

**After all slices are complete:**

- [ ] `/help` shows updated command list (no plugins, config, status, pr, issue, commit; has github)
- [ ] All 6 themes render correctly
- [ ] Fresh `node bin/adm-tui` works
- [ ] `/ai` mode still works alongside all changes
- [ ] `/setup` flow works end-to-end with pagination
