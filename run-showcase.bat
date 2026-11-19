@echo off
title Portfolio Builder - Showcase Dev
where node >nul 2>nul
if errorlevel 1 (
    echo [PB] ERROR: Node.js not found. Install from https://nodejs.org and re-run.
    pause & exit /b 1
)

rem is the showcase already running?
netstat -ano | findstr /C:":3000 " | findstr "LISTENING" >nul 2>nul
if %errorlevel%==0 (
    echo [PB] Showcase already running - opening browser.
    start "" "http://localhost:3000/"
    ping -n 3 127.0.0.1 >nul
    exit /b 0
)

rem first run: install showcase dependencies
if not exist "%~dp0showcase\node_modules" (
    echo [PB] First run: installing showcase dependencies (this takes a few minutes)...
    pushd "%~dp0showcase"
    call npm install
    popd
)

echo [PB] Compiling the catalog from template.json files...
node "%~dp0scripts\generate-catalog.js"

echo [PB] Starting showcase dev server (minimized window)...
start "PB Showcase Dev :3000" /min /D "%~dp0showcase" cmd /c "npm run dev"

echo [PB] Waiting for the dev server to come up...
ping -n 10 127.0.0.1 >nul
start "" "http://localhost:3000/"
echo [PB] Showcase opened at http://localhost:3000 - close the minimized window to stop it.
ping -n 5 127.0.0.1 >nul
exit /b 0
