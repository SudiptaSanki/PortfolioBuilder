@echo off
rem ============================================================
rem  Portfolio Builder - shared environment helpers
rem  Used by run-*.bat files:
rem     call "%~dp0scripts\_pb-env.bat"            -> set variables only
rem     call "%~dp0scripts\_pb-env.bat" ensure     -> + start server if not running
rem     call "%~dp0scripts\_pb-env.bat" diag       -> + print current state
rem ============================================================

set "PB_PORT=8741"
set "PB_ROOT=%~dp0.."
set "PB_SERVE_DIR=%PB_ROOT%\templates\static\html"
set "PB_HUB=%PB_ROOT%\preview-hub.html"

rem --- detect a working Python (skips the Microsoft Store stub) ---
set "PB_PY="
python --version >nul 2>nul && set "PB_PY=python"
if not defined PB_PY py --version >nul 2>nul && set "PB_PY=py"

rem --- is the template server already listening? ---
set "PB_RUNNING=0"
netstat -ano | findstr /C:":%PB_PORT% " | findstr "LISTENING" >nul 2>nul && set "PB_RUNNING=1"

if "%~1"=="diag" goto diag
if "%~1"=="ensure" goto ensure_server
goto :eof

:ensure_server
if "%PB_RUNNING%"=="1" (
    echo [PB] Template server already running on http://127.0.0.1:%PB_PORT%
    goto :eof
)
if not defined PB_PY (
    echo [PB] ERROR: Python not found. Install it from https://www.python.org and re-run.
    exit /b 1
)
echo [PB] Starting template server on http://127.0.0.1:%PB_PORT% ...
start "PB Template Server :%PB_PORT%" /min /D "%PB_SERVE_DIR%" %PB_PY% -m http.server %PB_PORT% --bind 127.0.0.1
set /a PB_TRIES=0
:wait_ready
ping -n 2 127.0.0.1 >nul
netstat -ano | findstr /C:":%PB_PORT% " | findstr "LISTENING" >nul 2>nul && goto server_ready
set /a PB_TRIES+=1
if %PB_TRIES% LSS 10 goto wait_ready
echo [PB] WARNING: server not confirmed yet - opening anyway.
goto :eof
:server_ready
echo [PB] Server ready.
goto :eof

:diag
echo PB_PY=%PB_PY%
echo PB_RUNNING=%PB_RUNNING%
echo PB_PORT=%PB_PORT%
echo PB_SERVE_DIR=%PB_SERVE_DIR%
goto :eof
