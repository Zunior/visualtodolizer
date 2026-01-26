@echo off
REM Quick run script - assumes web support is already enabled
REM Flutter installation: C:\instalacije\flutter\flutter

echo Starting Visual Todo Lizer Flutter app on Web...
echo.

REM Add Flutter to PATH for this session
set PATH=C:\instalacije\flutter\flutter\bin;%PATH%

REM Run the app on web (Chrome)
C:\instalacije\flutter\flutter\bin\flutter run -d chrome

pause
