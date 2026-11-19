@echo off
title Portfolio Builder - Stop Server
call "%~dp0scripts\_pb-env.bat"

set "FOUND="
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /C:":%PB_PORT% " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul && echo [PB] Stopped server process ^(PID %%a^)
    set "FOUND=1"
)
if not defined FOUND echo [PB] No template server running on port %PB_PORT%.
ping -n 4 127.0.0.1 >nul
exit /b 0
