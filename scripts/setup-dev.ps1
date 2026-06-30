Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $root "backend"
$backendEnv = Join-Path $backendDir ".env"
$backendRequirements = Join-Path $backendDir "requirements.txt"

Write-Host "==> Installing frontend dependencies..."
pnpm install

Write-Host ""
Write-Host "==> Checking backend layout..."
if (-not (Test-Path $backendDir)) {
  throw "backend directory not found: $backendDir"
}

if (-not (Test-Path $backendRequirements)) {
  throw "backend requirements.txt not found: $backendRequirements"
}

if (-not (Test-Path $backendEnv)) {
  Write-Warning "backend/.env not found. Copy backend/.env.example to backend/.env before starting the backend."
} else {
  Write-Host "backend/.env found."
}

Write-Host ""
Write-Host "==> Backend dependency install command"
Write-Host "Run this if your Python env is not ready yet:"
Write-Host "cd backend"
Write-Host "pip install -r requirements.txt"

Write-Host ""
Write-Host "==> Database initialization commands"
Write-Host "cd backend"
Write-Host "mysql -u root -p < sql/init_anime.sql"
Write-Host "mysql -u root -p < sql/init_country.sql"
Write-Host "mysql -u root -p < sql/init_theme.sql"

Write-Host ""
Write-Host "==> Dev commands"
Write-Host "pnpm dev"
Write-Host "pnpm dev:backend"
Write-Host "pnpm dev:all"
