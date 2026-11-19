# Tile Constellation Visual Studio — Studio Designer Portfolio Template

> White tile wall that scatters into a pinned scroll constellation story with hover-retyping wordmarks.

`creative` · `editorial` · `HTML/CSS/JS`

**Live:** https://sudiptasanki.github.io/PortfolioBuilder/creative/studio-designer/tile-constellation-studio-studio/index.html

---

## How it works

```mermaid
flowchart TD
  A["index.html - entry"] --> B["vendor: vendor/gsap.min.js<br>vendor/lenis.min.js<br>vendor/ScrollTrigger.min.js"]
  A --> C["css/style.css"]
  A --> D["JS: js/app.js"]
  A --> E["assets/photos - 13 local images"]
  B --> F["ScrollTrigger choreography"]
  D --> F
  C --> F
  E --> F
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
2. Open http://127.0.0.1:8741/creative/studio-designer/tile-constellation-studio-studio/index.html

**Standalone (no repo):**

```bash
cd templates/static/html/creative/studio-designer/tile-constellation-studio-studio-studio
python -m http.server 8741
# open http://localhost:8741
```

Opening `index.html` directly from disk also works in most browsers — use the server if any asset looks blocked.

## Apply it

| Option | How |
|---|---|
| **This repo (auto)** | Keep the folder under `templates/static/html/...` — pushing to `main` deploys it to GitHub Pages automatically and the showcase picks it up on the next catalog compile |
| **Netlify / Cloudflare** | Drag-and-drop this folder onto their dashboards — zero build step |
| **Vercel** | Import the folder as a static project (framework preset: Other) |
| **Own GitHub repo** | Push the folder, enable Pages on the branch — same file layout works |

## Files

| Path | Purpose |
|---|---|
| `index.html` | Entry page — all markup |
| `css/style.css` | Styles |
| `js/app.js` | Behaviour / animation |
| `vendor/gsap.min.js`, `vendor/lenis.min.js`, `vendor/ScrollTrigger.min.js` | Vendored libraries (no install needed) |
| `assets/photos/` | 13 local images |
| `assets/favicon.svg` | Static asset |
| `assets/fonts/roboto-regular.woff2` | Static asset |
| `assets/fonts/sixtyfour-var.woff2` | Static asset |
| `assets/letters/A.png` | Static asset |
| `assets/letters/D.png` | Static asset |
| `assets/letters/I.png` | Static asset |
| `template.json` | Catalog metadata (id, live URL, deployment shard) |

## Make it yours

1. Search `index.html` for the persona name and replace it (plus emails and social links).
2. Swap images in `assets/photos/` — keep the same filenames, or update the references.
3. Project entries live in the JS data block (search for `title:`) or directly in the HTML.

---

Credits: Three.js (MIT) and GSAP (GreenSock standard license) vendored where used · photography stored locally (Unsplash License) · part of the [Portfolio Builder](https://github.com/SudiptaSanki/PortfolioBuilder) open-source collection · MIT.
