@echo off
REM Setup web support for Flutter app
REM Flutter installation: C:\instalacije\flutter\flutter

REM Change to script directory
cd /d "%~dp0"

echo Setting up web support for Flutter app...
echo.

REM Add Flutter to PATH for this session
set PATH=C:\instalacije\flutter\flutter\bin;%PATH%

REM Create assets/images directory if it doesn't exist
if not exist "assets\images" (
    echo Creating assets/images directory...
    mkdir assets\images
    echo Directory created.
) else (
    echo assets/images directory already exists.
)
echo.

REM Add web support to the project
echo Adding web support to the project...
C:\instalacije\flutter\flutter\bin\flutter create . --platforms=web
echo.

echo Web support setup complete!
echo.
echo Now you can run:
echo   flutter run -d chrome
echo   flutter run -d firefox
echo   flutter run -d edge
echo.
pause
