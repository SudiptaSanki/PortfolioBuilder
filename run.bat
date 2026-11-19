@echo off
setlocal
title Portfolio Builder - Launcher
:menu
cls
echo ==================================================
echo    Portfolio Builder - Local Launcher
echo ==================================================
echo.
echo   [1] Preview Hub - ALL templates, categorized (browser)
echo   [2] Festival batch - India   (100 templates, browser)
echo   [3] Festival batch - World   (100 templates, browser)
echo   [4] Showcase dev server      (localhost:3000)
echo   [5] Validate templates + compile catalog
echo   [6] Regenerate festival templates
echo   [7] Convert preview images to WebP
echo   [8] Stop template server
echo   [0] Exit
echo.
choice /c 123456780 /n /m "  Choose an option: "
if errorlevel 9 goto end
if errorlevel 8 goto stop_server
if errorlevel 7 goto previews
if errorlevel 6 goto generate
if errorlevel 5 goto validate
if errorlevel 4 goto showcase
if errorlevel 3 goto world
if errorlevel 2 goto india
if errorlevel 1 goto hub
goto menu

:hub
call "%~dp0run-preview-hub.bat"
goto menu

:india
call "%~dp0run-festival-india.bat"
goto menu

:world
call "%~dp0run-festival-world.bat"
goto menu

:showcase
call "%~dp0run-showcase.bat"
goto menu

:validate
call "%~dp0run-validate.bat"
goto menu

:generate
echo [PB] Regenerating festival templates...
node "%~dp0scripts\festival\generate.js"
echo [PB] Done.
pause
goto menu

:previews
echo [PB] Converting preview SVGs to WebP (assets-outbox)...
node "%~dp0scripts\festival\convert-previews.js"
echo [PB] Done.
pause
goto menu

:stop_server
call "%~dp0run-stop-server.bat"
goto menu

:end
endlocal
exit /b 0
