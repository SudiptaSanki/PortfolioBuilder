# Scroll-Morphing Particle Portfolio — Interaction Developer Portfolio Template

> Glyph particles dissolve and re-assemble between scroll sections with pointer-repulsion vignettes.

`technology` · `3d` · `HTML/CSS/JS`

**Live:** https://sudiptasanki.github.io/PortfolioBuilder/technology/interaction-developer/scroll-morphing-particle/index.html

---

## How it works

```mermaid
flowchart TD
  A["index.html - entry"] --> B["vendor: vendor/gsap.min.js<br>vendor/ScrollTrigger.min.js<br>vendor/three.min.js"]
  A --> C["assets/css/style.css"]
  A --> D["JS: assets/js/glyph-data.js<br>assets/js/glyph-field.js<br>assets/js/main.js<br>assets/js/work-counter.js"]
  A --> E["assets/photos - 3 local images"]
  B --> F["WebGL canvas + post effects"]
  D --> F
  E --> F
  F --> G["Loader 00 -> 100"]
  G --> H["Scroll-scrubbed scenes + UI"]
```

## Run it locally

```mermaid
flowchart LR
  A["run-collection.bat"] --> B["local server :8741"]
  B --> C["open this template"]
  C --> D["edit text, images, links"]
  D --> E{apply}
  E --> F["GitHub Pages - auto on push"]
  E --> G["Netlify / Cloudflare drop"]
  E --> H["Vercel static"]
```

**Quick start (this repository):**

1. Double-click `run-collection.bat` (opens all 18) or `run-preview-hub.bat` (categorized hub).
   Both auto-start the local server at http://127.0.0.1:8741.
2. Open http://127.0.0.1:8741/technology/interaction-developer/scroll-morphing-particle/index.html

**Standalone (no repo):**

```bash
cd templates/html/github-pages/technology/interaction-developer/scroll-morphing-particle
python -m http.server 8741
# open http://localhost:8741
```

Opening `index.html` directly from disk also works in most browsers — use the server if any asset looks blocked.

## Apply it

| Option | How |
|---|---|
| **This repo (auto)** | Keep the folder under `templates/html/github-pages/...` — pushing to `main` deploys it to GitHub Pages automatically and the showcase picks it up on the next catalog compile |
| **Netlify / Cloudflare** | Drag-and-drop this folder onto their dashboards — zero build step |
| **Vercel** | Import the folder as a static project (framework preset: Other) |
| **Own GitHub repo** | Push the folder, enable Pages on the branch — same file layout works |

## Files

| Path | Purpose |
|---|---|
| `index.html` | Entry page — all markup |
| `assets/css/style.css` | Styles |
| `assets/js/glyph-data.js` | Behaviour / animation |
| `assets/js/glyph-field.js` | Behaviour / animation |
| `assets/js/main.js` | Behaviour / animation |
| `assets/js/work-counter.js` | Behaviour / animation |
| `vendor/gsap.min.js`, `vendor/ScrollTrigger.min.js`, `vendor/three.min.js` | Vendored libraries (no install needed) |
| `assets/photos/` | 3 local images |
| `assets/fonts/7cb8e1b9ab81be17-s.p.woff2` | Static asset |
| `assets/fonts/dbccb4a9e22cbf0d-s.p.woff2` | Static asset |
| `assets/fonts/e872e3f251959e82-s.p.woff2` | Static asset |
| `README.md` | Static asset |
| `run.bat` | Static asset |
| `template.json` | Catalog metadata (id, live URL, deployment shard) |

## Make it yours

1. Search `index.html` for the persona name and replace it (plus emails and social links).
2. Swap images in `assets/photos/` — keep the same filenames, or update the references.
3. Project entries live in the JS data block (search for `title:`) or directly in the HTML.

---

Credits: Three.js (MIT) and GSAP (GreenSock standard license) vendored where used · photography stored locally (Unsplash License) · part of the [Portfolio Builder](https://github.com/SudiptaSanki/PortfolioBuilder) open-source collection · MIT.
