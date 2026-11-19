@echo off
title Portfolio Builder - Preview Hub
call "%~dp0scripts\_pb-env.bat" ensure
if errorlevel 1 pause & exit /b 1

rem regenerate the hub so newly added templates appear
where node >nul 2>nul && node "%~dp0scripts\generate-preview-hub.js" >nul 2>nul

if exist "%~dp0preview-hub.html" (
    echo [PB] Opening the categorized Preview Hub in your browser...
    start "" "%~dp0preview-hub.html"
) else (
    start "" "http://127.0.0.1:%PB_PORT%/"
)
exit /b 0
