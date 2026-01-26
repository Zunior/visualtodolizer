@echo off
REM Run script for Visual Todo Lizer Flutter app - Web version
REM Flutter installation: C:\instalacije\flutter\flutter

REM Change to script directory (where pubspec.yaml is located)
cd /d "%~dp0"

echo ========================================
echo Visual Todo Lizer - Flutter Web App
echo ========================================
echo Current directory: %CD%
echo.

REM Add Flutter to PATH for this session
set PATH=C:\instalacije\flutter\flutter\bin;%PATH%

REM Check if Flutter is accessible
echo [1/3] Checking Flutter installation...
C:\instalacije\flutter\flutter\bin\flutter --version
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Flutter not found or not accessible
    echo Please check your Flutter installation path: C:\instalacije\flutter\flutter
    pause
    exit /b 1
)
echo Flutter found!
echo.

REM Enable web support (if not already enabled) - run silently
echo [2/3] Ensuring web support is enabled...
C:\instalacije\flutter\flutter\bin\flutter config --enable-web >nul 2>&1
echo Web support enabled.
echo.

REM Check if dependencies are installed
echo [3/3] Checking dependencies...
if not exist "pubspec.lock" (
    echo Dependencies not installed. Running 'flutter pub get'...
    C:\instalacije\flutter\flutter\bin\flutter pub get
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies.
        pause
        exit /b 1
    )
    echo Dependencies installed.
) else (
    echo Dependencies already installed.
)
echo.

REM Run the app on web (Chrome)
echo ========================================
echo Starting web app in Chrome...
echo This may take a few minutes on first run...
echo ========================================
echo.
C:\instalacije\flutter\flutter\bin\flutter run -d chrome

if errorlevel 1 (
    echo.
    echo ERROR: Failed to run the app.
    echo.
    echo Troubleshooting:
    echo 1. Make sure Chrome is installed
    echo 2. Try running: flutter pub get
    echo 3. Check for errors above
    echo.
    pause
    exit /b 1
)

pause
