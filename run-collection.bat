@echo off
title Portfolio Builder - Interactive Collection (40)
call "%~dp0scripts\_pb-env.bat" ensure
if errorlevel 1 pause & exit /b 1

set "BASE=http://127.0.0.1:%PB_PORT%"
echo [PB] Opening all 40 interactive portfolio templates (one tab each)...

start "" "%BASE%/technical/ml-engineer/3d-ai-gpu-datacenter-tour/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/immersive-designer/3d-deep-ocean-immersive/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/technical/creative-developer/3d-desert-rover-playground/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/technical/devops-engineer/3d-devops-datacenter-cathedral/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/transport-aviation/commercial-pilot/3d-flight-deck-pilot-portfolio/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/engineering/renewable-energy-engineer/3d-hydroelectric-dam-portfolio/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/technical/cloud-architect/3d-interactive-server-room/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/technical/webgl-artist/3d-iridescent-fluid-shader/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/3d-illustrator/3d-island-voyage-portfolio/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/transport-aviation/loco-pilot/3d-mainline-rail-loco-pilot/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/services/eco-resort-host/3d-nature-sanctuary-showcase/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/research/geoscience-studio/3d-ocean-geoscience-studio/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/engineering/electrical-engineer/3d-power-substation-tour/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/product-designer/3d-spatial-product-showcase/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/interaction-designer/3d-spatial-zen-garden/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/engineering/computer-engineer/3d-workstation-hardware-lab/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/game-artist/8-biome-3d-explorer/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/startup/ai-product-site/ai-career-platform-site/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/architecture-studio/architectural-parallax-showcase/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/gaming/board-game-storyteller/board-game-storytelling/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/industrial-designer/brutalist-swiss-grid-3d/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/engineering/civil-engineer/civil-tunnels-towers-showcase/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/creative-agency/creative-software-agency/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/technical/experience-studio/cybernetic-3d-experience/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/technical/motion-developer/dark-neon-3d-motion/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/brand-systems-designer/editorial-brand-systems/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/motion-designer/editorial-scroll-parallax/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/engineering/electrical-engineer/electrical-engineer-editorial-journal/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/web-designer/freelance-identity-web-designer/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/technical/ai-experience-designer/interactive-ai-twin-experience/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/digital-designer/interactive-messy-desktop/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/product-designer/interactive-scrapbook-desk/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/technical/frontend-developer/kinetic-glsl-scroll-gallery/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/neubrutalist-designer/neubrutalist-sticker-portfolio/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/technical/3d-designer/obsidian-gsap-3d-archive/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/visual-designer/playful-editorial-bento/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/technical/interaction-developer/scroll-morphing-particle/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/technical/creative-technologist/solarpunk-vault-parallax/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/design-engineer/sunset-valley-parallax/index.html"
ping -n 2 127.0.0.1 >nul
start "" "%BASE%/creative/studio-designer/tile-constellation-studio/index.html"

echo [PB] All 40 opened. Tip: they are also in the Preview Hub (run-preview-hub.bat).
echo [PB] Server stays minimized - use run-stop-server.bat to close it.
timeout /t 4 >nul
exit /b 0
