@echo off
title Portfolio Builder - Festival Batch: World
call "%~dp0scripts\_pb-env.bat" ensure
if errorlevel 1 pause & exit /b 1

set "BASE=http://127.0.0.1:%PB_PORT%/festival"
echo [PB] Opening world festival templates (one tab per festival)...

rem Christmas: pine garland + snow + snowflake motifs
start "" "%BASE%/christmas-tree-farmer/pine-hearth/index.html"
ping -n 2 127.0.0.1 >nul
rem Halloween: vine garland + autumn leaves
start "" "%BASE%/pumpkin-carver/moonlit-patch/index.html"
ping -n 2 127.0.0.1 >nul
rem Dia de Muertos: papel picado + spinning marigolds
start "" "%BASE%/ofrenda-artist/cempasuchil-path/index.html"
ping -n 2 127.0.0.1 >nul
rem Carnival: flag bunting + confetti
start "" "%BASE%/samba-dancer/feather-storm/index.html"
ping -n 2 127.0.0.1 >nul
rem Eid: fanous lanterns + twinkling stars
start "" "%BASE%/eid-calligrapher/crescent-ink/index.html"
ping -n 2 127.0.0.1 >nul
rem Hanukkah: string lights + snow
start "" "%BASE%/menorah-silversmith/shining-shield/index.html"
ping -n 2 127.0.0.1 >nul
rem Lunar New Year: lantern garland + rising sky lanterns
start "" "%BASE%/lion-dance-performer/crimson-lantern-year/index.html"
ping -n 2 127.0.0.1 >nul
rem Hanami: cherry-blossom branch + falling sakura
start "" "%BASE%/sakura-photographer/petal-frame/index.html"
ping -n 2 127.0.0.1 >nul
rem Oktoberfest: bunting + autumn leaves
start "" "%BASE%/brewmaster/foam-and-firkin/index.html"
ping -n 2 127.0.0.1 >nul
rem World harvest: flower vine + floating hearts
start "" "%BASE%/valentine-florist/rose-vow/index.html"

echo [PB] Done - server window stays minimized; use run-stop-server.bat to close it.
ping -n 5 127.0.0.1 >nul
exit /b 0
