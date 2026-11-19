# Interactive Scrapbook Desk — Product Designer Portfolio Template

> Grid-paper sketchbook portfolio with torn-paper transitions and a genuinely draggable cutting board.

`creative` · `playful` · `HTML/CSS/JS`

**Live:** https://sudiptasanki.github.io/PortfolioBuilder/creative/product-designer/interactive-interactive-scrapbook-desk/index.html

---

## How it works

```mermaid
flowchart TD
  A["index.html - entry"] --> B["vendor: vendor/gsap.min.js<br>vendor/ScrollTrigger.min.js"]
  A --> C["styles.css"]
  A --> D["JS: app.js"]
  A --> E["assets/photos - 15 local images"]
  D --> F["Pointer interactions: drag / modes / sound"]
  E --> F
  C --> F
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
2. Open http://127.0.0.1:8741/creative/product-designer/interactive-interactive-scrapbook-desk/index.html

**Standalone (no repo):**

```bash
cd templates/static/html/creative/product-designer/interactive-interactive-scrapbook-desk
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
| `styles.css` | Styles |
| `app.js` | Behaviour / animation |
| `vendor/gsap.min.js`, `vendor/ScrollTrigger.min.js` | Vendored libraries (no install needed) |
| `assets/photos/` | 15 local images |
| `README.md` | Static asset |
| `run.bat` | Static asset |
| `template.json` | Catalog metadata (id, live URL, deployment shard) |

## Make it yours

1. Search `index.html` for the persona name and replace it (plus emails and social links).
2. Swap images in `assets/photos/` — keep the same filenames, or update the references.
3. Project entries live in the JS data block (search for `title:`) or directly in the HTML.

---

Credits: Three.js (MIT) and GSAP (GreenSock standard license) vendored where used · photography stored locally (Unsplash License) · part of the [Portfolio Builder](https://github.com/SudiptaSanki/PortfolioBuilder) open-source collection · MIT.
