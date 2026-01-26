@echo off
REM Setup script for Visual Todo Lizer Flutter app
REM Flutter installation: C:\instalacije\flutter\flutter

REM Change to script directory (where pubspec.yaml is located)
cd /d "%~dp0"

echo Setting up Visual Todo Lizer Flutter app...
echo Current directory: %CD%
echo.

REM Add Flutter to PATH for this session
set PATH=C:\instalacije\flutter\flutter\bin;%PATH%

REM Check Flutter installation
echo Checking Flutter installation...
C:\instalacije\flutter\flutter\bin\flutter --version
echo.

REM Get dependencies
echo Installing dependencies...
C:\instalacije\flutter\flutter\bin\flutter pub get
echo.

echo Setup complete!
echo.
echo To run the app:
echo   flutter run
echo.
echo To check for devices:
echo   flutter devices
echo.

pause
