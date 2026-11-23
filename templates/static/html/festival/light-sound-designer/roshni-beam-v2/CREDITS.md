# CREDITS — roshni-beam (Light & Sound Designer)

Persona: **Roshni Bhandari**, light & sound designer, Pune — fictional,
disclosed in the footer of every page. The festivals and clients named
(Kaveri Riverfest, Deccan Monsoon Session, Harbour Lights Procession,
Solstice Fields, Anita Deshmukh) are fictional. Email uses the reserved
`.example` domain.

## Photographs — Pexels (free licence, seen on each photo page)

All photographs are REFERENCE photographs, credited under each frame on
the site itself as well as here. They are never claimed as the persona's
own productions, stages or festivals; the persona's work is the desk,
the printed tables and the case-file text.

| File | Photographer | Pexels page | Subject |
|---|---|---|---|
| assets/stage-crowd.jpg | Lisa Fotios | https://www.pexels.com/photo/13230484/ | Festival main stage at night, trusses of wash lights over a crowd |
| assets/desk-foh.jpg | tainah ferreira | https://www.pexels.com/photo/33565506/ | Lighting desk with control screens at a live concert |
| assets/beams-dark.jpg | Isabella Mendes | https://www.pexels.com/photo/5389617/ | Stage light beams cutting through darkness |
| assets/festival-fireworks.jpg | Luke | https://www.pexels.com/photo/3385614/ | Festival stage at night with fireworks above the crowd |
| assets/rig-daylight.jpg | Magda Ehlers | https://www.pexels.com/photo/12787862/ | Outdoor stage lighting rig seen from above, daylight |

Licence: Pexels licence — free to use; licence wording ("Free" / Pexels
licence) was seen on each photo page at download time, 2026-11-21.
JPEG magic `ffd8ff` verified on all five files.

## Diagrams

The stage elevation in the desk hero (Fig. 1) is the template's own SVG,
drawn for this rebuild and captioned on the page as a diagram, not a
photograph. Beam intensity in the diagram follows the active cue's
printed levels.

## Typefaces — Google Fonts (SIL Open Font License)

- Chakra Petch — the desk's labelling voice: console headers, readouts,
  table heads, channel labels.
- Archivo — body text and captions.
- IBM Plex Mono is deliberately NOT used: this console's real labelling
  is a technical grotesque, and Chakra Petch carries it without the
  program's retired default voice.

## Sound

NONE, and the ruling is printed in every footer: the designer's product
includes sound, but a portfolio page playing show audio would
misrepresent it — the desk is a visual instrument. No audio files, no
Web Audio, no AudioContext anywhere in the build.

## Photosensitivity

Nothing on any page flashes or strobes. Cue changes are opacity
crossfades of 0.7 s (instant under prefers-reduced-motion), and the
plot's strobe channel (CH 6) is locked out in the fiction exactly as
the practice's printed policy requires.

## Frame & CSS spec (Frame Diversity + CSS-Layer directives)

- Frame: **F5 CONSOLE / INSTRUMENT** — the hero IS the lighting desk:
  a working cue sheet and stage diagram whose beam intensities follow
  the active cue; stepping cues recomputes load from the printed
  tables and checks it against the printed budget.
- CSS spec: full-bleed console hero; text sections at the standard
  ~1120px container; channel-grid layout (the desk's grid is the
  page's grid); ruled tables and bordered panels only — no card
  grids, no shadow cards, no hover-lift; effects vocabulary limited
  to the cue crossfade and the cross-document view transition
  (with the program's InvalidStateError abort guard); NO
  scroll-reveal.
- Flat beam colours on a near-black console ground; gradients are
  not used as decoration anywhere (beam shapes are drawn SVG light,
  captioned as a diagram).

## Signature tool — the arithmetic

The Cue & Load tool parses Tables R1 (rig), C1 (cue sheet) and P1
(budget) from the DOM and computes load = Σ count × watts × level,
with the tungsten festoon (CH 5) on the filament law (level²).
Hand-checked totals: Q1 3,890 W · Q2 7,415 W · Q3 12,525 W ·
Q4 18,700 W (over the 16,000 W budget by 2,700 W — the caught
mistake, Case File 02) · Q5 14,490 W · Q6 120 W · Q7 6,280 W ·
Q8 4,020 W. The booking estimator likewise parses Table F1;
default ₹1,65,000; full configuration ₹2,90,000.

## Dry-brush edge

Not used. A lighting desk's honesty language is the ruled table and
the signed load sheet; a torn edge would be decoration on an
instrument. (Genre permission existed — festival — but the frame
argues against it, and the frame wins.)

## Retired stub material

The stub's decorative SVGs (garland, mandala, floats, flowers,
footer, kash), its GSAP/ScrollTrigger vendor files and its fonts
remain in the folder, unreferenced, as received. The stub persona
("Lakshmi Das") and its generic celebration copy were removed in
full — template.json's trade is a festival light & sound designer,
and the rebuild is built to that trade.
