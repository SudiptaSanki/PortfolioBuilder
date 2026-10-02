# Template Submission Guide & Contributor Contract

This guide details the complete process for building, documenting, deploying, and submitting a new portfolio template to **Portfolio Builder**.

---

## 1. Core Principles

- **Provider Independence:** A template's identity (`id`) is immutable. Where it is hosted is just deployment metadata.
- **No Maintainer Credentials:** You never need access to Portfolio Builder's cloud accounts, and we never ask for your personal cloud tokens.
- **Relative Asset Safety:** All static assets must use relative paths (e.g. `css/style.css`, `./assets/main.js`). Root-relative paths (e.g. `/style.css`) are strictly forbidden because they break when served under subdirectories or edge shards.

---

## 2. Directory Structure

Create your template directory inside `templates/`:

```
templates/
└── <framework>/
    └── <provider>/
        └── <genre>/
            └── <role>/
                └── <theme-name>/
                    ├── index.html        # Entrypoint (or App.vue / page.tsx)
                    ├── css/
                    │   └── style.css
                    ├── js/
                    │   └── main.js
                    ├── README.md         # Template documentation
                    └── template.json     # REQUIRED: Canonical metadata
```

*(Note: Contributed standalone dynamic templates can also use `templates/<theme-name>/` directly with appropriate `source.path` configured in `template.json`).*

---

## 3. Required Metadata Specification (`template.json`)

Every template must contain a `template.json` file in its root directory:

```json
{
  "$schema": "https://portfoliobuilders.dev/schemas/template-v1.json",
  "id": "quantum-dev-portfolio",
  "name": "Quantum Developer Portfolio",
  "category": "technology",
  "role": "Quantum Computing Engineer",
  "subcategory": "quantum-engineer",
  "framework": "html",
  "stack": "HTML/CSS/JS",
  "theme": "Dark Quantum Qubit Neon",
  "language": ["html", "css", "javascript"],
  "rendering": "static",
  "tags": [
    "quantum",
    "developer",
    "dark",
    "multi-page",
    "html",
    "css",
    "js",
    "technology"
  ],
  "description": "High-contrast dark developer portfolio featuring interactive particle physics background and project research archives.",
  "source": {
    "path": "templates/html/github-pages/technology/quantum-engineer/quantum-dev",
    "entry": "index.html"
  },
  "deployment": {
    "provider": "github-pages",
    "type": "shared-static",
    "shard": "github-pages-01",
    "status": "active",
    "baseUrl": "https://sudiptasanki.github.io/PortfolioBuilder",
    "path": "technology/quantum-engineer/quantum-dev",
    "liveUrl": "https://sudiptasanki.github.io/PortfolioBuilder/technology/quantum-engineer/quantum-dev/index.html"
  },
  "preview": {
    "image": "https://raw.githubusercontent.com/Alex-DevDrift/Assets/main/portfoliobuilders/images/img_quantum_dev.webp"
  },
  "contributor": {
    "name": "Jane Doe",
    "github": "janedoe"
  }
}
```

### Field Definitions

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique, lowercase alphanumeric with hyphens (e.g. `quantum-dev-portfolio`). |
| `name` | `string` | Clean human-readable display title. |
| `category` | `string` | Must be one of: `technology`, `creative`, `business`, `academic`, `health-wellness`, `services`, `retail`, `startup`, `gaming`, `music`, `events`, `medical`. |
| `role` | `string` | Target profession (e.g. `Frontend Developer`, `Architect`). |
| `framework` | `string` | Must be one of: `html`, `react`, `vue`, `nextjs`, `astro`, `svelte`, `vanilla`. |
| `rendering` | `string` | Must be one of: `static`, `spa`, `ssr`, `edge`. |
| `deployment.type` | `string` | `shared-static`, `contributor-hosted`, `managed-runtime`, `edge-runtime`, or `external`. |
| `deployment.provider` | `string` | `github-pages`, `cloudflare-pages`, `vercel`, `netlify`, `custom`, or `external`. |
| `deployment.status` | `string` | `active`, `pending`, `broken`, `deprecated`, or `migrated`. Default is `active`. |
| `deployment.liveUrl` | `string` | Fully qualified HTTPS preview URL where visitors can interact with the live demo. |

---

## 4. How to Host & Deploy Your Template

### Option A: Shared Static Hosting (Recommended for Pure HTML/CSS/JS)
- If your template is pure static HTML/CSS/JS, the Portfolio Builder maintainers deploy it automatically to our primary shared static shard (`github-pages-01`).
- Set:
  ```json
  "deployment": {
    "provider": "github-pages",
    "type": "shared-static",
    "shard": "github-pages-01",
    "baseUrl": "https://sudiptasanki.github.io/PortfolioBuilder",
    "path": "<genre>/<role>/<theme>",
    "liveUrl": "https://sudiptasanki.github.io/PortfolioBuilder/<genre>/<role>/<theme>/index.html"
  }
  ```

### Option B: Contributor-Owned Deployment (For React, Vue, Next.js, or SSR)
- You deploy your template on your own free account (Vercel, Netlify, Cloudflare Pages, GitHub Pages, or custom domain).
- Set:
  ```json
  "deployment": {
    "provider": "vercel",
    "type": "contributor-hosted",
    "shard": "contributor-external",
    "status": "active",
    "liveUrl": "https://my-portfolio-template.vercel.app"
  }
  ```
- **Zero account access required:** You maintain your deployment. You can update your demo at any time.

---

## 5. Local Testing & Automated Validation

Before submitting a pull request, run the local validator and compiler:

```bash
# 1. Validate your template.json and asset paths
npm run validate

# 2. Compile your template into the Showcase catalog
npm run catalog:generate

# 3. Test the Showcase locally to see your template card and preview
npm run showcase:dev
```

If `npm run validate` reports any errors (such as forbidden root-relative asset paths like `/style.css`), adjust your asset paths to relative (e.g. `css/style.css` or `./style.css`) and re-run.

---

## 6. How Pull Requests Are Validated in CI

When you submit a PR to `main`:
1. **GitHub Actions (`.github/workflows/validate-templates.yml`)** triggers automatically.
2. It verifies:
   - Your `templateId` is unique and does not collide with existing templates.
   - Your `template.json` conforms to the schema.
   - All source directories exist.
   - No absolute root-relative asset paths exist in static templates.
   - The catalog compiles cleanly.
3. Once approved and merged, the central Showcase automatically renders your template card!

---

## 7. What Happens If a Contributor's Preview Fails?

We recognize that personal hosting accounts or domains may change over time:
- If your deployment becomes unavailable, your template is **never deleted**.
- Its status is updated to `"deployment.status": "broken"`.
- The Showcase UI gracefully switches the card to **"Code Only"**, directing visitors to your verified source code on GitHub.
- You can submit a PR at any time updating `deployment.liveUrl` to restore live preview mode!
