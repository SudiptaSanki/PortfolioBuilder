@echo off
title 3D Nature Sanctuary Resort Portfolio - Portfolio Builder Local Server
cd /d "%~dp0"
echo Opening local server at http://127.0.0.1:8741/ ...
start "" http://127.0.0.1:8741/index.html
python -m http.server 8741 --bind 127.0.0.1 || py -m http.server 8741 --bind 127.0.0.1
