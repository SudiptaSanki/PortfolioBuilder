@echo off
setlocal
title Civil Engineer · warm - local server
set "PORT=8838"
set "HERE=%~dp0"
cd /d "%HERE%"

echo ============================================================
echo   Civil Engineer · warm
echo ============================================================
echo [1/4] Checking files...

rem --- preflight: entry file must exist and be non-empty ---
if not exist "%HERE%index.html" (
    echo [run] ERROR: index.html is missing from this folder.
    echo [run] The template folder is incomplete - re-copy it.
    pause
    exit /b 1
)
for %%F in ("%HERE%index.html") do if %%~zF EQU 0 (
    echo [run] ERROR: index.html is empty - the template folder is incomplete.
    pause
    exit /b 1
)
echo [run] index.html OK.

echo [2/4] Looking for a free port (preferred: %PORT%)...
set /a TRIES=0
:findport
netstat -ano | findstr /C:":%PORT% " | findstr "LISTENING" >nul 2>nul
if errorlevel 1 goto port_ok
set /a PORT+=1
set /a TRIES+=1
if %TRIES% GEQ 25 goto noport
echo [run] Port busy - trying %PORT% ...
goto findport
:port_ok
echo [run] Port %PORT% is free.

echo [3/4] Preparing the browser shortcut (opens once the server is up)...
start "" /min cmd /c "ping -n 4 127.0.0.1 >nul & start "" http://127.0.0.1:%PORT%/index.html"

rem --- detect a server runtime: Python first, Node fallback ---
set "PY="
python --version >nul 2>nul && set "PY=python"
if not defined PY py --version >nul 2>nul && set "PY=py"

echo [4/4] Starting local server...
if defined PY (
    echo [run] Python server on http://127.0.0.1:%PORT% - keep this window open, Ctrl+C stops it.
    %PY% -m http.server %PORT% --bind 127.0.0.1
) else (
    where node >nul 2>nul || goto noruntime
    echo [run] Python not found - using the bundled Node fallback server...
    node "%HERE%_serve.cjs" %PORT%
    goto stopped
)

:stopped
echo.
echo [run] Server stopped. See you next festival.
pause
exit /b 0

:noruntime
echo [run] ERROR: neither Python nor Node.js was found on this machine.
echo [run] Install one of:  https://www.python.org   |   https://nodejs.org
echo [run] (This template also works by double-clicking index.html directly.)
pause
exit /b 1

:noport
echo [run] ERROR: no free port found between %PORT% and %PORT%+25.
pause
exit /b 1
