/**
 * festival/convert-previews.js
 * Converts the generated static preview SVGs into WebP cards for the
 * Alex-DevDrift/Assets CDN (AGENTS.md image policy).
 *
 * Usage:  node scripts/festival/convert-previews.js
 * Input:  assets-outbox/festival-previews/svg/<id>.svg
 * Output: assets-outbox/festival-previews/<id>.webp  (1200px wide, q80)
 *
 * Upload the output folder contents to:
 *   Alex-DevDrift/Assets/portfoliobuilders/images/
 * (filenames already match the preview URLs inside each template.json)
 */

const fs = require('fs');
const path = require('path');

// sharp lives in scratch/node_modules (kept out of the main dependency tree)
let sharp;
try {
  sharp = require('sharp');
} catch {
  try {
    sharp = require(path.join(repoRoot(), 'scratch', 'node_modules', 'sharp'));
  } catch (e) {
    console.error('sharp is not installed. Run:  npm install sharp --prefix scratch');
    process.exit(1);
  }
}

function repoRoot() {
  return path.resolve(__dirname, '..', '..');
}

const root = repoRoot();
const svgDir = path.join(root, 'assets-outbox', 'festival-previews', 'svg');
const outDir = path.join(root, 'assets-outbox', 'festival-previews');

(async () => {
  if (!fs.existsSync(svgDir)) {
    console.error('No preview SVGs found. Run scripts/festival/generate.js first.');
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });

  const files = fs.readdirSync(svgDir).filter(f => f.endsWith('.svg'));
  let ok = 0;
  for (const f of files) {
    const id = f.replace(/\.svg$/, '');
    const dest = path.join(outDir, `${id}.webp`);
    try {
      await sharp(path.join(svgDir, f), { density: 96 })
        .resize({ width: 1200 })
        .webp({ quality: 80 })
        .toFile(dest);
      ok++;
    } catch (err) {
      console.error(`  [FAIL] ${id}: ${err.message}`);
    }
  }
  console.log(`Converted ${ok}/${files.length} previews to WebP → ${path.relative(root, outDir)}`);
  console.log('Next: upload the .webp files to github.com/Alex-DevDrift/Assets/tree/main/portfoliobuilders/images');
})();
