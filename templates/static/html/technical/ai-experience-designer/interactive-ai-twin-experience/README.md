# Interactive AI Twin Experience — AI Experience Designer Portfolio Template

> Narrative AI-twin experience with SVG boil/goo filters, red-thread dividers and phone mockups.

`technology` · `playful` · `HTML/CSS/JS`

**Live:** https://sudiptasanki.github.io/PortfolioBuilder/technical/ai-experience-designer/interactive-ai-twin-experience/index.html

---

## How it works

```mermaid
flowchart TD
  A["index.html - entry"] --> B["vendor: no libraries (vanilla)"]
  A --> D["JS: lenis.min.js<br>ui.js"]
  D --> F["Pointer interactions: drag / modes / sound"]
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
2. Open http://127.0.0.1:8741/technical/ai-experience-designer/interactive-ai-twin-experience/index.html

**Standalone (no repo):**

```bash
cd templates/static/html/technical/ai-experience-designer/interactive-ai-twin-experience
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
| `lenis.min.js` | Behaviour / animation |
| `ui.js` | Behaviour / animation |
| `api/geo.json` | Static asset |
| `brand/apple-touch.png` | Static asset |
| `brand/apps/chessdotcom.webp` | Static asset |
| `brand/apps/claude.webp` | Static asset |
| `brand/apps/duolingo.webp` | Static asset |
| `brand/apps/googlecalendar.webp` | Static asset |
| `template.json` | Catalog metadata (id, live URL, deployment shard) |

## Make it yours

1. Search `index.html` for the persona name and replace it (plus emails and social links).
2. Swap images in `assets/photos/` — keep the same filenames, or update the references.
3. Project entries live in the JS data block (search for `title:`) or directly in the HTML.

---

Credits: Three.js (MIT) and GSAP (GreenSock standard license) vendored where used · photography stored locally (Unsplash License) · part of the [Portfolio Builder](https://github.com/SudiptaSanki/PortfolioBuilder) open-source collection · MIT.
