/**
 * validate-templates.js
 * Automated validation system for Portfolio Builder templates.
 * Enforces canonical 6-level layout, registry/roles.json taxonomy, metadata standards,
 * asset path safety, customization 3D/CSS-token safety guards, and unique identifiers.
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const templatesRoot = path.join(repoRoot, 'templates');
const rolesRegistryPath = path.join(repoRoot, 'registry', 'roles.json');

if (!fs.existsSync(rolesRegistryPath)) {
  console.error(`FATAL: Canonical role registry missing at ${rolesRegistryPath}`);
  process.exit(1);
}

const rolesRegistry = JSON.parse(fs.readFileSync(rolesRegistryPath, 'utf8'));
const ALLOWED_CATEGORIES = Object.keys(rolesRegistry.categories || {});
const REGISTERED_ROLES = rolesRegistry.roles || {};

const ALLOWED_FRAMEWORKS = ['html', 'react', 'vue', 'nextjs', 'astro', 'svelte', 'vanilla'];
const ALLOWED_RENDERING = ['static', 'ssr', 'edge'];
const ALLOWED_DEPLOY_TYPES = ['shared-static', 'contributor-hosted', 'managed-runtime', 'edge-runtime', 'external'];
const ALLOWED_PROVIDERS = ['github-pages', 'cloudflare-pages', 'vercel', 'netlify', 'custom', 'external'];
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
        if (framework !== 'html' && entry.name === 'index.html' && dir === templateDir) {
          continue;
        }
        filesToScan.push(full);
      }
    }
  }

  gatherHtml(templateDir);

  const absoluteRegex = /(?:href|src)=["'](\/[^"'/][^"']*)["']/g;

  for (const htmlFile of filesToScan) {
    try {
      const content = fs.readFileSync(htmlFile, 'utf8');
      let match;
      while ((match = absoluteRegex.exec(content)) !== null) {
        const foundPath = match[1];
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

function checkCustomizationSafety(templateDir, data) {
  const errors = [];
  const cust = data.customization;
  if (!cust || cust.enabled !== true) return errors;

  if (data.framework !== 'html' && cust.allowFramework !== true) {
    errors.push("customization.enabled=true is restricted to static HTML/CSS templates.");
  }

  const threePattern = /three(?:\.min)?\.js|THREE\.|getContext\(['"]webgl|glsl|shader/i;
  let declaredVars = new Set(
    Object.values(cust.tokens || {}).map((t) => (typeof t === 'string' ? t : t?.var)).filter(Boolean)
  );
  const foundCssVars = new Set();
  const varDefRe = /(--[a-zA-Z0-9_-]+)\s*:/g;

  function scanDir(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['node_modules', '.git'].includes(entry.name)) scanDir(full);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!['.html', '.css', '.js'].includes(ext)) continue;
      const content = fs.readFileSync(full, 'utf8');
      if ((ext === '.html' || ext === '.js') && threePattern.test(content)) {
        errors.push(`customization.enabled=true forbidden on 3D/WebGL/shader template (${entry.name})`);
      }
      if (ext === '.css' || ext === '.html') {
        let m;
        varDefRe.lastIndex = 0;
        while ((m = varDefRe.exec(content)) !== null) {
          foundCssVars.add(m[1]);
        }
      }
    }
  }
  scanDir(templateDir);

  for (const v of declaredVars) {
    if (!foundCssVars.has(v)) {
      errors.push(`customization token '${v}' not defined in template CSS/HTML`);
    }
  }

  return errors;
}

console.log('--- Starting Portfolio Builder Template Validation ---');
const metadataFiles = findMetadataFiles(templatesRoot);
console.log(`Discovered ${metadataFiles.length} template.json files.\n`);

if (metadataFiles.length === 0) {
  console.error('FATAL: No template.json files found!');
  process.exit(1);
}

const seenIds = new Map();
const seenRolesToCats = new Map();
const failures = [];
let passCount = 0;

for (const filePath of metadataFiles) {
  const relFilePath = path.relative(repoRoot, filePath).replace(/\\/g, '/');
  const templateDir = path.dirname(filePath);
  const relDir = path.relative(repoRoot, templateDir).replace(/\\/g, '/');
  const parts = relDir.split('/');
  const templateErrors = [];

  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    failures.push({ file: relFilePath, errors: [`JSON Parse Error: ${err.message}`] });
    continue;
  }

  // 0. Canonical 6-level folder structure check: templates/<rendering>/<stack>/<category>/<role>/<slug>
  if (parts.length !== 6 || parts[0] !== 'templates') {
    templateErrors.push(`Invalid layout depth '${relDir}'. Expected 'templates/<rendering>/<stack>/<category>/<role>/<slug>'.`);
  } else {
    const [, dirRendering, dirStack, dirCat, dirRole, dirSlug] = parts;
    if (!ALLOWED_RENDERING.includes(dirRendering)) {
      templateErrors.push(`Invalid layout rendering folder '${dirRendering}'`);
    }
    if (!ALLOWED_FRAMEWORKS.includes(dirStack)) {
      templateErrors.push(`Invalid layout stack folder '${dirStack}'`);
    }
    if (data.rendering && dirRendering !== data.rendering) {
      templateErrors.push(`Folder rendering '${dirRendering}' disagrees with template.json rendering '${data.rendering}'`);
    }
    if (data.framework && dirStack !== data.framework) {
      templateErrors.push(`Folder stack '${dirStack}' disagrees with template.json framework '${data.framework}'`);
    }
    if (data.category && dirCat !== data.category) {
      templateErrors.push(`Folder category '${dirCat}' disagrees with template.json category '${data.category}'`);
    }
    const roleSlug = data.roleSlug || dirRole;
    if (dirRole !== roleSlug) {
      templateErrors.push(`Folder role '${dirRole}' disagrees with roleSlug '${roleSlug}'`);
    }
    if (!/^[a-z0-9-]+$/.test(dirSlug)) {
      templateErrors.push(`Invalid folder slug '${dirSlug}': must be lowercase alphanumeric with hyphens`);
    }
    // Enforce canonical role registry for all non-festival templates
    if (dirCat !== 'festival') {
      const regRole = REGISTERED_ROLES[dirRole];
      if (!regRole) {
        templateErrors.push(`Unregistered role slug '${dirRole}'. Register it in registry/roles.json first.`);
      } else if (regRole.category !== dirCat) {
        templateErrors.push(`Role '${dirRole}' belongs in '${regRole.category}' per registry/roles.json, not '${dirCat}'`);
      }
      if (seenRolesToCats.has(dirRole) && seenRolesToCats.get(dirRole) !== dirCat) {
        templateErrors.push(`Split role '${dirRole}' appears in both '${seenRolesToCats.get(dirRole)}' and '${dirCat}'`);
      } else {
        seenRolesToCats.set(dirRole, dirCat);
      }
    }
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
  if (!data.source || !data.source.path) {
    templateErrors.push("Missing 'source.path'");
  } else {
    if (data.source.path.replace(/\\/g, '/').replace(/\/+$/, '') !== relDir) {
      templateErrors.push(`'source.path' ('${data.source.path}') does not match directory ('${relDir}')`);
    }
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

  // 7. Opt-in Customization Safety Check
  templateErrors.push(...checkCustomizationSafety(templateDir, data));

  if (templateErrors.length > 0) {
    failures.push({ file: relFilePath, errors: templateErrors });
  } else {
    passCount++;
  }
}

console.log(`Validation Results:`);
console.log(`  Passed: ${passCount} templates`);
console.log(`  Failed: ${failures.length} templates`);

if (failures.length > 0) {
  console.error('\nValidation Failures Found:');
  for (const f of failures.slice(0, 20)) {
    console.error(`\n[FAIL] ${f.file}`);
    for (const e of f.errors) {
      console.error(`  - ${e}`);
    }
  }
  if (failures.length > 20) {
    console.error(`\n... and ${failures.length - 20} more files with errors.`);
  }
  process.exit(1);
}

console.log('\nSUCCESS: All templates passed validation! Layout, role registry, and safety rules verified.');
