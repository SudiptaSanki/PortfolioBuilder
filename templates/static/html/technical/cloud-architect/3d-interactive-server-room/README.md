# 3D Interactive Server Room Tour — Cloud Architect Portfolio Template

> Interactive 3D AI & cloud server-room tour with 16 clickable GPU racks, animated cabinet doors, live hardware spec telemetry drawer, and synthesized data-centre airflow soundscape.

`technical` · `cloud-architect` · `html` · `threejs`

**Live Demo:** https://sudiptasanki.github.io/PortfolioBuilder/technical/cloud-architect/3d-interactive-server-room/index.html  
**Source Code:** https://github.com/SudiptaSanki/PortfolioBuilder/tree/main/templates/static/html/technical/cloud-architect/3d-interactive-server-room

---

## Overview & Highlights

- Interactive raycast hardware inspection across 16 racks (`A01–A08`, `B01–B08`) and in-row liquid CDU.
- Non-blocking intercom audio controls with Web Audio brown-noise airflow and rack chimes.
- Offline-ready with vendored Three.js r187 module.

---

## Run Locally

Run directly without any build step using a local static server (double-click `run.bat` or run manually):

```bash
cd templates/static/html/technical/cloud-architect/3d-interactive-server-room
python -m http.server 8741
# Open http://127.0.0.1:8741/index.html
```

- All internal asset, style, and script references use strictly relative paths (`./...`) so the template works both from a root domain and under any shared subpath shard.
- Customize copy, project entries, and contact links inside `index.html` or `src/config/portfolio.js` / `src/ui/content.js`.

---

Maintained by **PortfolioBuilder Core** (`SudiptaSanki`) — Part of [Portfolio Builder](https://github.com/SudiptaSanki/PortfolioBuilder) · MIT License.
