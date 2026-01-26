@echo off
REM Find Firefox installation path
echo Searching for Firefox installation...
echo.

REM Check common Firefox locations
if exist "C:\Program Files\Mozilla Firefox\firefox.exe" (
    echo Found Firefox at: C:\Program Files\Mozilla Firefox\
    echo.
    echo Add this to your PATH:
    echo   C:\Program Files\Mozilla Firefox\
    goto :end
)

if exist "C:\Program Files (x86)\Mozilla Firefox\firefox.exe" (
    echo Found Firefox at: C:\Program Files (x86)\Mozilla Firefox\
    echo.
    echo Add this to your PATH:
    echo   C:\Program Files (x86)\Mozilla Firefox\
    goto :end
)

REM Search in Program Files
for /d %%i in ("C:\Program Files\Mozilla Firefox*") do (
    if exist "%%i\firefox.exe" (
        echo Found Firefox at: %%i
        echo.
        echo Add this to your PATH:
        echo   %%i
        goto :end
    )
)

echo Firefox not found in common locations.
echo.
echo To find Firefox manually:
echo 1. Right-click Firefox shortcut
echo 2. Select Properties
echo 3. Check the "Target" field
echo.

:end
pause
