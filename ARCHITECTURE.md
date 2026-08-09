# Distributed Architecture Plan: Scaling to 100k Free Portfolios

This document outlines the strategic architecture for building, hosting, and distributing up to 100,000 portfolio websites while remaining **100% free** by intelligently load-balancing across the generous free tiers of Vercel, Cloudflare, Netlify, Firebase, and GitHub.

## 1. Core Architecture Strategy: "The Directory & Node Model"

To prevent hitting the limits of any single platform, we are adopting a decoupled architecture:
*   **The Directory (Main Showcase Repo):** The central `PortfolioBuilder` website. This acts as the storefront/catalog. It is extremely lightweight because it stores no images and contains no individual template logic.
*   **The Nodes (Individual Templates):** Each template (or small batch of templates) is deployed as its own standalone project across various platforms. The Directory simply links out to these Node subdomains (e.g., `template104.vercel.app`, `vue-portfolio.netlify.app`).
*   **The CDN (Assets Repo):** All heavy assets (images, 3D models, fonts) live in the `Assets` repository and are served directly via GitHub's Raw CDN or jsDelivr, ensuring our hosting providers never waste bandwidth serving static media.

## 2. Platform Distribution & Specialization

We will assign templates to platforms based on their technological strengths and free-tier limits:

### 🟢 Vercel (Next.js & React ecosystem)
*   **Role:** The premier host for complex Next.js templates.
*   **Usage:** Any portfolio template utilizing Next.js (App/Pages router), Server Actions, or complex React state.
*   **Why:** Vercel is built for Next.js. Deploying individual Next.js templates as separate Vercel projects gives each template its own 100GB bandwidth limit and edge execution pool.

### 🟠 Cloudflare Pages & Workers (Edge SSR, 3D & High Traffic)
*   **Role:** The powerhouse for SSR, HTML/CSS/JS native templates, and heavy 3D WebGL experiences (like Three.js/React Three Fiber).
*   **Usage:** Lightweight vanilla templates, Astro, or Next.js Edge-only templates.
*   **Why:** Cloudflare provides unlimited bandwidth and exceptional global edge caching. It excels at delivering heavy 3D assets rapidly without hitting billing walls. 

### 🔵 Netlify (Vue, Nuxt & Vite-based SPAs)
*   **Role:** The host for Vue.js, SvelteKit, and standard Vite single-page applications.
*   **Usage:** Vue/Nuxt portfolio templates, Svelte projects, and basic Vite React apps.
*   **Why:** Netlify's build systems handle Vue and Nuxt Exceptionally well, diversifying our deployment platforms so we don't put all eggs in the Vercel/Cloudflare baskets.

### 🟡 Firebase (Backend, Auth & Realtime Data)
*   **Role:** The database and backend engine for dynamic portfolios.
*   **Usage:** Templates that require contact forms, live visitor counters, authentication, CMS data, or real-time chat features.
*   **Why:** Firebase's Spark Plan provides generous Firestore document reads/writes. Multiple portfolio projects can connect to the same Firebase instance, or we can programmatically spin up new Firebase projects as we scale.

### ⚪ GitHub (Asset CDN & Static Pages)
*   **Role:** The decentralized asset manager and static HTML host.
*   **Usage:** Storing all `.webp` images, `.glb`/`.gltf` 3D models, heavy CSS/JS bundles, and hosting simple static HTML portfolio pages via GitHub Pages directly from the main account.
*   **Why:** By linking directly to `raw.githubusercontent.com` or caching via `cdn.jsdelivr.net/gh/...`, we completely offload media bandwidth from Vercel/Netlify. Additionally, deploying lightweight, pure HTML/CSS/JS templates directly to GitHub Pages further distributes the hosting load at zero cost.

## 3. Deployment Scaling Strategy (Reaching 100k)

To manage 100k websites without human bottleneck, we must use automation:

1.  **Monorepo to Multi-Repo Automation:** We will script the deployment so that when a new template is finalized, a GitHub Action automatically generates a new, independent GitHub repository for just that template.
2.  **Programmatic Deployments:** Using the Vercel API, Cloudflare API, and Netlify CLI, the CI/CD pipeline will automatically deploy the newly generated repo to the appropriate platform based on its tech stack.
3.  **Subdomain Linking:** The deployment script grabs the generated free subdomain (e.g., `https://cyberpunk-dev-v2.vercel.app`), injects it into our main `templates.json` in the `PortfolioBuilder` directory, and triggers a rebuild of the showcase site.

## 4. Key Advantages of this Plan

*   **Zero Cost:** By sharding 100k sites across thousands of individual free-tier projects, no single project ever exceeds the 100GB/month bandwidth or build time limits.
*   **Zero Vendor Lock-in:** If Vercel changes their free tier, we simply route React deployments to Netlify or Cloudflare. 
*   **Infinite Scalability:** The central showcase site remains blazingly fast because it's just a JSON list of links pointing to decentralized nodes.
