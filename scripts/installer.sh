#!/usr/bin/env bash
set -euo pipefail

# ── ADM CLI Installer ──────────────────────────────────────
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/CrystalGamesStudio/ADM-CLI/main/scripts/installer.sh | sh
#   bash scripts/installer.sh [--dry-run] [-y|--yes]
#

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
RESET='\033[0m'

# ── Parse args ──────────────────────────────────────────────
DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1; shift;;
    --help|-h)
      echo "Usage: bash installer.sh [--dry-run] [-y|--yes]"
      exit 0;;
  esac
done
if [ "${ADM_DRY_RUN:-}" = "1" ]; then DRY_RUN=1; fi

info()  { echo -e "${CYAN}  [INFO]${RESET} $*"; }
ok()    { echo -e "${GREEN}  [OK]${RESET} $*"; }
warn()  { echo -e "${YELLOW}  [WARN]${RESET} $*"; }
err()   { echo -e "${RED}  [ERROR]${RESET} $*"; }

main() {
  echo ""
  echo -e "${BOLD}  ADM CLI Installer${RESET}"
  echo ""

  # ── Check for Node.js ─────────────────────────────────────
  if ! command -v node >/dev/null 2>&1; then
    err "Node.js is required but not found."
    echo ""
    echo "  Install Node.js v18+ first:"
    echo "    macOS:  brew install node"
    echo "    Linux:  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs"
    echo "    Or visit: https://nodejs.org"
    exit 1
  fi

  # ── Check Node.js version >= 18 ───────────────────────────
  NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VERSION" -lt 18 ]; then
    err "Node.js 18+ required. Current: $(node -v)"
    exit 1
  fi

  info "Node.js $(node -v) detected"

  # ── Dry run ───────────────────────────────────────────────
  if [ "$DRY_RUN" = "1" ]; then
    echo -e "${YELLOW}  DRY RUN — no changes will be made${RESET}"
    echo ""
    echo "  Planned actions:"
    echo "    1. Run 'npm install -g @crystalgames/adm'"
    echo "    2. Verify 'adm --version'"
    exit 0
  fi

  # ── Check for npm ─────────────────────────────────────────
  if ! command -v npm >/dev/null 2>&1; then
    err "npm not found. It should come with Node.js."
    exit 1
  fi

  # ── Install globally ──────────────────────────────────────
  info "Installing @crystalgames/adm globally..."

  if [ "$(id -u)" = "0" ]; then
    npm install -g @crystalgames/adm
  elif [ -w "$(npm config get prefix)" ]; then
    npm install -g @crystalgames/adm
  else
    warn "npm global prefix is not writable. Using sudo..."
    sudo npm install -g @crystalgames/adm
  fi

  # ── Verify ────────────────────────────────────────────────
  if command -v adm >/dev/null 2>&1; then
    ok "ADM installed: $(adm --version 2>/dev/null || echo 'unknown version')"
  else
    warn "adm not found in PATH. Open a new terminal to use it."
  fi

  echo ""
  ok "Installation complete!"
  echo ""
  echo -e "  Run ${BOLD}adm${RESET} to launch the TUI."
  echo -e "  Run ${BOLD}adm setup${RESET} to configure your dev environment."
  echo ""
}

main "$@"
