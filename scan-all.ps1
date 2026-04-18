Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step($msg) {
  Write-Host ""
  Write-Host "==> $msg" -ForegroundColor Cyan
}

function Try-Run($label, $scriptBlock) {
  try {
    Write-Step $label
    & $scriptBlock
    Write-Host "OK: $label" -ForegroundColor Green
  } catch {
    Write-Host "FAILED: $label" -ForegroundColor Red
    Write-Host $_.Exception.Message
  }
}

$root = "C:\Users\nours\OneDrive\Desktop\SW_proj\Combine_proj\Combine_proj"

# --- Frontend checks ---
$frontend = Join-Path $root "DermaSkincareApp"
if (Test-Path $frontend) {
  Push-Location $frontend

  Try-Run "Frontend: TypeScript typecheck (tsc --noEmit)" { npx tsc --noEmit }

  if (Test-Path (Join-Path $frontend "package.json")) {
    # Prefer npm run lint if configured
    Try-Run "Frontend: Lint (npm run lint)" { npm run lint }
  }

  Pop-Location
} else {
  Write-Host "Frontend folder not found: $frontend" -ForegroundColor Yellow
}

# --- Backend checks ---
$backend = Join-Path $root "backend-1"
if (Test-Path $backend) {
  Push-Location $backend

  # Activate venv if present
  $venvActivate = Join-Path $backend "venv\Scripts\Activate.ps1"
  $dotVenvActivate = Join-Path $backend ".venv\Scripts\Activate.ps1"
  if (Test-Path $venvActivate) {
    . $venvActivate
  } elseif (Test-Path $dotVenvActivate) {
    . $dotVenvActivate
  }

  Try-Run "Backend: Django system check" { python manage.py check }

  # Try pytest first, then Django test runner
  $pytestCmd = Get-Command pytest -ErrorAction SilentlyContinue
  if ($pytestCmd) {
    Try-Run "Backend: pytest" { pytest }
  } else {
    Try-Run "Backend: Django tests" { python manage.py test }
  }

  Pop-Location
} else {
  Write-Host "Backend folder not found: $backend" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Scan finished." -ForegroundColor Cyan
