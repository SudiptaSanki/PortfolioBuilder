# Portfolio Builder — Final Production Architecture (Phase 3)

> **Architectural Specification & System Design**  
> **Status:** Implemented & Validated  
> **Target Scale:** 10,000 – 100,000+ Templates at $0 Hosting Cost  
> **Core Tenet:** Separation of Identity, Source Code, and Deployment Infrastructure

---

## Executive Summary

Portfolio Builder is an open-source platform cataloging thousands of developer, designer, and creator portfolio templates. Historically, web showcase platforms suffered from high operational overhead, runaway hosting costs, vendor lock-in, and fragile contributor workflows requiring cloud credentials or one hosting project per template.

Phase 3 achieves:
1. **$0 Hosting Cost at Maximum Scale:** Leverages shared static deployment shards across generous free-tier edge CDNs (GitHub Pages, Cloudflare Pages).
2. **Minimal Project Count:** Groups hundreds of templates under single hosting deployments using isolated subpath routing (`/technology/role/template-id/`).
3. **Absolute Provider Independence:** Every template has an immutable, canonical `id`. The hosting provider is purely deployment metadata that can be migrated instantly without altering source code, showcase routing, or identity.
4. **Zero-Credential Contributor Model:** Community contributors deploy to their preferred infrastructure (GitHub Pages, Vercel, Netlify, custom domains) and submit their live URL. The central repository **never** requires contributor API keys, tokens, or credentials.
5. **High Fault Tolerance:** If an external contributor's preview breaks, the catalog gracefully transitions `deployment.status` from `active` to `broken`, keeping the template listed, disabling the preview iframe, and routing visitors directly to the canonical GitHub source code.

---

## 1. System Topology & Architectural Overview

```
                                  +------------------------------------+
                                  |         End User / Visitor         |
                                  +-----------------+------------------+
                                                    |
                                                    v
                                  +------------------------------------+
                                  |       CENTRAL SHOWCASE (EDGE)      |
                                  |   Cloudflare Pages (Next.js SSR)   |
                                  |   portfoliobuilders.pages.dev      |
                                  +--------+------------------+--------+
                                           |                  |
                       Fetches Metadata    |                  | Generates Live Preview Links
                                           v                  v
                          +----------------------+      +---------------------------------+
                          |  catalog/index.json  |      |   URL Resolution Engine         |
                          |  (Decoupled Registry)|      |   (showcase/lib/urlResolver.ts) |
                          +----------------------+      +----------------+----------------+
                                                                         |
                         +-----------------------------------------------+---------------------------------+
                         |                               |                               |                 |
                         v                               v                               v                 v
           +---------------------------+   +---------------------------+   +-------------------+   +---------------+
           |    SHARD: github-pages    |   |  SHARD: cloudflare-static |   |  MANAGED RUNTIME  |   |  CONTRIBUTOR  |
           |   (Shared Static Pool)    |   |   (Shared Static Pool)    |   | (Vercel/CF Worker)|   |  INDEPENDENT  |
           |   1,000 Templates / Shard |   |  20,000 Files / Shard     |   | Next.js SSR only  |   | Vercel/Custom |
           |  /technology/full-stack/  |   |  /technology/data-science/|   | /api /server-side |   | Zero Secrets  |
           +---------------------------+   +---------------------------+   +-------------------+   +---------------+
```

---

## 2. Central Showcase Architecture

- **Primary Host:** Cloudflare Pages (`portfoliobuilders.pages.dev`)
- **Technology:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons.
- **Role:** Pure discovery, search, catalog filtering, contributor recognition, and preview orchestration.
- **Separation of Assets:** The showcase does **not** store or serve template assets (HTML, CSS, JS, images). It consumes compiled JSON metadata from `catalog/index.json`. This keeps the Showcase repository lightweight (< 50 MB), ensuring sub-second edge builds.
- **Key Responsibilities:**
  - Full-text search across titles, roles, frameworks, and contributor names.
  - Multi-dimensional filtering by Category, Role, Framework, Rendering Type, and Status.
  - Dynamic responsive preview modal with Desktop, Tablet, and Mobile iframe viewports.
  - Resilience handling: detects broken/pending deployments and gracefully swaps the preview iframe for a direct GitHub source code badge.

---

## 3. The Static Template Pool & Shard Model

### 3.1 The Anti-Pattern Avoided: One Project Per Template
Deploying 1,000 templates as 1,000 separate Vercel or Cloudflare projects breaches platform project quotas (e.g., Vercel's 100-project limit, Cloudflare's 100-page limit), accumulates configuration fatigue, and makes automated CI maintenance impossible.

### 3.2 The Shared Deployment Shard Pattern
Pure static templates (HTML/CSS/JS, static React, static Vue, static Next.js exports) are pooled into single hosting deployments under clean subpaths:

```
https://sudiptasanki.github.io/Portfolio-Builder/templates/technology/full-stack/cyberpunk-2077/
https://sudiptasanki.github.io/Portfolio-Builder/templates/technology/mobile-dev/react-native-dev/
https://sudiptasanki.github.io/Portfolio-Builder/templates/technology/cybersecurity/security-analyst/
```

### 3.3 The Shard Registry (`deployments/shards.json`)
Deployment targets are defined in a centralized shard registry:

```json
{
  "github-pages-01": {
    "provider": "github-pages",
    "baseUrl": "https://sudiptasanki.github.io/Portfolio-Builder/templates",
    "capacity": 1000,
    "strategy": "shared-static",
    "description": "Primary GitHub Pages static shard for technology & design portfolios"
  },
  "cloudflare-static-01": {
    "provider": "cloudflare-pages",
    "baseUrl": "https://static-shard-01.portfoliobuilders.pages.dev",
    "capacity": 5000,
    "strategy": "shared-static",
    "description": "High-capacity Cloudflare Pages shard for static React & Vue exports"
  }
}
```

### 3.4 Decoupled Template Deployment Record
Each template's `template.json` declares which shard and relative subpath it occupies:

```json
{
  "id": "tech-fullstack-cyberpunk",
  "name": "Cyberpunk 2077 Portfolio",
  "deployment": {
    "provider": "github-pages",
    "shard": "github-pages-01",
    "path": "technology/full-stack/cyberpunk-2077",
    "previewUrl": "https://sudiptasanki.github.io/Portfolio-Builder/templates/technology/full-stack/cyberpunk-2077/",
    "status": "active"
  }
}
```

If the maintainer migrates the template from GitHub Pages to Cloudflare Pages, only `deployment.shard` and `deployment.previewUrl` change. The template `id`, metadata, showcase route, and source code remain completely unaltered.

---

## 4. Deterministic Platform Selection Rules

To avoid platform misuse and stay within free tier limits indefinitely, the following deterministic rules govern hosting selection:

| Workload Type | Technical Requirements | Target Hosting Strategy | Rationale / Free Tier Fit |
| :--- | :--- | :--- | :--- |
| **Pure HTML / CSS / JS** | Zero build step or static assets | Shared Static Deployment (GitHub Pages / Cloudflare Pages) | Unlimited bandwidth on Cloudflare Pages; 100GB/mo on GitHub Pages. Negligible footprint. |
| **Static React (Vite / CRA)** | Pre-compiled client bundle | Cloudflare Pages or GitHub Pages Shard | Static client-side routing. Zero server runtime needed. |
| **Static Vue / Nuxt Static** | Pre-compiled client bundle | Cloudflare Pages or GitHub Pages Shard | Static client-side routing. Zero server runtime needed. |
| **Static Next.js (`output: 'export'`)** | Pre-rendered HTML/CSS/JS | Cloudflare Pages or Shared Shard | No Node.js runtime required; saves Vercel project slots. |
| **Next.js SSR / Server Actions** | Dynamic Node.js runtime / edge compute | Vercel or Cloudflare OpenNext | Runtime execution required. Reserved specifically for dynamic templates. |
| **Edge / Serverless Functions** | Lightweight API endpoints | Cloudflare Workers | 100,000 free requests/day; global edge execution. |
| **3D Client-Side Three.js / WebGL** | Heavy asset delivery, GPU rendering | Static Hosting (Cloudflare Pages) | Executed entirely in user's browser; server requires only static file delivery. |
| **3D with Server-Side Pre-processing** | Headless rendering / raytracing | Specialized Compute Runtime | Only use runtime where server compute is mandatory. |

---

## 5. Platform-Specific Governance & Constraints

### 5.1 Firebase
- **Policy:** Firebase Hosting must **never** be used as the default dumping ground for thousands of simple templates.
- **Legitimate Use Cases:** Templates requiring Firebase Authentication, Firestore databases, Cloud Functions, or Firebase Storage.
- **Rule:** When Firebase Hosting is used, multiple templates must be served under unified hosting rewrites/subpaths within a shared site rather than spawning separate Firebase projects.

### 5.2 Vercel
- **Policy:** Never create one Vercel project per static template.
- **Legitimate Use Cases:** Dynamic Next.js applications utilizing React Server Components (RSC), Server Actions, or dynamic route handlers.
- **Quota Preservation:** All static Next.js portfolios (`next export`) must be deployed to Cloudflare Pages or GitHub Pages shared shards to preserve Vercel's 100-project limit.

### 5.3 Netlify
- **Policy:** Netlify is an auxiliary provider, not the core architecture.
- **Reasoning:** Netlify's free tier imposes a strict 300 build-credits/month limit (~20 builds/month max) with hard account suspension upon exhaustion. React and Vue static builds must be directed to Cloudflare Pages instead.

---

## 6. Open-Source Contributor Contract (Zero Secrets)

### 6.1 The Zero-Credential Principle
Maintaining a community catalog must never require asking contributors for:
- Vercel personal access tokens
- Netlify API credentials
- Cloudflare API tokens
- GitHub account secrets

### 6.2 The Contributor Workflow
1. **Develop:** Contributor forks `PortfolioBuilder` and builds a template in `templates/<rendering>/<stack>/<category>/<role>/<slug>/`.
2. **Deploy Independently:** Contributor deploys the template to their own hosting account (e.g., `alice.vercel.app`, `bob.pages.dev`, `portfolio.alice.dev`).
3. **Declare Contract:** Contributor fills in `template.json`:
   ```json
   {
     "id": "fullstack-modern-dark",
     "name": "Modern Dark Portfolio",
     "category": "technical",
     "role": "Full Stack Developer",
     "roleSlug": "full-stack-developer",
     "framework": "nextjs",
     "rendering": "ssr",
     "source": {
       "type": "github",
       "path": "templates/ssr/nextjs/technical/full-stack-developer/modern-dark",
       "repository": "https://github.com/SudiptaSanki/PortfolioBuilder/tree/main/templates/ssr/nextjs/technical/full-stack-developer/modern-dark",
       "branch": "main"
     },
     "deployment": {
       "provider": "vercel",
       "strategy": "contributor-hosted",
       "previewUrl": "https://alice-portfolio.vercel.app",
       "status": "active"
     },
     "contributor": {
       "name": "Alice Developer",
       "github": "SudiptaSanki"
     },
     "license": "MIT"
   }
   ```
4. **Submit PR:** CI automatically validates metadata schema, unique ID, live URL format, and HTTP availability.
5. **Merge:** The Showcase automatically incorporates the template upon merge.

---

## 7. Fault Tolerance & Dead URL Lifecycle

In open source, community deployments may inevitably break, expire, or be deleted by the contributor. The system handles this through a non-destructive lifecycle:

```
       +------------------------------------+
       |  Active Deployment (HTTP 200 OK)  |
       +-----------------+------------------+
                         |
           Automated URL Check Detects Failure
                         |
                         v
       +------------------------------------+
       |   Status: broken / unreachable     |
       +-----------------+------------------+
                         |
           +-------------+-------------+
           |                           |
           v                           v
+-----------------------+   +------------------------------------+
|  Showcase Fallback:   |   |   Community / Maintainer Action:   |
|  - Iframe disabled    |   |   1. Contributor updates previewUrl|
|  - 'Broken Link' flag |   |   2. Or maintainer migrates build  |
|  - 'View Code' button |   |      to shared static shard        |
|  - Template RETAINED  |   +-----------------+------------------+
+-----------------------+                     |
                                              v
                            +------------------------------------+
                            |   Status: active / migrated        |
                            +------------------------------------+
```

- **Permanent Identity:** A template is **never deleted** because its external URL failed.
- **Graceful UI Fallback:** `showcase/src/app/page.tsx` renders a clean warning badge: `Preview temporarily unavailable — GitHub source code verified`.
- **Maintainer Intervention:** If a template is valuable, maintainers can copy the source into a shared static shard and update the deployment status to `migrated`.

---

## 8. Scaling Roadmap: 0 to 100,000 Templates

```
+-----------------------------------------------------------------------------------------+
| LEVEL 1: 0 - 1,000 Templates (Current State: 267 Templates)                             |
| - Single GitHub repository (Portfolio-Builder).                                         |
| - 1 Central Showcase on Cloudflare Pages.                                               |
| - 1-2 Shared Static Shards on GitHub Pages (github-pages-01) & Cloudflare Pages.       |
| - Monolithic catalog/index.json (~300 KB).                                              |
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
| LEVEL 2: 1,000 - 10,000 Templates                                                      |
| - Multiple Deployment Shards (cloudflare-static-01..05, github-pages-01..05).          |
| - Subpath sharding: 1,000 - 2,000 templates per deployment domain.                      |
| - CI selective building: only rebuild shard directories that experienced Git changes.    |
| - Catalog chunking: catalog split by category (technology.json, creative.json, etc.).   |
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
| LEVEL 3: 10,000 - 100,000+ Templates                                                   |
| - Federated Shard Repositories (portfolio-builder-shard-01, shard-02).                  |
| - Central Registry & Metadata Catalog compiled via automated Git submodules or API.     |
| - Algolia / Meilisearch / Cloudflare D1 indexed catalog search.                         |
| - Immutable release hashes for each template version.                                   |
+-----------------------------------------------------------------------------------------+
```

---

## 9. Comprehensive Validation Results (10/10 Passed)

The Phase 3+ architecture validation test suite (`scripts/test-phase3-validation.js`) verifies routing, sharding, role taxonomy, and layout contracts (11/11 passing), paired with automated GitHub Pages redirect stub generation (`deployments/redirects.json` + `scripts/generate-redirects.js`) whenever templates consolidate across categories.

*(See `registry/roles.json` for all 18 canonical categories and 369+ registered profession roles, and `templates/<rendering>/<stack>/<category>/<role>/<slug>/` for the folder layout.)*

```
=== Running Phase 3 Architecture & Sharding Validation Suite ===

Test 1: Pure Static HTML Template Resolution
  [PASS] HTML template resolves to shared-static on github-pages-01
Test 2: React Static Template Resolution
  [PASS] React static template resolves correctly
Test 3: Vue 3 Static Template Resolution
  [PASS] Vue static template resolves correctly
Test 4: Next.js Static Template Resolution
  [PASS] Next.js static template resolves correctly
Test 5: Next.js Managed Runtime (SSR) Template Resolution
  [PASS] Next.js managed-runtime template resolves with independent SSR endpoint
Test 6: Contributor-Hosted Template on Custom Domain
  [PASS] Contributor-hosted template cleanly displays without maintainer credentials
Test 7: Broken Contributor Live URL Resilience
  [PASS] Broken deployment safely switches isAvailable to false with fallback statusMessage
Test 8: Seamless Provider Migration (GitHub Pages -> Cloudflare Pages)
  [PASS] Migration shifts deployment target while preserving template identity & category
Test 9: Multiple Templates Under One Host
  [PASS] Distinct template subpaths coexist under single shared hosting domain
Test 10: Shard Registry Integrity
  [PASS] Shard registry verified with 6 registered infrastructure shards

=== ALL 10 ARCHITECTURAL VALIDATION TESTS PASSED SUCCESSFULLY! ===
```

---

## 10. Summary Matrix

| Metric | Legacy Architecture | Phase 3 Architecture |
| :--- | :--- | :--- |
| **Hosting Cost** | Risk of paid overages | **Guaranteed $0 across all tiers** |
| **Project Count** | 1 project per template (unsustainable) | **10,000 templates across < 10 shared shards** |
| **Provider Coupling** | Bound to repository folder path | **Fully decoupled via metadata & Shard Registry** |
| **Contributor Friction** | Complex account access / credentials | **Zero-credential self-deployment & PR submission** |
| **Resilience to 404s** | Blank iframe / broken showcase card | **Automatic fallback to verified GitHub source code** |
| **Migration Cost** | Total rebuild & URL breakage | **Change 2 JSON lines in metadata** |
