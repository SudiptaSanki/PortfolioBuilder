/**
 * upgrade-runbats.js
 * Regenerates EVERY run.bat under templates/ with the new launcher behavior
 * (visible terminal, preflight, port auto-fallback, browser-on-ready,
 * Node fallback), preserving each folder's preferred port. Also writes
 * _serve.cjs next to each bat and patches the two generator scripts to use
 * the shared template for future regenerations.
 * Run: node scripts/upgrade-runbats.js
 */

const fs = require('fs');
const path = require('path');
const { runBat, SERVE_CJS } = require('./runbat-template');

const repoRoot = path.resolve(__dirname, '..');
const T = path.join(repoRoot, 'templates', 'html', 'github-pages');

let ports = [];
const walk = (d, cb) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p, cb); }
    else if (e.name === 'run.bat') cb(p);
  }
};

walk(T, (batPath) => {
  const dir = path.dirname(batPath);
  const old = fs.readFileSync(batPath, 'utf8');

  // preserve the preferred port from the existing bat
  const pm = old.match(/set "PORT=(\d+)"/) || old.match(/set PORT=(\d+)/);
  const port = pm ? parseInt(pm[1], 10) : 8800;

  // theme name: template.json > folder name
  let title = path.basename(dir);
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(dir, 'template.json'), 'utf8'));
    if (meta.name) title = meta.name;
  } catch { /* folder name fallback */ }
  title = title.replace(/[/\\:*?"<>|]/g, '').slice(0, 60);

  fs.writeFileSync(batPath, runBat(title, port), 'utf8');
  fs.writeFileSync(path.join(dir, '_serve.cjs'), SERVE_CJS, 'utf8');
  ports.push(port);
});

ports.sort((a, b) => a - b);
console.log(`run.bat upgraded: ${ports.length} files | ports ${ports[0]}-${ports[ports.length - 1]}`);

// ---- keep the two generators in sync (single source of truth) ----
const gen1 = path.join(repoRoot, 'scripts', 'genre-lab', 'generate.js');
let g1 = fs.readFileSync(gen1, 'utf8');
if (!g1.includes("require('../runbat-template')")) {
  g1 = g1.replace(/const \{ css, bodyHTML, palette \} = require\('\.\/effects'\);/,
    `const { css, bodyHTML, palette } = require('./effects');\nconst { runBat: sharedRunBat } = require('../runbat-template');`);
  // replace the local runBat function definition with a thin alias
  g1 = g1.replace(/function runBat\(title, port\) \{[\s\S]*?\n\}\n/, 'const runBat = sharedRunBat;\n');
  fs.writeFileSync(gen1, g1, 'utf8');
  console.log('genre-lab/generate.js now uses the shared bat template');
}

const gen2 = path.join(repoRoot, 'scripts', 'make-collection-runbats.js');
let g2 = fs.readFileSync(gen2, 'utf8');
if (!g2.includes("require('./runbat-template')")) {
  g2 = g2.replace(/const path = require\('path'\);/,
    `const path = require('path');\nconst { runBat: sharedRunBat } = require('./runbat-template');`);
  g2 = g2.replace(/function batFor\(port, title\) \{[\s\S]*?\n\}\n/, 'const batFor = (port, title) => sharedRunBat(title, port);\n');
  fs.writeFileSync(gen2, g2, 'utf8');
  console.log('make-collection-runbats.js now uses the shared bat template');
}
