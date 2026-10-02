/**
 * generate-catalog.js
 * Single Source of Truth compiler.
 * Scans all templates template.json files and compiles the central showcase catalog (showcase/src/data/templates.json).
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const templatesRoot = path.join(repoRoot, 'templates');
const catalogDest = path.join(repoRoot, 'showcase', 'src', 'data', 'templates.json');

function findMetadataFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'out') {
        continue;
      }
      findMetadataFiles(fullPath, fileList);
    } else if (entry.isFile() && entry.name === 'template.json') {
      fileList.push(fullPath);
    }
  }

  return fileList;
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

    // Validate minimum required fields
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

    // Map to catalog format with backward compatibility for current showcase UI
    const catalogEntry = {
      id: data.id,
      name: data.name,
      role: data.role || '',
      category: data.category,
      subcategory: data.subcategory || '',
      stack: data.stack || (data.framework === 'html' ? 'HTML/CSS/JS' : data.framework),
      theme: data.theme || 'Custom Theme',
      tags: Array.isArray(data.tags) ? data.tags : [],
      path: data.source?.path || path.relative(repoRoot, path.dirname(filePath)).replace(/\\/g, '/'),
      preview: data.preview?.image || '',
      description: data.description || '',
      platform: data.deployment?.provider || 'github-pages',
      framework: data.framework || 'html',
      rendering: data.rendering || 'static',
      deployment: {
        provider: data.deployment?.provider || 'github-pages',
        type: data.deployment?.type || 'shared-static',
        shard: data.deployment?.shard || 'default',
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

// Deterministic sort: by category, then by id
compiledTemplates.sort((a, b) => {
  if (a.category !== b.category) {
    return a.category.localeCompare(b.category);
  }
  return a.id.localeCompare(b.id);
});

// Ensure directory exists
const destDir = path.dirname(catalogDest);
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.writeFileSync(catalogDest, JSON.stringify(compiledTemplates, null, 2) + '\n', 'utf8');
console.log(`Successfully compiled ${compiledTemplates.length} templates into ${catalogDest}!`);
