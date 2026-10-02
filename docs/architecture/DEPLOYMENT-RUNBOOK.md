# Portfolio Builder — Deployment & Operations Runbook

> **Operational Runbook & Standard Operating Procedures (SOP)**  
> **Audience:** Maintainers, DevOps Engineers, and Core Contributors  
> **Applicable Version:** Phase 3 Architecture

---

## 1. Overview & Operational Principles

This runbook defines day-to-day procedures for operating Portfolio Builder's multi-shard hosting infrastructure.

### Guiding Principles:
1. **Never create a new hosting project for a single static template.** Pool templates into existing shared shards.
2. **Never request or accept contributor cloud credentials.** Contributor templates are independently hosted.
3. **Never delete a template because of a dead live preview.** Gracefully mark it as `broken` and route to GitHub source code.
4. **Always validate with scripts before merging or deploying.**

---

## 2. Standard Operating Procedures (SOP)

### SOP-01: Adding a New Shard to the Shard Registry

When a static shard reaches capacity (e.g., 1,000 templates or 500MB on GitHub Pages), create a new shard.

1. Open `deployments/shards.json`.
2. Add a new shard entry conforming to the schema:
   ```json
   "cloudflare-static-02": {
     "provider": "cloudflare-pages",
     "baseUrl": "https://static-shard-02.portfoliobuilders.pages.dev",
     "capacity": 5000,
     "strategy": "shared-static",
     "description": "Secondary Cloudflare Pages shard for technology and creative portfolios",
     "createdAt": "2026-10-02"
   }
   ```
3. Run schema validation:
   ```bash
   npm run validate
   ```
4. Commit and push the updated shard registry.

---

### SOP-02: Deploying a Shared Static Shard

#### Option A: GitHub Pages Shard (`github-pages-01`)
1. Ensure all static templates under `templates/` use strictly **relative paths** (`./style.css`, `./app.js`, `../assets/img.png`).
2. Deploy the `templates/` directory to the `gh-pages` branch using GitHub Actions:
   ```yaml
   - name: Deploy to GitHub Pages
     uses: actions/deploy-pages@v4
     with:
       artifact_name: github-pages
   ```
3. The root subpath structure is automatically accessible at:
   `https://<org>.github.io/<repo>/templates/<category>/<role>/<template-id>/`

#### Option B: Cloudflare Pages Shard (`cloudflare-static-01`)
1. Connect Cloudflare Pages to the repository or upload the static shard folder using Wrangler CLI:
   ```bash
   npx wrangler pages deploy templates --project-name static-shard-01
   ```
2. Assets are served instantly across Cloudflare's global edge network at zero hosting cost with unlimited bandwidth.

---

### SOP-03: Reviewing & Onboarding a Contributor Pull Request

When a contributor submits a PR adding a new template:

1. **Automated Verification:**
   Ensure GitHub Actions CI checks have passed:
   - Metadata format and schema validity
   - Template ID uniqueness across the catalog
   - Valid live preview URL format
2. **Local Review Checklist:**
   Checkout the PR locally and run:
   ```bash
   # 1. Validate template schema & unique IDs
   npm run validate

   # 2. Check live preview URL accessibility
   npm run validate:urls

   # 3. Test catalog compile
   npm run catalog:generate

   # 4. Verify Showcase build
   npm run showcase:build
   ```
3. **Security & Content Inspection:**
   - Confirm the live preview URL does not serve malicious scripts, cryptocurrency miners, or phishing content.
   - Confirm the template does NOT send `X-Frame-Options: DENY` or `X-Frame-Options: SAMEORIGIN` (which would prevent iframe preview rendering in the Showcase).
4. **Merge:**
   Merge the PR via GitHub. The Showcase CI workflow will automatically trigger, compile the updated `catalog/index.json`, and deploy the edge update.

---

### SOP-04: Running Automated Live URL Health Checks

To monitor the availability of all external contributor links and shared hosting shards:

```bash
# Test URL health across all templates
npm run validate:urls
```

The script sends HTTP `HEAD` / `GET` requests to every `deployment.previewUrl`.
- **Status 200 OK:** Deployment is healthy (`active`).
- **Status 404 / 500 / ETIMEDOUT:** Deployment is flagged for incident response.

---

### SOP-05: Dead URL Incident Response (Broken Contributor Links)

When a contributor's external URL becomes permanently dead (domain expired, Vercel project deleted, etc.):

1. **Locate the affected template's metadata:**
   `templates/<category>/<role>/<template-id>/template.json`
2. **Update deployment status:**
   Change `deployment.status` from `"active"` to `"broken"`:
   ```json
   "deployment": {
     "provider": "vercel",
     "strategy": "contributor-hosted",
     "previewUrl": "https://expired-portfolio.vercel.app",
     "status": "broken"
   }
   ```
3. **Recompile the catalog:**
   ```bash
   npm run catalog:generate
   ```
4. **Expected Showcase Behavior:**
   - The template remains in the catalog.
   - The preview iframe is replaced by a clear warning: *"Preview temporarily unavailable — GitHub source code verified"*.
   - The primary action button switches from *"Live Demo"* to *"View Source Code"*.
5. **Recovery Options:**
   - Contributor submits a PR with a new live URL -> status reverts to `"active"`.
   - Maintainer adopts the template, builds it, and pushes it to a shared static shard -> status updates to `"migrated"`.

---

### SOP-06: Zero-Downtime Provider Migration

To migrate a template between hosting providers (e.g., from an external contributor domain or GitHub Pages to Cloudflare Pages):

1. **Copy or verify source:** Ensure source code is present in `templates/...`.
2. **Upload/Deploy to target shard:** Ensure files are available under the target shard URL.
3. **Update `template.json`:**
   ```json
   {
     "deployment": {
       "provider": "cloudflare-pages",
       "shard": "cloudflare-static-01",
       "strategy": "shared-static",
       "path": "technology/full-stack/modern-portfolio",
       "previewUrl": "https://static-shard-01.portfoliobuilders.pages.dev/technology/full-stack/modern-portfolio/",
       "status": "active"
     }
   }
   ```
4. **Verify No ID or Showcase Route Breaks:**
   The `id` (`tech-fullstack-modern`) is permanent. Showcase bookmarks and search indexing remain 100% intact.
5. **Recompile and deploy:**
   ```bash
   npm run catalog:generate
   npm run showcase:build
   ```

---

### SOP-07: Building & Deploying the Central Showcase

1. **Full Pre-Deployment Verification:**
   ```bash
   npm run validate
   npm run catalog:generate
   npm run showcase:build
   ```
2. **Cloudflare Pages Production Deployment:**
   - Automatic: Merge to `main` branch triggers Cloudflare Pages GitHub integration.
   - Manual (CLI fallback):
     ```bash
     cd showcase
     npx @cloudflare/next-on-pages
     npx wrangler pages deploy .vercel/output/static --project-name portfoliobuilders
     ```

---

## 3. Troubleshooting & Production Pitfalls

### Pitfall 1: Iframe Fails to Load ("Refused to connect" / CSP Error)
- **Root Cause:** The target host sends an HTTP header `X-Frame-Options: SAMEORIGIN` or `Content-Security-Policy: frame-ancestors 'self'`.
- **Solution:** For templates hosted on Vercel or Netlify, ensure `headers` configuration in `vercel.json` or `netlify.toml` permits embedding:
  ```json
  {
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          { "key": "X-Frame-Options", "value": "ALLOWALL" },
          { "key": "Content-Security-Policy", "value": "frame-ancestors *" }
        ]
      }
    ]
  }
  ```

### Pitfall 2: Broken CSS/JS Assets in Subpath Deployments
- **Root Cause:** Using absolute root paths (`href="/style.css"` or `src="/app.js"`). When deployed under a shard subpath like `/templates/technology/full-stack/my-template/`, the browser looks for `/style.css` at the domain root, resulting in HTTP 404.
- **Solution:** Always use relative paths:
  ```html
  <!-- CORRECT -->
  <link rel="stylesheet" href="./style.css">
  <script src="./app.js"></script>

  <!-- INCORRECT -->
  <link rel="stylesheet" href="/style.css">
  <script src="/app.js"></script>
  ```

### Pitfall 3: Netlify Free Tier Quota Exhaustion
- **Root Cause:** Netlify provides only 300 build minutes/credits per month on the free tier. Frequent continuous deployments can exhaust credits, resulting in total site suspension.
- **Solution:** Disallow Netlify as a primary shared static host. Route all shared static workloads to Cloudflare Pages or GitHub Pages.

---

## 4. Runbook Maintenance

This document must be revised whenever:
- A new hosting provider is integrated.
- Platform free tier terms or rate limits change.
- New automated validation tooling is introduced.
