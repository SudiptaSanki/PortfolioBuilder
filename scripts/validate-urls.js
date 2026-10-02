/**
 * validate-urls.js
 * Live preview URL health-checker for Portfolio Builder.
 * Validates accessibility of template live preview URLs without blocking offline development.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const repoRoot = path.resolve(__dirname, '..');
const catalogPath = path.join(repoRoot, 'showcase', 'src', 'data', 'templates.json');

if (!fs.existsSync(catalogPath)) {
  console.error('Catalog not found. Run npm run catalog:generate first.');
  process.exit(1);
}

const templates = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

function checkUrl(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const client = parsed.protocol === 'https:' ? https : http;
      
      const req = client.request(url, { method: 'HEAD', timeout: timeoutMs, headers: { 'User-Agent': 'PortfolioBuilder-HealthChecker/1.0' } }, (res) => {
        // If 2xx or 3xx, consider reachable
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve({ ok: true, status: res.statusCode });
        } else {
          resolve({ ok: false, status: res.statusCode, error: `HTTP ${res.statusCode}` });
        }
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, error: 'Request Timeout' });
      });

      req.on('error', (err) => {
        resolve({ ok: false, error: err.message });
      });

      req.end();
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

async function runUrlHealthCheck() {
  console.log(`Starting Live URL Health Check for ${templates.length} templates...`);
  console.log('Sample check on first 10 templates (run with --all to test all):\n');

  const isAll = process.argv.includes('--all');
  const targetTemplates = isAll ? templates : templates.slice(0, 10);

  let successCount = 0;
  let failCount = 0;

  for (const t of targetTemplates) {
    const url = t.deployment?.liveUrl;
    if (!url) {
      console.log(`[-] ${t.id}: No liveUrl specified`);
      failCount++;
      continue;
    }

    process.stdout.write(`Checking ${t.id} (${url})... `);
    const result = await checkUrl(url);
    if (result.ok) {
      console.log(`OK (${result.status})`);
      successCount++;
    } else {
      console.log(`FAIL (${result.error})`);
      failCount++;
    }
  }

  console.log(`\nURL Check Completed: ${successCount} reachable, ${failCount} issues.`);
}

runUrlHealthCheck();
