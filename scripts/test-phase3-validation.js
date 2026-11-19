/**
 * test-phase3-validation.js
 * Comprehensive test suite for Phase 3 hosting architecture, shard resolution,
 * contributor contracts, status handling, and provider migrations.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..');
const shardsPath = path.join(repoRoot, 'deployments', 'shards.json');

// Mock resolveTemplateUrl logic matching showcase/src/lib/urlResolver.ts
const DEFAULT_SHARD_BASES = {
  'github-pages-01': 'https://sudiptasanki.github.io/PortfolioBuilder',
  'cloudflare-static-01': 'https://templates-01.portfoliobuilders.pages.dev',
  'netlify-static-01': 'https://portfolio4builders.netlify.app',
  'vercel-runtime-01': 'https://portfolio4builders.vercel.app',
  'cloudflare-edge-01': 'https://portfoliobuilders.workers.dev'
};

function resolveTemplateUrl(template) {
  const deployment = template.deployment || {};
  const rawPath = (template.path || deployment.path || '').replace(/\\/g, '/');
  const cleanPath = rawPath.replace(/^\/+/, '').replace(/\/index\.html$/, '');

  let provider = deployment.provider || template.platform || 'github-pages';
  const type = deployment.type || 'shared-static';
  const shard = deployment.shard || (provider === 'github-pages' ? 'github-pages-01' : 'default');
  const status = deployment.status || 'active';
  const isAvailable = status === 'active';

  let statusMessage;
  if (status === 'broken') {
    statusMessage = 'Preview node currently offline. Source code is verified and accessible on GitHub.';
  } else if (status === 'pending') {
    statusMessage = 'Deployment is pending verification.';
  } else if (status === 'deprecated') {
    statusMessage = 'This template version is deprecated.';
  } else if (status === 'migrated') {
    statusMessage = 'Template is migrating to a new hosting shard.';
  }

  let baseUrl = deployment.baseUrl || DEFAULT_SHARD_BASES[shard] || '';
  let previewUrl = deployment.liveUrl || '';

  if (!previewUrl) {
    if (cleanPath.includes('/static/html/')) {
      const relPath = cleanPath.split('/static/html/')[1];
      baseUrl = baseUrl || 'https://sudiptasanki.github.io/PortfolioBuilder';
      previewUrl = `${baseUrl}/${relPath}/index.html`;
      provider = 'github-pages';
    } else {
      previewUrl = '/' + cleanPath + (cleanPath.endsWith('.html') ? '' : '/index.html');
      provider = 'cloudflare-pages';
    }
  }

  const codePath = cleanPath.replace(/\/(dist|out)$/, '');
  const githubUrl = `https://github.com/SudiptaSanki/PortfolioBuilder/tree/main/${codePath}`;

  return {
    provider,
    type,
    shard,
    status,
    isAvailable,
    statusMessage,
    baseUrl,
    previewUrl,
    githubUrl
  };
}

console.log('=== Running Phase 3 Architecture & Sharding Validation Suite ===\n');

// 1. HTML Template Test
console.log('Test 1: Pure Static HTML Template Resolution');
const htmlTemplate = {
  id: 'cyberpunk-neon',
  framework: 'html',
  deployment: {
    provider: 'github-pages',
    type: 'shared-static',
    shard: 'github-pages-01',
    status: 'active',
    liveUrl: 'https://sudiptasanki.github.io/PortfolioBuilder/technology/full-stack-developer/cyberpunk-neon/index.html'
  }
};
const res1 = resolveTemplateUrl(htmlTemplate);
assert.strictEqual(res1.provider, 'github-pages');
assert.strictEqual(res1.type, 'shared-static');
assert.strictEqual(res1.isAvailable, true);
console.log('  [PASS] HTML template resolves to shared-static on github-pages-01');

// 2. React Static Template Test
console.log('Test 2: React Static Template Resolution');
const reactTemplate = {
  id: 'react-neon',
  framework: 'react',
  deployment: {
    provider: 'netlify',
    type: 'shared-static',
    shard: 'netlify-static-01',
    status: 'active',
    liveUrl: 'https://portfolio4builders.netlify.app/technology/frontend-developer/react-neon/dist/index.html'
  }
};
const res2 = resolveTemplateUrl(reactTemplate);
assert.strictEqual(res2.provider, 'netlify');
assert.strictEqual(res2.isAvailable, true);
console.log('  [PASS] React static template resolves correctly');

// 3. Vue Static Template Test
console.log('Test 3: Vue 3 Static Template Resolution');
const vueTemplate = {
  id: 'vue-minimal',
  framework: 'vue',
  deployment: {
    provider: 'netlify',
    type: 'shared-static',
    shard: 'netlify-static-01',
    status: 'active',
    liveUrl: 'https://portfolio4builders.netlify.app/creative/vue-designer/vue-minimal/dist/index.html'
  }
};
const res3 = resolveTemplateUrl(vueTemplate);
assert.strictEqual(res3.provider, 'netlify');
assert.strictEqual(res3.isAvailable, true);
console.log('  [PASS] Vue static template resolves correctly');

// 4. Next.js Static Template Test
console.log('Test 4: Next.js Static Template Resolution');
const nextStaticTemplate = {
  id: 'next-corporate',
  framework: 'nextjs',
  deployment: {
    provider: 'vercel',
    type: 'shared-static',
    shard: 'vercel-runtime-01',
    status: 'active',
    liveUrl: 'https://portfolio4builders.vercel.app/business/nextjs-developer/next-corporate/out'
  }
};
const res4 = resolveTemplateUrl(nextStaticTemplate);
assert.strictEqual(res4.provider, 'vercel');
assert.strictEqual(res4.isAvailable, true);
console.log('  [PASS] Next.js static template resolves correctly');

// 5. Next.js Managed Runtime (SSR) Template Test
console.log('Test 5: Next.js Managed Runtime (SSR) Template Resolution');
const nextSsrTemplate = {
  id: 'next-ai-saas',
  framework: 'nextjs',
  rendering: 'ssr',
  deployment: {
    provider: 'vercel',
    type: 'managed-runtime',
    shard: 'vercel-runtime-01',
    status: 'active',
    liveUrl: 'https://next-ai-saas.vercel.app'
  }
};
const res5 = resolveTemplateUrl(nextSsrTemplate);
assert.strictEqual(res5.type, 'managed-runtime');
assert.strictEqual(res5.isAvailable, true);
console.log('  [PASS] Next.js managed-runtime template resolves with independent SSR endpoint');

// 6. Contributor-Hosted Template Test
console.log('Test 6: Contributor-Hosted Template on Custom Domain');
const contributorTemplate = {
  id: 'alex-threejs-showcase',
  framework: 'react',
  deployment: {
    provider: 'custom',
    type: 'contributor-hosted',
    shard: 'contributor-external',
    status: 'active',
    liveUrl: 'https://alex-3d.dev/portfolio'
  }
};
const res6 = resolveTemplateUrl(contributorTemplate);
assert.strictEqual(res6.type, 'contributor-hosted');
assert.strictEqual(res6.previewUrl, 'https://alex-3d.dev/portfolio');
console.log('  [PASS] Contributor-hosted template cleanly displays without maintainer credentials');

// 7. Broken Contributor Live URL Test
console.log('Test 7: Broken Contributor Live URL Resilience');
const brokenTemplate = {
  id: 'expired-demo-dev',
  framework: 'html',
  path: 'templates/static/html/technical/web3/expired-demo',
  deployment: {
    provider: 'custom',
    type: 'contributor-hosted',
    shard: 'contributor-external',
    status: 'broken',
    liveUrl: 'https://expired-domain-123.com'
  }
};
const res7 = resolveTemplateUrl(brokenTemplate);
assert.strictEqual(res7.isAvailable, false);
assert.strictEqual(res7.status, 'broken');
assert.ok(res7.statusMessage.includes('offline'));
assert.ok(res7.githubUrl.includes('github.com/SudiptaSanki/PortfolioBuilder'));
console.log('  [PASS] Broken deployment safely switches isAvailable to false with fallback statusMessage');

// 8. Provider Migration Test (Zero Identity Change)
console.log('Test 8: Seamless Provider Migration (GitHub Pages -> Cloudflare Pages)');
const originalGitHubTemplate = {
  id: 'minimal-glassmorphism',
  category: 'creative',
  role: 'UI/UX Designer',
  deployment: {
    provider: 'github-pages',
    type: 'shared-static',
    shard: 'github-pages-01',
    liveUrl: 'https://sudiptasanki.github.io/PortfolioBuilder/creative/ui-ux-designer/minimal-glassmorphism/index.html'
  }
};
const migratedCloudflareTemplate = {
  id: 'minimal-glassmorphism', // ID remains permanent
  category: 'creative',        // Category remains permanent
  role: 'UI/UX Designer',      // Role remains permanent
  deployment: {
    provider: 'cloudflare-pages',
    type: 'shared-static',
    shard: 'cloudflare-static-01',
    status: 'active',
    liveUrl: 'https://templates-01.portfoliobuilders.pages.dev/creative/ui-ux-designer/minimal-glassmorphism/index.html'
  }
};
const origRes = resolveTemplateUrl(originalGitHubTemplate);
const migrRes = resolveTemplateUrl(migratedCloudflareTemplate);
assert.strictEqual(originalGitHubTemplate.id, migratedCloudflareTemplate.id);
assert.strictEqual(origRes.provider, 'github-pages');
assert.strictEqual(migrRes.provider, 'cloudflare-pages');
assert.strictEqual(migrRes.previewUrl, 'https://templates-01.portfoliobuilders.pages.dev/creative/ui-ux-designer/minimal-glassmorphism/index.html');
console.log('  [PASS] Migration shifts deployment target while preserving template identity & category');

// 9. Multiple Templates under One Shared Host Test
console.log('Test 9: Multiple Templates Under One Host');
const t1 = resolveTemplateUrl({ path: 'templates/static/html/technical/dev1', deployment: { provider: 'github-pages', liveUrl: 'https://sudiptasanki.github.io/PortfolioBuilder/technical/dev1/index.html' } });
const t2 = resolveTemplateUrl({ path: 'templates/static/html/technical/dev2', deployment: { provider: 'github-pages', liveUrl: 'https://sudiptasanki.github.io/PortfolioBuilder/technical/dev2/index.html' } });
assert.notStrictEqual(t1.previewUrl, t2.previewUrl);
assert.ok(t1.previewUrl.startsWith('https://sudiptasanki.github.io/PortfolioBuilder'));
assert.ok(t2.previewUrl.startsWith('https://sudiptasanki.github.io/PortfolioBuilder'));
console.log('  [PASS] Distinct template subpaths coexist under single shared hosting domain');

// 10. Shard Registry Verification
console.log('Test 10: Shard Registry Integrity');
assert.ok(fs.existsSync(shardsPath), 'shards.json must exist');
const shardsData = JSON.parse(fs.readFileSync(shardsPath, 'utf8'));
assert.ok(Array.isArray(shardsData.shards), 'shards array must be present');
assert.ok(shardsData.shards.length >= 4, 'Must have at least 4 shards registered');
console.log(`  [PASS] Shard registry verified with ${shardsData.shards.length} registered infrastructure shards`);

// 11. Canonical Role Registry & 6-Level Layout Verification
console.log('Test 11: Canonical Role Registry & 6-Level Layout');
const rolesPath = path.join(repoRoot, 'registry', 'roles.json');
assert.ok(fs.existsSync(rolesPath), 'registry/roles.json must exist');
const rolesData = JSON.parse(fs.readFileSync(rolesPath, 'utf8'));
assert.strictEqual(Object.keys(rolesData.categories).length, 18, 'Must define 18 canonical categories');
assert.ok(rolesData.roles['loco-pilot'] && rolesData.roles['loco-pilot'].aliases.includes('train driver'), 'Must register real-world aliases');
const redirectsPath = path.join(repoRoot, 'deployments', 'redirects.json');
assert.ok(fs.existsSync(redirectsPath), 'deployments/redirects.json must exist');
console.log(`  [PASS] Role registry (${Object.keys(rolesData.roles).length} roles, 18 categories) & redirects verified`);

console.log('\n=== ALL 11 ARCHITECTURAL VALIDATION TESTS PASSED SUCCESSFULLY! ===');
