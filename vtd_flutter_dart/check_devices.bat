@echo off
REM Check available Flutter devices
REM Flutter installation: C:\instalacije\flutter\flutter

REM Change to script directory
cd /d "%~dp0"

REM Add Flutter to PATH for this session
set PATH=C:\instalacije\flutter\flutter\bin;%PATH%

echo Checking available Flutter devices...
echo.
C:\instalacije\flutter\flutter\bin\flutter devices
echo.
pause
