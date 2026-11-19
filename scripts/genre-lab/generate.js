/**
 * genre-lab/generate.js
 * Composes 40 professions × 5 design variants = 200 Genre Lab templates:
 *   templates/static/html/<category>/<role-slug>/<genre-slug>-<scheme>/
 * Each ships: index.html, style.css, app.js (vanilla, zero deps),
 * run.bat (per-folder shortcut, unique port), README.md (mermaid), template.json,
 * and a static preview SVG into assets-outbox/genre-previews/svg/.
 * Run: node scripts/genre-lab/generate.js
 */

const fs = require('fs');
const path = require('path');
const { GENRES, FIRST, LAST } = require('./data');
const { css, bodyHTML, palette } = require('./effects');
const { runBat: sharedRunBat } = require('../runbat-template');
const { appJs } = require('./appjs');

const repoRoot = path.resolve(__dirname, '..', '..');
const T = path.join(repoRoot, 'templates', 'static', 'html');
const OUTBOX = path.join(repoRoot, 'assets-outbox', 'genre-previews', 'svg');
const ASSETS_CDN = 'https://raw.githubusercontent.com/Alex-DevDrift/Assets/refs/heads/main/portfoliobuilders/images';
const BASE_PORT = 8830;

// vendored GSAP sources (from the Interactive Collection builds)
const VENDOR_SRC = {
  'gsap.min.js': path.join(T, 'technical/creative-developer/3d-desert-rover-playground/vendor/gsap.min.js'),
  'ScrollTrigger.min.js': path.join(T, 'creative/interaction-designer/3d-spatial-zen-garden/vendor/ScrollTrigger.min.js')
};

const HERO_ARCH = ['splitRise', 'stickerBoard', 'aurora', 'particlesMorph', 'spotlightGrid', 'marqueeHero', 'typeCounter', 'imageCollapse', 'tileScatter', 'glarePortrait'];
const WORK_ARCH = ['bentoSpotlight', 'horizPin', 'tiltGlare', 'chipsFilter', 'staggerZig', 'listHover'];

const HEROES = ['kinetic', 'stickers', 'tiles', 'glow', 'type'];
const WORKS = ['bento', 'tilt', 'horiz', 'chips'];
const CONTACTS = ['terminal', 'bigcta', 'form'];
const CURSORS = ['dot', 'ring', 'none'];
const SCHEMES = ['dark', 'light', 'deep', 'warm', 'mono'];

const existingCatalog = (() => {
  try {
    // ids already in the catalog EXCEPT our own genre-lab ones (they are regenerated in place)
    return new Set(JSON.parse(fs.readFileSync(path.join(repoRoot, 'showcase', 'src', 'data', 'templates.json'), 'utf8'))
      .filter(t => !(t.tags || []).includes('genre-lab'))
      .map(t => t.id));
  } catch { return new Set(); }
})();

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const runBat = sharedRunBat;

// Image pool: local photos already inside the collection templates (Unsplash
// licensed, downloaded + localized there). Genre templates pick from this pool,
// downscaled per use — zero new external dependencies.
const PLACEHOLDER_EXCLUDE = new Set(['img_37526070297c.webp','img_a83a8bd57fbe.webp','img_c627a92ad1ab.webp','img_4636190af475.webp','img_924657c74fba.webp','img_43490279c0fa.webp','img_photo.webp']);
let POOL = null, sharpMod;
function buildPool() {
  if (POOL) return POOL;
  POOL = [];
  const seen = new Set();
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'vendor' && e.name !== '_next') walk(p); continue; }
      const rel = path.relative(T, p).split(path.sep).join('/');
      if (rel.includes('/assets/photos/') && /\.webp$/i.test(e.name) && !seen.has(e.name)) {
        seen.add(e.name); POOL.push(p);
      }
    }
  };
  walk(T);
  return POOL;
}
function getSharp() {
  if (sharpMod !== undefined) return sharpMod;
  try { sharpMod = require(path.join(repoRoot, 'scratch', 'node_modules', 'sharp')); }
  catch { sharpMod = false; }
  return sharpMod;
}
async function copyPoolImages(dir, gi, v) {
  const pool = buildPool();
  const sharp = getSharp();
  if (!pool.length || !sharp) { console.log('  [WARN] image pool or sharp unavailable — templates ship without photos'); return 0; }
  const outDir = path.join(dir, 'assets', 'photos');
  fs.mkdirSync(outDir, { recursive: true });
  const picks = [
    [pool[(gi * 7 + v * 3) % pool.length], 'about.webp', 900],
    [pool[(gi * 11 + v * 5 + 1) % pool.length], 'work1.webp', 640],
    [pool[(gi * 11 + v * 5 + 2) % pool.length], 'work2.webp', 640],
    [pool[(gi * 11 + v * 5 + 3) % pool.length], 'work3.webp', 640]
  ];
  let n = 0;
  for (const [src, name, w] of picks) {
    try { await sharp(src).resize({ width: w }).webp({ quality: 72 }).toFile(path.join(outDir, name)); n++; }
    catch { try { fs.copyFileSync(src, path.join(outDir, name)); n++; } catch { console.error('  [WARN] image copy failed:', name); } }
  }
  return n;
}

function previewSVG(cfg, scheme, v) {
  const { palette } = require('./effects');
  const p = palette(cfg.hue, scheme);
  const W = 1200, H = 675;
  const cardFill = p.light ? '#ffffff' : p.bg2;
  const cards = cfg.projects.slice(0, 3).map(([t], i) => {
    const y = 470;
    const x = 90 + i * 350;
    return `<g><rect x="${x}" y="${y}" width="320" height="130" rx="16" fill="${cardFill}" stroke="${p.border}" stroke-width="1.5"/>
      <text x="${x + 24}" y="${y + 34}" font-family="monospace" font-size="15" fill="${p.acc}">${String(i + 1).padStart(2, '0')}</text>
      <text x="${x + 24}" y="${y + 66}" font-family="Segoe UI,system-ui" font-size="22" font-weight="700" fill="${p.text}">${esc(t.slice(0, 20))}</text>
      <rect x="${x + 24}" y="${y + 86}" width="180" height="6" rx="3" fill="${p.muted}" opacity=".4"/></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${p.bg}"/>
  <circle cx="${W - 140}" cy="120" r="150" fill="${p.acc}" opacity=".18"/>
  <circle cx="120" cy="${H - 90}" r="110" fill="${p.acc2}" opacity=".14"/>
  <text x="90" y="150" font-family="monospace" font-size="16" letter-spacing="4" fill="${p.acc}">${esc(cfg.role.toUpperCase())} · GENRE LAB</text>
  <text x="90" y="230" font-family="Segoe UI,system-ui" font-size="64" font-weight="800" fill="${p.text}">${esc(cfg.persona)}</text>
  <rect x="90" y="252" width="180" height="8" fill="${p.acc}"/>
  <text x="90" y="310" font-family="Segoe UI,system-ui" font-size="24" fill="${p.muted}">${esc(cfg.tag.slice(0, 58))}</text>
  ${cards}
  <text x="90" y="640" font-family="monospace" font-size="14" fill="${p.muted}">${esc(cfg.theme)} · variant ${v + 1} (${scheme}) · Portfolio Builder Genre Lab</text>
</svg>`;
}

function readme(cfg, meta, files) {
  const arch = ['```mermaid', 'flowchart TD', '  A["index.html - single page"] --> B["style.css - design system"]', '  A --> C["app.js - GSAP effects kit"]',
    '  A --> V["vendor: GSAP 3 + ScrollTrigger (local)"]',
    `  B --> D["${cfg.hero} hero + ${cfg.work} work grid"]`, `  C --> D`,
    `  C --> E["custom ${cfg.cursor} cursor"]`, `  C --> F["scroll ${cfg.progress === 0 ? 'bar' : 'ruler'} + ScrollTrigger reveals"]`, '  D --> G["contact: ' + cfg.contact + '"]', '  V --> D', '```'].join('\n');
  const use = ['```mermaid', 'flowchart LR', `  A["run.bat in this folder"] --> B["local server :${meta.port}"]`, '  B --> C["opens in browser"]',
    '  C --> D["edit copy + palette in files"]', '  D --> E{apply}', '  E --> F["GitHub Pages - auto on push"]', '  E --> G["Netlify / Cloudflare / Vercel"]', '```'].join('\n');
  return `# ${cfg.theme} — ${cfg.role} Portfolio Template (Genre Lab)

> ${cfg.one}

\`${meta.category}\` · \`${cfg.hero}\` hero · \`${cfg.work}\` work grid · \`${cfg.cursor}\` cursor · \`${schemeUsed}\` scheme

**Live:** ${meta.deployment.liveUrl}

---

## How it works

${arch}

All effects run on **GSAP 3 + ScrollTrigger** (vendored locally in \`vendor/\`) — no npm install, no CDN, works offline.

## Run it locally

${use}

Or simply double-click \`run.bat\` in this folder — it serves this exact folder and opens the site (works even if you copy this folder anywhere else, e.g. \`D:\\My Projects\\3d Template\\25\\\`).

Standalone without Python:

\`\`\`bash
cd templates/static/html/${meta.deployment.path}
python -m http.server ${meta.port}
\`\`\`

## Apply it

| Option | How |
|---|---|
| **This repo (auto)** | Keep under \`templates/static/html/...\` — push to \`main\` deploys to GitHub Pages automatically |
| **Netlify / Cloudflare** | Drag-and-drop this folder — zero build step |
| **Vercel** | Static import, framework preset: Other |
| **Own repo** | Copy folder → push → enable Pages |

## Files

| Path | Purpose |
|---|---|
| \`index.html\` | Single-page markup |
| \`style.css\` | Full design system (palette in \`:root\`) |
| \`app.js\` | Effects kit — GSAP timelines, ScrollTrigger, interactions |
| \`vendor/\` | GSAP 3 + ScrollTrigger (local, no CDN) |
| \`assets/photos/\` | ${meta.imgs || 4} local images — about + work cards |
| \`run.bat\` | One-click local server + browser |
| \`template.json\` | Catalog metadata |

## Make it yours

1. Replace the persona name, email and city (search \`index.html\`).
2. Swap the six project entries — they live in \`app.js\`-bound markup and the copy blocks.
3. Recolor everything by editing the accent variables in \`style.css :root\`.

---

Part of the [Portfolio Builder](https://github.com/SudiptaSanki/PortfolioBuilder) open-source collection · Genre Lab kit · MIT.
`;
}

let schemeUsed;

async function main() {
  const taken = existingCatalog;
  const seen = new Set();
  let port = BASE_PORT, count = 0;
  fs.mkdirSync(OUTBOX, { recursive: true });

  for (let gi = 0; gi < GENRES.length; gi++) {
    const g = GENRES[gi];
    for (let v = 0; v < 5; v++) {
      const scheme = SCHEMES[v];
      const id = `${g.slug}-${scheme}`;
      if (taken.has(id) || seen.has(id)) throw new Error('id collision: ' + id);
      seen.add(id);

      const persona = `${FIRST[(gi * 5 + v) % FIRST.length]} ${LAST[(gi * 11 + v * 3) % LAST.length]}`;
      const city = ['Berlin', 'Lisbon', 'Kyoto', 'Toronto', 'Cape Town', 'Odense', 'Melbourne', 'Austin', 'Tallinn', 'Seoul'][(gi + v) % 10];

      const cfg = {
        slug: id, theme: `${g.name} · ${scheme}`, personaid: id,
        persona, city, email: `hello@${id}.io`, year: 2018 + (v % 7),
        role: g.role, tag: g.tag, skills: g.skills, projects: g.projects,
        hue: (g.hue + v * 6) % 360, cat: g.cat,
        hero: HERO_ARCH[(gi * 3 + v * 2) % HERO_ARCH.length],
        work: WORK_ARCH[(gi * 2 + v) % WORK_ARCH.length],
        contact: CONTACTS[(gi + v) % CONTACTS.length], cursor: CURSORS[(gi * 2 + v) % CURSORS.length],
        progress: (gi + v) % 2,
        gi, v,
        worksFirst: (gi + v) % 2 === 1
      };
      const deployPath = `${g.cat}/${g.slug}/${id}`;
      const dir = path.join(T, deployPath);
      fs.mkdirSync(dir, { recursive: true });

      schemeUsed = scheme;
      const style = css(cfg, v);
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(cfg.persona)} — ${esc(cfg.role)} Portfolio</title>
<meta name="description" content="${esc(cfg.one || cfg.tag)}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' fill='${encodeURIComponent(palette(cfg.hue, scheme).acc)}'/%3E%3C/svg%3E">
<link rel="stylesheet" href="./style.css">
</head>
${bodyHTML(cfg)}
`;
      const js = appJs(cfg, v);

      fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
      fs.writeFileSync(path.join(dir, 'style.css'), style, 'utf8');
      fs.writeFileSync(path.join(dir, 'app.js'), js, 'utf8');
      fs.writeFileSync(path.join(dir, 'run.bat'), runBat(cfg.theme, port), 'utf8');

      // vendored GSAP (shared source, copied per template so zips stay self-contained)
      fs.mkdirSync(path.join(dir, 'vendor'), { recursive: true });
      for (const lib of ['gsap.min.js', 'ScrollTrigger.min.js']) {
        const src = VENDOR_SRC[lib];
        if (src && fs.existsSync(src)) fs.copyFileSync(src, path.join(dir, 'vendor', lib));
      }

      const meta = {
        $schema: 'https://portfoliobuilders.dev/schemas/template-v1.json',
        id, name: cfg.theme,
        category: g.cat, role: g.role, roleSlug: g.slug, subcategory: g.slug,
        framework: 'html', stack: 'HTML/CSS/JS', libraries: ['gsap', 'scrolltrigger'],
        theme: cfg.theme, language: ['html', 'css', 'javascript'], rendering: 'static',
        tags: ['genre-lab', 'interactive', 'single-page', 'gsap', 'scrolltrigger', `hero-${cfg.hero}`, `works-${cfg.work}`, `cursor-${cfg.cursor}`, `scheme-${scheme}`, g.slug, g.cat, 'html', 'css', 'js'],
        description: `${g.role} portfolio (${cfg.theme} variant): ${cfg.hero} hero, ${cfg.work} work grid, ${cfg.cursor} cursor — from the Genre Lab permutation engine.`,
        source: { path: `templates/static/html/${deployPath}`, entry: 'index.html' },
        deployment: {
          provider: 'github-pages', type: 'shared-static', shard: 'github-pages-01', managedBy: 'core',
          baseUrl: 'https://sudiptasanki.github.io/PortfolioBuilder', path: deployPath,
          liveUrl: `https://sudiptasanki.github.io/PortfolioBuilder/${deployPath}/index.html`, status: 'active'
        },
        preview: { image: `${ASSETS_CDN}/img_genrelab_${id}.webp` },
        contributor: { name: 'PortfolioBuilder Core', github: 'SudiptaSanki' }
      };
      fs.writeFileSync(path.join(dir, 'template.json'), JSON.stringify(meta, null, 2) + '\n', 'utf8');

      const imgs = await copyPoolImages(dir, gi, v);
      fs.writeFileSync(path.join(dir, 'README.md'), readme(cfg, { ...meta, port, imgs }, null).replace('schemeUsed', scheme), 'utf8');
      fs.writeFileSync(path.join(OUTBOX, `${id}.svg`), previewSVG(cfg, scheme, v), 'utf8');

      port++; count++;
    }
  }
  console.log(`Genre Lab generated: ${count} templates (ports ${BASE_PORT}-${port - 1})`);
}

main().catch(e => { console.error(e); process.exit(1); });
