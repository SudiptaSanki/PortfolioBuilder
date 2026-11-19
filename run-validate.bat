@echo off
title Portfolio Builder - Validate
where node >nul 2>nul
if errorlevel 1 (
    echo [PB] ERROR: Node.js not found. Install from https://nodejs.org and re-run.
    pause & exit /b 1
)
echo [PB] Validating every template.json (schema, ids, paths, URLs)...
node "%~dp0scripts\validate-templates.js"
if errorlevel 1 (
    echo.
    echo [PB] VALIDATION FAILED - fix the errors above.
    pause & exit /b 1
)
echo.
echo [PB] Compiling the showcase catalog...
node "%~dp0scripts\generate-catalog.js"
echo.
echo [PB] All good. Refresh the showcase or preview hub to see updates.
pause
exit /b 0
