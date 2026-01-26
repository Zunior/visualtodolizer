# PowerShell script for Visual Todo Lizer Flutter app - Web version (Chrome)
# Flutter installation: C:\instalacije\flutter\flutter

# Change to script directory (where pubspec.yaml is located)
Set-Location $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Visual Todo Lizer - Flutter Web App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Gray
Write-Host ""

$flutterPath = "C:\instalacije\flutter\flutter\bin\flutter"

# Check if Flutter is accessible
Write-Host "[1/3] Checking Flutter installation..." -ForegroundColor Yellow
if (-not (Test-Path $flutterPath)) {
    Write-Host "ERROR: Flutter not found at $flutterPath" -ForegroundColor Red
    Write-Host "Please check your Flutter installation path." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

try {
    $null = & $flutterPath --version 2>&1
    Write-Host "Flutter found!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Flutter not accessible" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Enable web support
Write-Host "[2/3] Ensuring web support is enabled..." -ForegroundColor Yellow
$null = & $flutterPath config --enable-web 2>&1
Write-Host "Web support enabled." -ForegroundColor Green
Write-Host ""

# Check if dependencies are installed
Write-Host "[3/3] Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "pubspec.lock")) {
    Write-Host "Dependencies not installed. Running 'flutter pub get'..." -ForegroundColor Yellow
    & $flutterPath pub get
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "Dependencies installed." -ForegroundColor Green
} else {
    Write-Host "Dependencies already installed." -ForegroundColor Green
}
Write-Host ""

# Run the app on web (Chrome)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting web app in Chrome..." -ForegroundColor Cyan
Write-Host "This may take a few minutes on first run..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

& $flutterPath run -d chrome

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Failed to run the app." -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure Chrome is installed"
    Write-Host "2. Try running: flutter pub get"
    Write-Host "3. Check for errors above"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Read-Host "Press Enter to exit"
