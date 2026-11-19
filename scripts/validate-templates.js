/**
 * validate-templates.js
 * Automated validation system for Portfolio Builder templates.
 * Enforces metadata standards, schema rules, asset path safety, and unique identifiers.
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const templatesRoot = path.join(repoRoot, 'templates');

const ALLOWED_FRAMEWORKS = ['html', 'react', 'vue', 'nextjs', 'astro', 'svelte', 'vanilla'];
const ALLOWED_RENDERING = ['static', 'spa', 'ssr', 'edge'];
const ALLOWED_DEPLOY_TYPES = ['shared-static', 'contributor-hosted', 'managed-runtime', 'edge-runtime', 'external'];
const ALLOWED_PROVIDERS = ['github-pages', 'cloudflare-pages', 'vercel', 'netlify', 'custom', 'external'];
const ALLOWED_CATEGORIES = [
  'technology', 'creative', 'business', 'academic', 'health-wellness',
  'services', 'retail', 'startup', 'gaming', 'music', 'events', 'medical', 'festival'
];
const ALLOWED_STATUSES = ['active', 'pending', 'broken', 'deprecated', 'migrated'];

function findMetadataFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'out'].includes(entry.name)) continue;
      findMetadataFiles(fullPath, fileList);
    } else if (entry.isFile() && entry.name === 'template.json') {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

function checkAbsoluteAssetPaths(templateDir, framework) {
  const violations = [];
  const filesToScan = [];

  function gatherHtml(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['node_modules', '.git'].includes(entry.name)) gatherHtml(full);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        // In Vite / framework source, ignore root index.html with /src/ dev references
        if (framework !== 'html' && entry.name === 'index.html' && dir === templateDir) {
          continue;
        }
        filesToScan.push(full);
      }
    }
  }

  // If framework template, scan dist/out if present, otherwise templateDir
  gatherHtml(templateDir);

  const absoluteRegex = /(?:href|src)=["'](\/[^"'/][^"']*)["']/g;

  for (const htmlFile of filesToScan) {
    try {
      const content = fs.readFileSync(htmlFile, 'utf8');
      let match;
      while ((match = absoluteRegex.exec(content)) !== null) {
        const foundPath = match[1];
        // Allow Next.js internal static assets and favicon if already statically exported
        if (framework === 'nextjs' && (foundPath.startsWith('/_next/') || foundPath.startsWith('/favicon.ico'))) continue;
        violations.push({
          file: path.relative(repoRoot, htmlFile).replace(/\\/g, '/'),
          path: foundPath
        });
      }
    } catch {
      // Ignore unreadable files
    }
  }

  return violations;
}

console.log('--- Starting Portfolio Builder Template Validation ---');
const metadataFiles = findMetadataFiles(templatesRoot);
console.log(`Discovered ${metadataFiles.length} template.json files.\n`);

if (metadataFiles.length === 0) {
  console.error('FATAL: No template.json files found!');
  process.exit(1);
}

const seenIds = new Map();
const failures = [];
let passCount = 0;

for (const filePath of metadataFiles) {
  const relFilePath = path.relative(repoRoot, filePath).replace(/\\/g, '/');
  const templateErrors = [];

  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    failures.push({ file: relFilePath, errors: [`JSON Parse Error: ${err.message}`] });
    continue;
  }

  // 1. Unique ID
  if (!data.id) {
    templateErrors.push("Missing 'id'");
  } else {
    if (typeof data.id !== 'string' || !/^[a-z0-9-]+$/.test(data.id)) {
      templateErrors.push(`Invalid 'id' format: '${data.id}'. Must be lowercase alphanumeric with hyphens.`);
    }
    if (seenIds.has(data.id)) {
      templateErrors.push(`Duplicate 'id': '${data.id}' already defined in ${seenIds.get(data.id)}`);
    } else {
      seenIds.set(data.id, relFilePath);
    }
  }

  // 2. Required Core Metadata
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    templateErrors.push("Missing or invalid 'name'");
  }
  if (!data.category || !ALLOWED_CATEGORIES.includes(data.category)) {
    templateErrors.push(`Invalid 'category': '${data.category}'. Allowed: ${ALLOWED_CATEGORIES.join(', ')}`);
  }
  if (!data.role || typeof data.role !== 'string') {
    templateErrors.push("Missing or invalid 'role'");
  }

  // 3. Framework & Rendering
  if (!data.framework || !ALLOWED_FRAMEWORKS.includes(data.framework)) {
    templateErrors.push(`Invalid 'framework': '${data.framework}'. Allowed: ${ALLOWED_FRAMEWORKS.join(', ')}`);
  }
  if (!data.rendering || !ALLOWED_RENDERING.includes(data.rendering)) {
    templateErrors.push(`Invalid 'rendering': '${data.rendering}'. Allowed: ${ALLOWED_RENDERING.join(', ')}`);
  }

  // 4. Source Path Verification
  const templateDir = path.dirname(filePath);
  if (!data.source || !data.source.path) {
    templateErrors.push("Missing 'source.path'");
  } else {
    const fullSourcePath = path.join(repoRoot, data.source.path);
    if (!fs.existsSync(fullSourcePath)) {
      templateErrors.push(`Source directory does not exist on disk: '${data.source.path}'`);
    }
  }

  // 5. Deployment Verification
  if (!data.deployment) {
    templateErrors.push("Missing 'deployment' section");
  } else {
    const dep = data.deployment;
    if (!dep.type || !ALLOWED_DEPLOY_TYPES.includes(dep.type)) {
      templateErrors.push(`Invalid 'deployment.type': '${dep.type}'. Allowed: ${ALLOWED_DEPLOY_TYPES.join(', ')}`);
    }
    if (!dep.provider || !ALLOWED_PROVIDERS.includes(dep.provider)) {
      templateErrors.push(`Invalid 'deployment.provider': '${dep.provider}'. Allowed: ${ALLOWED_PROVIDERS.join(', ')}`);
    }
    if (!dep.liveUrl || typeof dep.liveUrl !== 'string' || !/^https?:\/\//i.test(dep.liveUrl)) {
      templateErrors.push(`Invalid 'deployment.liveUrl': '${dep.liveUrl}'. Must be a valid http(s) URL.`);
    }
    if (dep.status && !ALLOWED_STATUSES.includes(dep.status)) {
      templateErrors.push(`Invalid 'deployment.status': '${dep.status}'. Allowed: ${ALLOWED_STATUSES.join(', ')}`);
    }
  }

  // 6. Asset Path Compatibility Check
  const pathViolations = checkAbsoluteAssetPaths(templateDir, data.framework);
  if (pathViolations.length > 0) {
    for (const v of pathViolations.slice(0, 3)) {
      templateErrors.push(`Forbidden root-relative path '${v.path}' in file ${v.file}`);
    }
  }

  if (templateErrors.length > 0) {
    failures.push({ file: relFilePath, errors: templateErrors });
  } else {
    passCount++;
  }
}

console.log(`Validation Results:`);
console.log(`  Passed: ${passCount} templates`);
console.log(`  Failed: ${failures.length} templates\n`);

if (failures.length > 0) {
  console.error(`FAILED VALIDATION (${failures.length} templates with errors):`);
  failures.forEach(f => {
    console.error(`\n[x] ${f.file}:`);
    f.errors.forEach(err => console.error(`    - ${err}`));
  });
  process.exit(1);
}

console.log('SUCCESS: All templates passed validation! Repository is provider-independent and compliant.');
