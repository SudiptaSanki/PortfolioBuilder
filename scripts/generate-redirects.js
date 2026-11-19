/**
 * generate-redirects.js
 * Stages the static GitHub Pages deploy artifact (default: _site/) from
 * templates/static/html/ and generates HTML redirect stubs from deployments/redirects.json
 * so legacy live URLs seamlessly forward to their new canonical paths without cluttering Git.
 *
 * Usage: node scripts/generate-redirects.js [outDir]
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const staticHtmlDir = path.join(repoRoot, 'templates', 'static', 'html');
const redirectsPath = path.join(repoRoot, 'deployments', 'redirects.json');
const outDir = path.resolve(repoRoot, process.argv[2] || '_site');

if (!fs.existsSync(staticHtmlDir)) {
  console.error(`FATAL: Static deploy source not found at ${staticHtmlDir}`);
  process.exit(1);
}

// 1. Clean & copy templates/static/html -> outDir
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.cpSync(staticHtmlDir, outDir, { recursive: true });

// Ensure .nojekyll exists at Pages root
const nojekyll = path.join(outDir, '.nojekyll');
if (!fs.existsSync(nojekyll)) {
  fs.writeFileSync(nojekyll, '', 'utf8');
}

// 2. Emit redirect stubs from deployments/redirects.json
let count = 0;
if (fs.existsSync(redirectsPath)) {
  const data = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
  const map = data.redirects || {};

  for (const [oldRel, newRel] of Object.entries(map)) {
    const cleanOld = oldRel.replace(/^\/+|\/+$/g, '');
    const cleanNew = newRel.replace(/^\/+|\/+$/g, '');
    if (!cleanOld || !cleanNew || cleanOld === cleanNew) continue;

    const stubDir = path.join(outDir, cleanOld);
    const stubFile = path.join(stubDir, 'index.html');

    // Compute relative target path from /<cleanOld>/index.html to /<cleanNew>/index.html
    const relTarget = path.posix.relative(`/${cleanOld}`, `/${cleanNew}`) + '/index.html';
    const canonicalUrl = `https://sudiptasanki.github.io/PortfolioBuilder/${cleanNew}/index.html`;

    fs.mkdirSync(stubDir, { recursive: true });
    fs.writeFileSync(
      stubFile,
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Moved — Portfolio Builder</title>
  <meta http-equiv="refresh" content="0;url=${relTarget}">
  <link rel="canonical" href="${canonicalUrl}">
  <script>window.location.replace(${JSON.stringify(relTarget)});</script>
</head>
<body>
  <p>This template moved to <a href="${relTarget}">${cleanNew}</a>.</p>
</body>
</html>
`,
      'utf8'
    );
    count++;
  }
}

console.log(`Staged Pages artifact at ${path.relative(repoRoot, outDir)} with ${count} redirect stubs.`);
