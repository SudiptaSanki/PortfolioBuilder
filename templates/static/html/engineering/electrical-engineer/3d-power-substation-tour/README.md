# 3D Power Substation Interactive Tour — Electrical Engineer Portfolio Template

> Six-station interactive 3D power-systems tour walking from load-dispatch control rooms through a 132/33 kV substation, 400 kV corridor, turbine hall, solar/BESS yard, and city distribution.

`engineering` · `electrical-engineer` · `html` · `threejs`

**Live Demo:** https://sudiptasanki.github.io/PortfolioBuilder/engineering/electrical-engineer/3d-power-substation-tour/index.html  
**Source Code:** https://github.com/SudiptaSanki/PortfolioBuilder/tree/main/templates/static/html/engineering/electrical-engineer/3d-power-substation-tour

---

## Overview & Highlights

- **6 Interactive 3D Stations:** Control Room (`station01.html`), 132/33 kV Substation (`index.html`/`station02.html`), 400 kV Transmission Line (`station03.html`), 660 MW Turbine Hall (`station04.html`), Utility Solar + BESS (`station05.html`), and Urban 11 kV Grid (`station06.html`).
- Click-to-inspect procedural Three.js equipment spec panels (transformers, SF₆ breakers, wave traps, catenaries).
- Offline-ready with vendored Three.js r187 and plain ES modules.

---

## Run Locally

Run directly without any build step using a local static server (double-click `run.bat` or run manually):

```bash
cd templates/static/html/engineering/electrical-engineer/3d-power-substation-tour
python -m http.server 8741
# Open http://127.0.0.1:8741/index.html
```

- All internal asset, style, and script references use strictly relative paths (`./...`) so the template works both from a root domain and under any shared subpath shard.
- Customize copy, project entries, and contact links inside `index.html` or `src/config/portfolio.js` / `src/ui/content.js`.

---

Maintained by **PortfolioBuilder Core** (`SudiptaSanki`) — Part of [Portfolio Builder](https://github.com/SudiptaSanki/PortfolioBuilder) · MIT License.
