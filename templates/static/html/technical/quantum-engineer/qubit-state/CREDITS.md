# CREDITS — qubit-state

Rebuilt 2026-11-20 for the Template Fix Program, Batch 01, Set 4
(The Field & The Lab). Persona: **Dr Elena Varga**, quantum computing
engineer, Delft — fictional, disclosed as fictional in every footer.
No real person, client or laboratory is depicted.

## Photographs (Pexels, "Free" licence — each photo page checked 2026-11-20)

All captions on the site are literal and label every image a
REFERENCE PHOTOGRAPH — never the persona's hardware, clients or
laboratory.

| File | Photographer | Pexels photo | Used as |
|---|---|---|---|
| assets/cluster.jpg | panumas nikhomkhai | https://www.pexels.com/photo/37730212/ | Index hero — classical simulation cluster (server racks) |
| assets/assessment.jpg | Yan Krukau | https://www.pexels.com/photo/7693103/ | Case File 01 — assessment working session |
| assets/board.jpg | Jeremy Waterhouse | https://www.pexels.com/photo/3665442/ | Case File 02 — classical circuit board macro |
| assets/workshop.jpg | ThisIsEngineering | https://www.pexels.com/photo/3862370/ | Case File 03 — team education at a whiteboard |
| assets/engineer.jpg | Christina Morillo | https://www.pexels.com/photo/1181320/ | About — engineer in a server room (caption states the person shown is not the persona) |

Downloaded from images.pexels.com at w=1260; JPEG magic `ffd8ff`
verified on every file.

## Diagrams (hand-authored SVG, drawn for this template)

- The Bloch sphere in Sheet 01 — schematic projection, captioned as
  such; the arrow is computed live from the same amplitudes the
  readout prints.
- The circuit strip in Sheet 01 — drawn live from the gates the
  visitor actually applies.
- The brand mark — a one-gate circuit glyph (wire, H gate, sphere).

## Type (Google Fonts, SIL Open Font License)

Newsreader (display), Archivo (body), IBM Plex Mono (data/labels).

## Honest replacements (what the stub promised vs what shipped)

- template.json's "interactive Bloch sphere qubit wave canvas" →
  the State Explorer: a real one-qubit playground. Gates H/X/Z/S/T
  apply their actual 2×2 matrices to complex amplitudes; the
  probabilities, the phase note, the Bloch arrow and the circuit
  strip are all computed from the same numbers. The printed Table 1
  states each gate exactly.
- template.json's "quantum state sound synthesis" → REMOVED.
  **Sound ruling: FAILS the need-test — no audio anywhere on this
  site.** A rising sine on a gate click teaches nothing about
  superposition, phase or noise; it was decoration, and hover/click
  audio is a deal-breaker pattern regardless. The ruling is stated
  in every footer.
- The stub's spinning hologram rings, glow cyan/violet chrome and
  "DR. AYAAN CHEN | Quantum Architect" seed persona → replaced by
  the lab-notebook system and Dr Elena Varga. The stub's printed
  state "STATE: |0⟩ + |1⟩" was also mathematically wrong (no
  normalisation); the rebuilt explorer never prints an
  unnormalised state.

## Physics, stated as printed on the site

- |ψ⟩ = α|0⟩ + β|1⟩ with |α|² + |β|² = 1; measurement probabilities
  are |α|² and |β|². Gate actions in Table 1 are the standard ones
  (H: |0⟩→(|0⟩+|1⟩)/√2, |1⟩→(|0⟩−|1⟩)/√2; X swaps; Z negates β;
  S multiplies β by i; T by e^{iπ/4}).
- Sampling worked example: a true 50% outcome over 100 shots has
  σ = √(100·0.5·0.5) = 5 counts; tallies of 40–60 cover ≈95% of
  runs.
- Noise figures are printed as hedged ranges, deliberately:
  two-qubit gate errors "typically around 0.1–1% per gate" and
  coherence "tens to hundreds of microseconds" on today's leading
  superconducting hardware. No single exact figure is quoted,
  because none honestly exists.
- Hype discipline: no "quantum supremacy", no advantage promises,
  no timelines, no investment language anywhere on the site. The
  about page prints the list of claims the practice will not make.
