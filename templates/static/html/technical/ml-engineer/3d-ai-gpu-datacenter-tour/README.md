# 3D AI GPU Data Center Tour — ML Engineer Portfolio Template

> Six-hall procedural 3D AI infrastructure portfolio tracing the full ML pipeline: feature lake intake, transformer lattice, liquid-cooled GPU data centre, CI/CD gantry, Kubernetes mesh, and edge telemetry.

`technical` · `ml-engineer` · `html` · `threejs`

**Live Demo:** https://sudiptasanki.github.io/PortfolioBuilder/technical/ml-engineer/3d-ai-gpu-datacenter-tour/index.html  
**Source Code:** https://github.com/SudiptaSanki/PortfolioBuilder/tree/main/templates/static/html/technical/ml-engineer/3d-ai-gpu-datacenter-tour

---

## Overview & Highlights

- **6 Procedural 3D Halls:** Data Intake (`station01.html`), Transformer Core (`station02.html`), GPU Data Centre (`index.html`), CI/CD Build Bay (`station04.html`), Kubernetes Rollout Mesh (`station05.html`), and Edge Observatory (`station06.html`).
- Real architectural scale modelling of GB200 NVL72 liquid-cooled racks, CDUs, and busway distribution.
- Offline-ready with vendored Three.js r187 and plain ES modules.

---

## Run Locally

Run directly without any build step using a local static server (double-click `run.bat` or run manually):

```bash
cd templates/static/html/technical/ml-engineer/3d-ai-gpu-datacenter-tour
python -m http.server 8741
# Open http://127.0.0.1:8741/index.html
```

- All internal asset, style, and script references use strictly relative paths (`./...`) so the template works both from a root domain and under any shared subpath shard.
- Customize copy, project entries, and contact links inside `index.html` or `src/config/portfolio.js` / `src/ui/content.js`.

---

Maintained by **PortfolioBuilder Core** (`SudiptaSanki`) — Part of [Portfolio Builder](https://github.com/SudiptaSanki/PortfolioBuilder) · MIT License.
