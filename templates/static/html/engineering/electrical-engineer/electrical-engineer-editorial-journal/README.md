# Electrical Engineer Editorial Journal — Electrical Engineer Portfolio Template

> Warm editorial electrical engineering field journal featuring Blender-rendered transformer plates, schematics, and a live Ohm's law power calculator.

`engineering` · `electrical-engineer` · `html` · `gsap`

**Live Demo:** https://sudiptasanki.github.io/PortfolioBuilder/engineering/electrical-engineer/electrical-engineer-editorial-journal/index.html  
**Source Code:** https://github.com/SudiptaSanki/PortfolioBuilder/tree/main/templates/static/html/engineering/electrical-engineer/electrical-engineer-editorial-journal

---

## Overview & Highlights

- Warm paper-and-ink editorial field journal aesthetic with copper accent.
- Blender-rendered distribution transformer artwork and single-line electrical schematics.
- Interactive pure-JS Ohm's law & three-phase power calculator plus GSAP scroll reveals.
- Fully self-contained static HTML/CSS/JS with vendored GSAP (works completely offline).

---

## Run Locally

Run directly without any build step using a local static server (double-click `run.bat` or run manually):

```bash
cd templates/static/html/engineering/electrical-engineer/electrical-engineer-editorial-journal
python -m http.server 8741
# Open http://127.0.0.1:8741/index.html
```

- All internal asset, style, and script references use strictly relative paths (`./...`) so the template works both from a root domain and under any shared subpath shard.
- Customize copy, project entries, and contact links inside `index.html` or `src/config/portfolio.js` / `src/ui/content.js`.

---

Maintained by **PortfolioBuilder Core** (`SudiptaSanki`) — Part of [Portfolio Builder](https://github.com/SudiptaSanki/PortfolioBuilder) · MIT License.
