/**
 * normalize-tags.js — makes every template fully filterable:
 *   1. Stack normalization: 'html-css-js' or GSAP-suffixed stacks -> 'HTML/CSS/JS'
 *   2. Structure tag: single-page / multi-page derived from .html count
 *   3. Collection tag: guarantees one of core / collection / festival / genre-lab
 * Run: node scripts/normalize-tags.js
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const T = path.join(repoRoot, 'templates');
const stats = { stackFixed: 0, structAdded: 0, coreTagged: 0, total: 0 };

function pageStructure(dir) {
  let count = 0;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) { if (e.name !== 'vendor' && e.name !== 'node_modules') walk(path.join(d, e.name)); continue; }
      if (/\.html$/i.test(e.name)) count++;
    }
  };
  walk(dir);
  return count === 1 ? 'single-page' : 'multi-page';
}

function* metaFiles(root) {
  for (const e of fs.readdirSync(root, { withFileTypes: true })) {
    const p = path.join(root, e.name);
    if (e.isDirectory()) {
      if (['node_modules', 'vendor', 'dist', 'out'].includes(e.name)) continue;
      yield* metaFiles(p);
    } else if (e.name === 'template.json') yield p;
  }
}

for (const file of metaFiles(T)) {
  stats.total++;
  const m = JSON.parse(fs.readFileSync(file, 'utf8'));
  let changed = false;
  m.tags = m.tags || [];

  if (m.stack && (m.stack === 'html-css-js' || (m.stack.startsWith('HTML/CSS/JS') && m.stack !== 'HTML/CSS/JS'))) {
    m.stack = 'HTML/CSS/JS';
    changed = true;
    stats.stackFixed++;
  }
  if (!m.tags.includes('single-page') && !m.tags.includes('multi-page')) {
    m.tags.push(pageStructure(path.dirname(file)));
    changed = true;
    stats.structAdded++;
  }
  if (!['core', 'collection', 'festival', 'genre-lab'].some(c => m.tags.includes(c))) {
    m.tags.push('core');
    changed = true;
    stats.coreTagged++;
  }
  if (changed) fs.writeFileSync(file, JSON.stringify(m, null, 2) + '\n', 'utf8');
}

console.log(`scanned ${stats.total} templates | stack fixed: ${stats.stackFixed} | structure added: ${stats.structAdded} | core-tagged: ${stats.coreTagged}`);
