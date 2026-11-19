# Board-Game Storytelling — Board-Game Storyteller Portfolio Template

> Navy-and-gold board-game showcase with a WebGL2 brush-shader portal and draggable PLAY cards.

`gaming` · `3d` · `HTML/CSS/JS`

**Live:** https://sudiptasanki.github.io/PortfolioBuilder/gaming/board-game-storyteller/board-game-storytelling/index.html

---

## How it works

```mermaid
flowchart TD
  A["index.html - entry"] --> B["vendor: vendor/Draggable.min.js<br>vendor/gsap.min.js<br>vendor/lenis.min.js<br>vendor/ScrollTrigger.min.js"]
  A --> C["assets/css/styles.css"]
  A --> D["JS: assets/js/main.js"]
  A --> E["assets/photos - 17 local images"]
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
2. Open http://127.0.0.1:8741/gaming/board-game-storyteller/board-game-storytelling/index.html

**Standalone (no repo):**

```bash
cd templates/html/github-pages/gaming/board-game-storyteller/board-game-storytelling
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
| `assets/css/styles.css` | Styles |
| `assets/js/main.js` | Behaviour / animation |
| `vendor/Draggable.min.js`, `vendor/gsap.min.js`, `vendor/lenis.min.js`, `vendor/ScrollTrigger.min.js` | Vendored libraries (no install needed) |
| `assets/photos/` | 17 local images |
| `assets/fonts/FoundersGrotesk_Bold-s.p.2z72oy2q8t0k_.otf` | Static asset |
| `assets/fonts/FoundersGrotesk_BoldItalic-s.p.2h22mmev5kh_v.otf` | Static asset |
| `assets/fonts/FoundersGrotesk_Light-s.p.03ydj7u387-et.otf` | Static asset |
| `assets/fonts/FoundersGrotesk_LightItalic-s.p.2qs4h3euj7e1_.otf` | Static asset |
| `assets/fonts/FoundersGrotesk_Medium-s.p.2yu93lxt0tizw.otf` | Static asset |
| `assets/fonts/FoundersGrotesk_MediumItalic-s.p.1d-yzyjh5huyp.otf` | Static asset |
| `template.json` | Catalog metadata (id, live URL, deployment shard) |

## Make it yours

1. Search `index.html` for the persona name and replace it (plus emails and social links).
2. Swap images in `assets/photos/` — keep the same filenames, or update the references.
3. Project entries live in the JS data block (search for `title:`) or directly in the HTML.

---

Credits: Three.js (MIT) and GSAP (GreenSock standard license) vendored where used · photography stored locally (Unsplash License) · part of the [Portfolio Builder](https://github.com/SudiptaSanki/PortfolioBuilder) open-source collection · MIT.
