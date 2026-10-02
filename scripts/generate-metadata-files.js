/**
 * generate-metadata-files.js
 * Generates canonical template.json files for all 267 templates in the repository.
 * Run once to seed template.json in each template folder.
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const catalogPath = path.join(repoRoot, 'showcase', 'src', 'data', 'templates.json');

if (!fs.existsSync(catalogPath)) {
  console.error(`Catalog not found: ${catalogPath}`);
  process.exit(1);
}

const templates = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
console.log(`Loaded ${templates.length} templates from ${catalogPath}`);

let createdCount = 0;
let updatedCount = 0;

for (const t of templates) {
  const rawPath = (t.path || '').replace(/\\/g, '/');
  // Determine template root directory on disk
  let templateDir = path.join(repoRoot, rawPath.replace(/\/(dist|out)$/, ''));
  
  if (!fs.existsSync(templateDir)) {
    // If not found without dist/out, try full rawPath
    templateDir = path.join(repoRoot, rawPath);
  }

  if (!fs.existsSync(templateDir)) {
    console.warn(`Template directory not found on disk: ${templateDir}`);
    continue;
  }

  // Determine framework & rendering
  const stack = (t.stack || '').toLowerCase();
  let framework = 'html';
  let rendering = 'static';
  let languages = ['html', 'css', 'javascript'];

  if (stack.includes('react') || rawPath.includes('/react/')) {
    framework = 'react';
    rendering = 'static';
    languages = ['javascript', 'jsx'];
  } else if (stack.includes('vue') || rawPath.includes('/vue/')) {
    framework = 'vue';
    rendering = 'spa';
    languages = ['typescript', 'vue'];
  } else if (stack.includes('next') || rawPath.includes('/nextjs/')) {
    framework = 'nextjs';
    rendering = 'static';
    languages = ['typescript', 'react'];
  }

  // Determine deployment info
  let provider = 'github-pages';
  let deployType = 'shared-static';
  let shard = 'github-pages-01';
  let baseUrl = 'https://sudiptasanki.github.io/PortfolioBuilder';
  let subPath = '';
  let liveUrl = '';

  const cleanPath = rawPath.replace(/^\/+/, '').replace(/\/index\.html$/, '');

  if (cleanPath.includes('/github-pages/')) {
    provider = 'github-pages';
    deployType = 'shared-static';
    shard = 'github-pages-01';
    baseUrl = 'https://sudiptasanki.github.io/PortfolioBuilder';
    subPath = cleanPath.split('/github-pages/')[1];
    liveUrl = `${baseUrl}/${subPath}/index.html`;
  } else if (cleanPath.includes('/netlify/')) {
    provider = 'netlify';
    deployType = 'shared-static';
    shard = 'netlify-01';
    baseUrl = 'https://portfolio4builders.netlify.app';
    subPath = cleanPath.split('/netlify/')[1];
    liveUrl = `${baseUrl}/${subPath}/index.html`;
  } else if (cleanPath.includes('/vercel/')) {
    provider = 'vercel';
    deployType = 'shared-static';
    shard = 'vercel-01';
    baseUrl = 'https://portfolio4builders.vercel.app';
    subPath = cleanPath.split('/vercel/')[1];
    liveUrl = `${baseUrl}/${subPath}`;
  }

  const relativeSourcePath = path.relative(repoRoot, templateDir).replace(/\\/g, '/');

  const formatRole = (r, sub) => {
    if (r && r.trim()) return r.trim();
    if (sub && sub.trim()) {
      return sub.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    return 'Professional';
  };

  const metadata = {
    $schema: 'https://portfoliobuilders.dev/schemas/template-v1.json',
    id: t.id,
    name: t.name,
    category: t.category,
    role: formatRole(t.role, t.subcategory),
    subcategory: t.subcategory || '',
    framework: framework,
    stack: t.stack || (framework === 'html' ? 'HTML/CSS/JS' : framework),
    theme: t.theme || 'Custom Theme',
    language: languages,
    rendering: rendering,
    tags: t.tags || [],
    description: t.description || '',
    source: {
      path: relativeSourcePath,
      entry: 'index.html'
    },
    deployment: {
      provider: provider,
      type: deployType,
      shard: shard,
      baseUrl: baseUrl,
      path: subPath,
      liveUrl: liveUrl
    },
    preview: {
      image: t.preview || t.thumbnail || ''
    },
    contributor: {
      name: t.author || 'PortfolioBuilder Core',
      github: 'SudiptaSanki'
    }
  };

  const targetFile = path.join(templateDir, 'template.json');
  const exists = fs.existsSync(targetFile);
  fs.writeFileSync(targetFile, JSON.stringify(metadata, null, 2) + '\n', 'utf8');

  if (exists) {
    updatedCount++;
  } else {
    createdCount++;
  }
}

console.log(`Metadata generation complete! Created: ${createdCount}, Updated: ${updatedCount}`);
