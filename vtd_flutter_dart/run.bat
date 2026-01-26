@echo off
REM Run script for Visual Todo Lizer Flutter app
REM Flutter installation: C:\instalacije\flutter\flutter

echo Running Visual Todo Lizer Flutter app...
echo.

REM Add Flutter to PATH for this session
set PATH=C:\instalacije\flutter\flutter\bin;%PATH%

REM Run the app
C:\instalacije\flutter\flutter\bin\flutter run

pause
