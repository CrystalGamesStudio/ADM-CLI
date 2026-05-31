#!/usr/bin/env bash
set -euo pipefail

# ── ADM CLI Installer ──────────────────────────────────────
#
# Usage:
#   curl -fsSL https://adm.sh/install | sh
#   bash scripts/installer.sh [--dry-run]
#

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
RESET='\033[0m'

ADM_VERSION="0.1.0"
INSTALL_DIR="/usr/local/bin"
ADM_BIN="${INSTALL_DIR}/adm"
REPO_URL="https://github.com/your-org/adm"

# ── Parse args ──────────────────────────────────────────────
DRY_RUN=0
CONFIRM=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1; shift;;
    -y|--yes) CONFIRM=1; shift;;
    --help|-h)
      echo "Usage: bash installer.sh [--dry-run] [-y|--yes]"
      exit 0;;
  esac
done
if [ "${ADM_DRY_RUN:-}" = "1" ]; then DRY_RUN=1; fi

# ── Helpers ─────────────────────────────────────────────────
info()  { echo -e "${CYAN}  [INFO]${RESET} $*"; }
ok()    { echo -e "${GREEN}  [OK]${RESET} $*"; }
warn()  { echo -e "${YELLOW}  [WARN]${RESET} $*"; }
err()   { echo -e "${RED}  [ERROR]${RESET} $*"; }

# ── Detect OS ──────────────────────────────────────────────
detect_os() {
  case "$(uname -s)" in
    Darwin) echo "darwin";;
    Linux)  echo "linux";;
    *)      echo "unknown";;
  esac
}

# ── Detect Shell ───────────────────────────────────────────
detect_shell() {
  local shell="${SHELL:-}"
  case "$shell" in
    */zsh)  echo "zsh";;
    */bash) echo "bash";;
    *)
      if [ -n "${TERM_PROGRAM:-}" ] && echo "$TERM_PROGRAM" | grep -q "Apple_Terminal"; then
        echo "bash"
      else
        echo "unknown"
      fi
      ;;
  esac
}

# ── Check sudo ─────────────────────────────────────────────
need_sudo() {
  if [ -w "$INSTALL_DIR" ]; then
    echo "no"
  elif [ "$(id -u)" = "0" ]; then
    echo "root"
  else
    echo "sudo"
  fi
}

# ── Main ───────────────────────────────────────────────────
main() {
  local OS SHELL_TYPE SUDO_STATUS

  OS=$(detect_os)
  SHELL_TYPE=$(detect_shell)
  SUDO_STATUS=$(need_sudo)

  echo ""
  echo -e "${BOLD}  ADM CLI Installer v${ADM_VERSION}${RESET}"
  echo ""

  if [ "$OS" = "unknown" ]; then
    err "Unsupported OS: $(uname -s). ADM requires macOS or Linux."
    exit 1
  fi

  info "OS: ${OS}"
  info "Shell: ${SHELL_TYPE}"

  if [ "$SHELL_TYPE" = "unknown" ]; then
    warn "Unsupported shell detected. ADM works best with Bash or Zsh."
  fi

  info "Sudo required: ${SUDO_STATUS}"
  echo ""

  if [ "$DRY_RUN" = "1" ]; then
    echo -e "${YELLOW}  DRY RUN — no changes will be made${RESET}"
    echo ""
    echo "  Planned actions:"
    echo "    1. Download ADM v${ADM_VERSION} from ${REPO_URL}"
    echo "    2. Install to ${ADM_BIN}"
    echo "    3. Make executable"
    if [ "$SUDO_STATUS" = "sudo" ]; then
      echo "    4. Prompt for sudo password"
    fi
    echo "    5. Run 'adm setup' interactive wizard"
    exit 0
  fi

  # Confirm
  if [ "$CONFIRM" = "0" ]; then
    echo -e "  ${BOLD}Continue?${RESET} [Y/n]"
    read -r response
    case "$response" in
      [nN]|[nN][oO]) err "Aborted."; exit 1;;
    esac
  fi

  # Download & install
  local USE_NODE=0
  if command -v node >/dev/null 2>&1; then
    USE_NODE=1
    info "Using Node.js: $(node -v)"
  fi

  if [ "$USE_NODE" = "1" ]; then
    # If node is available, run via npm link or direct execution
    local SCRIPT_DIR
    SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
    local TARGET_BIN="${SCRIPT_DIR}/bin/adm"

    if [ -f "$TARGET_BIN" ]; then
      info "Linking adm from local project..."
      if [ "$SUDO_STATUS" = "sudo" ]; then
        sudo ln -sf "$TARGET_BIN" "$ADM_BIN"
      else
        ln -sf "$TARGET_BIN" "$ADM_BIN"
      fi
      ok "Linked ${ADM_BIN} -> ${TARGET_BIN}"
    else
      # Production: download tarball
      info "Downloading ADM v${ADM_VERSION}..."
      local TMPDIR
      TMPDIR=$(mktemp -d)
      curl -fsSL "${REPO_URL}/releases/download/v${ADM_VERSION}/adm.tar.gz" -o "${TMPDIR}/adm.tar.gz"
      tar -xzf "${TMPDIR}/adm.tar.gz" -C "${TMPDIR}"

      if [ "$SUDO_STATUS" = "sudo" ]; then
        sudo cp "${TMPDIR}/bin/adm" "$ADM_BIN"
      else
        cp "${TMPDIR}/bin/adm" "$ADM_BIN"
      fi
      chmod +x "$ADM_BIN"
      rm -rf "$TMPDIR"
      ok "Installed ${ADM_BIN}"
    fi
  else
    err "Node.js is required. Install Node.js v18+ first: https://nodejs.org"
    exit 1
  fi

  # Verify
  if command -v adm >/dev/null 2>&1; then
    ok "ADM installed: $(adm --version 2>/dev/null || echo 'v${ADM_VERSION}')"
  else
    warn "adm not found in PATH. Add ${INSTALL_DIR} to your PATH."
  fi

  echo ""
  ok "Installation complete!"
  echo ""
  echo -e "  Run ${BOLD}adm setup${RESET} to configure your dev environment."
  echo ""
}

main "$@"
