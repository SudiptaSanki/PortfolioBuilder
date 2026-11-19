@echo off
title Portfolio Builder - Interactive Collection (18)
call "%~dp0scripts\_pb-env.bat" ensure
if errorlevel 1 pause & exit /b 1

set "BASE=http://127.0.0.1:%PB_PORT%"
echo [PB] Opening all 18 interactive portfolio templates (one tab each)...

start "" "%BASE%/creative/brand-systems-designer/editorial-brand-systems/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/design-engineer/sunset-valley-parallax/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/technology/creative-technologist/solarpunk-vault-parallax/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/motion-designer/editorial-scroll-parallax/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/architecture-studio/architectural-parallax-showcase/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/technology/creative-developer/3d-desert-rover-playground/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/technology/webgl-artist/3d-iridescent-fluid-shader/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/technology/experience-studio/cybernetic-3d-experience/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/technology/front-end-engineer/kinetic-glsl-scroll-gallery/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/technology/3d-designer/obsidian-gsap-3d-archive/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/industrial-designer/brutalist-swiss-grid-3d/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/technology/game-artist/8-biome-3d-explorer/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/technology/motion-developer/dark-neon-3d-motion/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/product-designer/3d-spatial-product-showcase/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/interaction-designer/3d-spatial-zen-garden/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/visual-designer/playful-editorial-bento/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/product-designer/interactive-scrapbook-desk/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/digital-designer/interactive-messy-desktop/index.html"

echo [PB] All 18 opened. Tip: they are also in the Preview Hub (run-preview-hub.bat).
echo [PB] Server stays minimized - use run-stop-server.bat to close it.
timeout /t 4 >nul
exit /b 0
