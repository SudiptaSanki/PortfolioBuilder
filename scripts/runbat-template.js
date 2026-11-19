/**
 * runbat-template.js — single source of truth for per-template run.bat files.
 * Behavior (user requirement):
 *   1. Double-click -> a VISIBLE terminal runs the whole startup sequence.
 *   2. Preflight: entry file must exist and be non-empty before anything starts.
 *   3. Port: tries the preferred port first; if busy, walks +1 (up to 25 tries).
 *   4. Browser opens ONLY after the server is confirmed listening.
 *   5. Server runs in the foreground of the same visible terminal
 *      (Python preferred; Node fallback via _serve.cjs; no npm install needed).
 *   6. Closing the terminal or Ctrl+C stops the server.
 */

function runBat(title, port) {
  return `@echo off
setlocal
title ${title} - local server
set "PORT=${port}"
set "HERE=%~dp0"
cd /d "%HERE%"

echo ============================================================
echo   ${title}
echo ============================================================
echo [1/4] Checking files...

rem --- preflight: entry file must exist and be non-empty ---
if not exist "%HERE%index.html" (
    echo [run] ERROR: index.html is missing from this folder.
    echo [run] The template folder is incomplete - re-copy it.
    pause
    exit /b 1
)
for %%F in ("%HERE%index.html") do if %%~zF EQU 0 (
    echo [run] ERROR: index.html is empty - the template folder is incomplete.
    pause
    exit /b 1
)
echo [run] index.html OK.

echo [2/4] Looking for a free port (preferred: %PORT%)...
set /a TRIES=0
:findport
netstat -ano | findstr /C:":%PORT% " | findstr "LISTENING" >nul 2>nul
if errorlevel 1 goto port_ok
set /a PORT+=1
set /a TRIES+=1
if %TRIES% GEQ 25 goto noport
echo [run] Port busy - trying %PORT% ...
goto findport
:port_ok
echo [run] Port %PORT% is free.

echo [3/4] Preparing the browser shortcut (opens once the server is up)...
start "" /min cmd /c "ping -n 4 127.0.0.1 >nul & start "" http://127.0.0.1:%PORT%/index.html"

rem --- detect a server runtime: Python first, Node fallback ---
set "PY="
python --version >nul 2>nul && set "PY=python"
if not defined PY py --version >nul 2>nul && set "PY=py"

echo [4/4] Starting local server...
if defined PY (
    echo [run] Python server on http://127.0.0.1:%PORT% - keep this window open, Ctrl+C stops it.
    %PY% -m http.server %PORT% --bind 127.0.0.1
) else (
    where node >nul 2>nul || goto noruntime
    echo [run] Python not found - using the bundled Node fallback server...
    node "%HERE%_serve.cjs" %PORT%
    goto stopped
)

:stopped
echo.
echo [run] Server stopped. See you next festival.
pause
exit /b 0

:noruntime
echo [run] ERROR: neither Python nor Node.js was found on this machine.
echo [run] Install one of:  https://www.python.org   |   https://nodejs.org
echo [run] (This template also works by double-clicking index.html directly.)
pause
exit /b 1

:noport
echo [run] ERROR: no free port found between %PORT% and %PORT%+25.
pause
exit /b 1
`;
}

// Node fallback static server (used when Python is not installed)
const SERVE_CJS = `/* Genre Lab / Collection static server - Node fallback (no dependencies) */
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname;
const port = parseInt(process.argv[2], 10) || 8000;
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.txt': 'text/plain', '.pdf': 'application/pdf' };
http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
  if (u.endsWith('/')) u += 'index.html';
  const fp = path.normalize(path.join(root, u));
  if (!fp.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(fp, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': mime[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(fp).pipe(res);
  });
}).listen(port, '127.0.0.1', () => console.log('Serving http://127.0.0.1:' + port + '/index.html - Ctrl+C to stop'));
`;

module.exports = { runBat, SERVE_CJS };
