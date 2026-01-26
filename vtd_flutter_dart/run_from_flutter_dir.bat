@echo off
REM Helper script to copy to C:\instalacije\flutter\flutter\bin\
REM This allows running Flutter commands from the Flutter bin directory
REM Usage: vtd_pub_get.bat or vtd_run_firefox.bat

set PROJECT_DIR=C:\ExelaPlexus\VTD_full_stack\vtd_flutter_dart

if "%1"=="pub_get" (
    cd /d "%PROJECT_DIR%"
    flutter pub get
) else if "%1"=="run_firefox" (
    cd /d "%PROJECT_DIR%"
    flutter run -d firefox
) else if "%1"=="run_chrome" (
    cd /d "%PROJECT_DIR%"
    flutter run -d chrome
) else (
    echo Usage:
    echo   vtd_pub_get.bat
    echo   vtd_run_firefox.bat
    echo   vtd_run_chrome.bat
    echo.
    echo Or copy this file to C:\instalacije\flutter\flutter\bin\ and rename accordingly
)
