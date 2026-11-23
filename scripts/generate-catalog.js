/**
 * generate-catalog.js
 * Single Source of Truth compiler.
 * Scans all template.json files under templates/, enriches them with canonical aliases,
 * sub-category labels, tags, and live visual face-card metadata (palette + headline),
 * and compiles showcase/src/data/templates.json.
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const templatesRoot = path.join(repoRoot, 'templates');
const rolesRegistryPath = path.join(repoRoot, 'registry', 'roles.json');
const catalogDest = path.join(repoRoot, 'showcase', 'src', 'data', 'templates.json');

const fullRegistry = fs.existsSync(rolesRegistryPath)
  ? JSON.parse(fs.readFileSync(rolesRegistryPath, 'utf8'))
  : { categories: {}, roles: {} };

const categoriesRegistry = fullRegistry.categories || {};
const rolesRegistry = fullRegistry.roles || {};

const CATEGORY_FALLBACK_ACCENTS = {
  festival: '#f59e0b',
  technical: '#4ade80',
  engineering: '#38bdf8',
  research: '#60a5fa',
  educator: '#818cf8',
  medical: '#f87171',
  'wellness-sports': '#fb923c',
  agriculture: '#84cc16',
  'transport-aviation': '#22d3ee',
  'construction-trades': '#d97706',
  creative: '#f472b6',
  business: '#facc15',
  'law-public': '#94a3b8',
  music: '#c084fc',
  retail: '#fb7185',
  services: '#a78bfa',
  startup: '#2dd4bf',
  gaming: '#e879f9'
};

function findMetadataFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'out'].includes(entry.name)) {
        continue;
      }
      findMetadataFiles(fullPath, fileList);
    } else if (entry.isFile() && entry.name === 'template.json') {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

function normalizeHex(hex) {
  if (!hex || typeof hex !== 'string') return '';
  const m = hex.trim().match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!m) return '';
  const raw = m[1];
  if (raw.length === 3) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toLowerCase();
  }
  return `#${raw.toLowerCase()}`;
}

function hexLuminance(hex) {
  const norm = normalizeHex(hex);
  if (!norm) return 0.1;
  const r = parseInt(norm.slice(1, 3), 16) / 255;
  const g = parseInt(norm.slice(3, 5), 16) / 255;
  const b = parseInt(norm.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function decodeHtmlEntities(str) {
  return String(str || '')
    .replace(/&amp;/g, '&')
    .replace(/&mdash;|&#8212;/g, '—')
    .replace(/&ndash;|&#8211;/g, '–')
    .replace(/&middot;/g, '·')
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function extractVisualMeta(templateDir, data) {
  const defaultAccent = CATEGORY_FALLBACK_ACCENTS[data.category] || '#6c7af7';
  let bg = '';
  let fg = '';
  let accent = '';
  let headline = '';

  try {
    const idxPath = path.join(templateDir, 'index.html');
    const html = fs.existsSync(idxPath) ? fs.readFileSync(idxPath, 'utf8') : '';

    // Extract meta theme-color
    const themeColorMatch = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["'](#[0-9a-fA-F]{3,6})["']/i)
      || html.match(/<meta[^>]+content=["'](#[0-9a-fA-F]{3,6})["'][^>]+name=["']theme-color["']/i);
    if (themeColorMatch) {
      bg = normalizeHex(themeColorMatch[1]);
    }

    // Extract hero headline or clean <title>
    const h1Match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    const h1Text = h1Match ? decodeHtmlEntities(h1Match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()) : '';
    const titleText = titleMatch ? decodeHtmlEntities(titleMatch[1].replace(/\s+/g, ' ').trim()) : '';

    if (h1Text && h1Text.length >= 6 && h1Text.length <= 85 && !/sr-only/i.test(h1Match[0])) {
      headline = h1Text;
    } else if (titleText) {
      headline = titleText.slice(0, 80);
    }

    // Gather up to 2 CSS files for :root palette extraction
    let cssText = '';
    for (const relCss of ['style.css', path.join('css', 'style.css'), path.join('css', 'styles.css'), path.join('src', 'styles', 'main.css')]) {
      const cp = path.join(templateDir, relCss);
      if (fs.existsSync(cp)) {
        cssText += '\n' + fs.readFileSync(cp, 'utf8').slice(0, 6000);
      }
    }

    if (cssText) {
      if (!bg) {
        const bgMatch = cssText.match(/--(?:bg|paper|cream|ground|surface|bg-1|bg-primary|color-bg|canvas)\s*:\s*(#[0-9a-fA-F]{3,6})/i);
        if (bgMatch) bg = normalizeHex(bgMatch[1]);
      }
      const fgMatch = cssText.match(/--(?:text|ink|fg|text-primary|color-text|ink-1)\s*:\s*(#[0-9a-fA-F]{3,6})/i);
      if (fgMatch) fg = normalizeHex(fgMatch[1]);
      const accMatch = cssText.match(/--(?:accent|acc|gold|brass|primary|highlight|brand|accent-1)\s*:\s*(#[0-9a-fA-F]{3,6})/i);
      if (accMatch) accent = normalizeHex(accMatch[1]);
    }
  } catch {
    // Fallback cleanly to defaults
  }

  bg = bg || '#131318';
  const isLight = hexLuminance(bg) > 0.45;
  if (!fg) {
    fg = isLight ? '#18181b' : '#f4f4f5';
  } else {
    // Guard against low-contrast extracted fg/bg pairs
    const bgLum = hexLuminance(bg);
    const fgLum = hexLuminance(fg);
    if (Math.abs(bgLum - fgLum) < 0.25) {
      fg = isLight ? '#18181b' : '#f4f4f5';
    }
  }
  accent = accent || defaultAccent;

  return {
    palette: { bg, fg, accent },
    headline: headline || data.name || ''
  };
}

console.log(`Scanning for template.json files under: ${templatesRoot}`);
const metadataFiles = findMetadataFiles(templatesRoot);
console.log(`Discovered ${metadataFiles.length} template.json files.`);

if (metadataFiles.length === 0) {
  console.error('No template.json files found! Aborting catalog compilation.');
  process.exit(1);
}

const seenIds = new Set();
const compiledTemplates = [];
const errors = [];

for (const filePath of metadataFiles) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    if (!data.id) {
      errors.push(`Missing 'id' in ${filePath}`);
      continue;
    }
    if (seenIds.has(data.id)) {
      errors.push(`Duplicate template ID '${data.id}' found in ${filePath}`);
      continue;
    }
    seenIds.add(data.id);

    if (!data.name) errors.push(`Missing 'name' in ${filePath}`);
    if (!data.category) errors.push(`Missing 'category' in ${filePath}`);

    const templateDir = path.dirname(filePath);
    const relPath = (data.source?.path || path.relative(repoRoot, templateDir)).replace(/\\/g, '/');
    const pathParts = relPath.split('/');
    const roleSlug = data.roleSlug || pathParts[4] || '';
    const regRole = rolesRegistry[roleSlug];
    const subCat = data.subCategory || regRole?.subCategory || '';
    const subCategoryLabel = categoriesRegistry[data.category]?.subCategories?.[subCat] || '';

    const baseTags = Array.isArray(data.tags) ? data.tags : [];
    const defaultTags = regRole && Array.isArray(regRole.defaultTags) ? regRole.defaultTags : [];
    const mergedTags = Array.from(new Set([...baseTags, ...defaultTags]));

    const { palette, headline } = extractVisualMeta(templateDir, data);

    const catalogEntry = {
      id: data.id,
      name: data.name,
      role: data.role || regRole?.label || '',
      roleSlug,
      category: data.category,
      subcategory: data.subcategory || subCat,
      subCategory: subCat,
      subCategoryLabel,
      aliases: regRole && Array.isArray(regRole.aliases) ? regRole.aliases : [],
      stack: data.stack || (data.framework === 'html' ? 'HTML/CSS/JS' : data.framework),
      libraries: Array.isArray(data.libraries) ? data.libraries : [],
      theme: data.theme || 'Editorial Theme',
      tags: mergedTags,
      path: relPath,
      headline,
      palette,
      description: data.description || '',
      platform: data.deployment?.provider || 'github-pages',
      framework: data.framework || 'html',
      rendering: data.rendering || 'static',
      customization: {
        enabled: Boolean(data.customization && data.customization.enabled === true)
      },
      deployment: {
        provider: data.deployment?.provider || 'github-pages',
        type: data.deployment?.type || 'shared-static',
        shard: data.deployment?.shard || 'default',
        managedBy: data.deployment?.managedBy || 'core',
        status: data.deployment?.status || 'active',
        baseUrl: data.deployment?.baseUrl || '',
        path: data.deployment?.path || '',
        liveUrl: data.deployment?.liveUrl || ''
      },
      contributor: {
        name: data.contributor?.name || 'PortfolioBuilder Core',
        github: data.contributor?.github || ''
      }
    };

    compiledTemplates.push(catalogEntry);
  } catch (err) {
    errors.push(`Failed to parse ${filePath}: ${err.message}`);
  }
}

if (errors.length > 0) {
  console.error(`\nValidation Errors Encountered (${errors.length}):`);
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}

compiledTemplates.sort((a, b) => {
  if (a.category !== b.category) {
    return a.category.localeCompare(b.category);
  }
  return a.id.localeCompare(b.id);
});

const destDir = path.dirname(catalogDest);
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.writeFileSync(catalogDest, JSON.stringify(compiledTemplates, null, 2) + '\n', 'utf8');
console.log(`Successfully compiled ${compiledTemplates.length} templates into ${catalogDest}!`);
