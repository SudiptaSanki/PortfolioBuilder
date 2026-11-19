# 3D Flight Deck Commercial Pilot — Commercial Airline Pilot Portfolio Template

> Scroll-driven 3D commercial aviation portfolio flying from the runway 09L flight deck at dawn through FL370 cloud-sea cruise to night approach on 27R, complete with Web Audio cockpit soundscape.

`transport-aviation` · `commercial-pilot` · `html` · `threejs, gsap`

**Live Demo:** https://sudiptasanki.github.io/PortfolioBuilder/transport-aviation/commercial-pilot/3d-flight-deck-pilot-portfolio/index.html  
**Source Code:** https://github.com/SudiptaSanki/PortfolioBuilder/tree/main/templates/static/html/transport-aviation/commercial-pilot/3d-flight-deck-pilot-portfolio

---

## Overview & Highlights

- 6 procedural 3D flight stages: Runway 09L Flight Deck, Rotation & Climb, Cloud-Sea Cruise FL370, Turbulence & Weather Deck, Night City Descent, and Final Approach 27R.
- Synthesized Web Audio engine & cockpit ambience with zero audio files.
- Dual zero-build (ESM importmap) and optional Vite workflow.

---

## Run Locally

Run directly without any build step using a local static server (double-click `run.bat` or run manually):

```bash
cd templates/static/html/transport-aviation/commercial-pilot/3d-flight-deck-pilot-portfolio
python -m http.server 8741
# Open http://127.0.0.1:8741/index.html
```

- All internal asset, style, and script references use strictly relative paths (`./...`) so the template works both from a root domain and under any shared subpath shard.
- Customize copy, project entries, and contact links inside `index.html` or `src/config/portfolio.js` / `src/ui/content.js`.

---

Maintained by **PortfolioBuilder Core** (`SudiptaSanki`) — Part of [Portfolio Builder](https://github.com/SudiptaSanki/PortfolioBuilder) · MIT License.
