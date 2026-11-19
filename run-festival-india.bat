@echo off
title Portfolio Builder - Festival Batch: India
call "%~dp0scripts\_pb-env.bat" ensure
if errorlevel 1 pause & exit /b 1

set "BASE=http://127.0.0.1:%PB_PORT%/festival"
echo [PB] Opening Indian festival templates (one tab per style)...

rem toran garland + daisy petals, centered layout
start "" "%BASE%/bharatanatyam-dancer/marigold-dawn/index.html"
ping -n 2 127.0.0.1 >nul
rem string lights + fireflies, split layout
start "" "%BASE%/kathak-dancer/ratri-diya/index.html"
ping -n 2 127.0.0.1 >nul
rem henna palette craft template
start "" "%BASE%/mehndi-artist/mehndi-vine/index.html"
ping -n 2 127.0.0.1 >nul
rem hanging lanterns + fireflies, banner layout
start "" "%BASE%/bollywood-choreographer/neon-utsav/index.html"
ping -n 2 127.0.0.1 >nul
rem flower vine + twinkling stars
start "" "%BASE%/jyotish-astrologer/jyotish-night/index.html"
ping -n 2 127.0.0.1 >nul
rem toran + spinning marigolds, pandal decor
start "" "%BASE%/pandal-decorator/pandal-glow/index.html"

echo [PB] Done - server window stays minimized; use run-stop-server.bat to close it.
ping -n 5 127.0.0.1 >nul
exit /b 0
