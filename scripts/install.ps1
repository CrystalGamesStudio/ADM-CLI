# ADM CLI Installer for Windows
# Usage: irm https://raw.githubusercontent.com/CrystalPlatforms/ADM-CLI/main/scripts/install.ps1 | iex
# Or:    powershell -ExecutionPolicy Bypass -File install.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "  ADM CLI Installer" -ForegroundColor Cyan
Write-Host ""

# 1. Check for Node.js
try {
    $nodeVersion = (node -v)
} catch {
    Write-Host "  [ERROR] Node.js is required but not found." -ForegroundColor Red
    Write-Host ""
    Write-Host "  Install Node.js v18+ from: https://nodejs.org"
    Write-Host "  Or using winget: winget install OpenJS.NodeJS.LTS"
    Write-Host "  Or using choco: choco install nodejs-lts"
    exit 1
}

# 2. Check version >= 18
$majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($majorVersion -lt 18) {
    Write-Host "  [ERROR] Node.js 18+ required. Current: $nodeVersion" -ForegroundColor Red
    exit 1
}

Write-Host "  [INFO] Node.js $nodeVersion detected" -ForegroundColor Cyan

# 3. Check for npm
try {
    $npmVersion = (npm -v)
} catch {
    Write-Host "  [ERROR] npm not found. It should come with Node.js." -ForegroundColor Red
    exit 1
}

# 4. Install globally
Write-Host "  [INFO] Installing @crystalplatforms/adm globally..." -ForegroundColor Cyan

try {
    npm install -g @crystalplatforms/adm
} catch {
    Write-Host "  [WARN] npm install failed. Trying with elevated privileges..." -ForegroundColor Yellow
    Start-Process npm -ArgumentList "install", "-g", "@crystalplatforms/adm" -Verb RunAs -Wait
}

# 5. Verify
try {
    $admVersion = adm --version 2>$null
    Write-Host "  [OK] ADM installed: $admVersion" -ForegroundColor Green
} catch {
    Write-Host "  [WARN] adm not found in PATH. Open a new terminal to use it." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  Installation complete!" -ForegroundColor Green
Write-Host "  Run " -NoNewline
Write-Host "adm" -ForegroundColor White -NoNewline
Write-Host " to launch the TUI."
Write-Host "  Type " -NoNewline
Write-Host "/download" -ForegroundColor White -NoNewline
Write-Host " inside ADM to set up your dev environment."
Write-Host ""
