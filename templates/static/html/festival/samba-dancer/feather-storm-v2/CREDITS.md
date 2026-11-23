# Credits — feather-storm (Larissa Peixoto, Samba Dancer)

Persona and school are fictional and disclosed as fictional in every
page footer: Larissa Peixoto and the Escola de Samba Estrela da Serra
do not exist. Carnival results are credited to the school throughout,
never to the dancer — that is the template's honesty spine.

## Photographs (all Pexels, Free licence — "Free" seen on each photo page, 2026-11-21)

All photographs are REFERENCE photographs. None depicts the persona,
her school, her parades or her costumes, and every caption on the
site says so. Downloaded into `assets/` at web size; JPEG bytes
verified (magic ffd8ff).

- `assets/hero.jpg` — Oscar Calstrom, "Smiling woman in extravagant
  carnival costume with feathered headpiece on a dark background",
  Pexels photo 18796722 — https://www.pexels.com/photo/18796722/
- `assets/portrait.jpg` — Oscar Calstrom, "Portrait of woman in
  carnival costume", Pexels photo 18796675 —
  https://www.pexels.com/photo/18796675/
- `assets/headdress.jpg` — Oscar Calstrom, "Dancer in a flamboyant
  headdress", Pexels photo 18796693 —
  https://www.pexels.com/photo/18796693/
- `assets/parade.jpg` — Olavi Anttila, "Samba dancers celebrating
  carnival" (Brazilian dancers, outdoor carnival), Pexels photo
  13395752 — https://www.pexels.com/photo/13395752/ (cropped from
  the original frame for the 2:3 plate — canopy band removed, no
  content altered)
- `assets/bateria.jpg` — Olavi Anttila, "Smiling people in costumes
  and with drums" (outdoor Brazilian festival), Pexels photo
  13395751 — https://www.pexels.com/photo/13395751/
- `assets/stage.jpg` — The Castlebar, "Woman wearing blue carnival
  costume" (indoor performance), Pexels photo 19117766 —
  https://www.pexels.com/photo/19117766/

## Type

Anton and Archivo — Google Fonts, SIL Open Font License. Loaded from
Google Fonts CDN; fallback stacks hold up where the CDN is blocked.

## Sound ruling

ONE exception, under the program's strict pattern: the Bateria Tempo
tool on the home page is a synthesised practice metronome (Web Audio;
low surdo thump on beats 1 and 3, rim click on every beat; tempos
132/140/148 BPM printed). It creates its AudioContext ONLY on the
visitor's Start tap, runs at fixed low gain (0.12), self-stops after
8 bars, and has a Stop control. It is labelled on the page as a
synthesised teaching pattern — NOT a recording of any bateria. No
other audio exists on the site; no hover or autoplay audio anywhere.
Samba is rhythm, and rhythm at parade tempo genuinely teaches
through the ear — that is why this one passes the need-test.

## Frame & CSS spec (F10 PORTRAIT-LED)

Full-height portrait hero (2:3 plate, aspect preserved, proposition
in the margin column beside it — never type over a crowd shot);
narrow prose measure (~65ch) in margin columns; performances as a
printed programme list and services as a ruled register — no card
grids; flat costume-colour accents (green / poster red / gold) with
no gradients and no glitter effects (the photographs carry the
sparkle); no hover-lift, no shadowed cards, no scroll-reveal; the
only motion is the programme-panel menu and a short cross-document
view-transition fade, both removed under prefers-reduced-motion.
Frames are stills — the page does not dance.

## Tools

The Parade Readiness Planner and the Booking Estimator parse every
figure from the tables printed on the home page itself (costume
Table 1, planner rules, rate card, travel bands), so tool and page
cannot disagree. The contact form is a demonstration form — it
validates and confirms in-page and transmits nothing, and says so.

## Leftover stub files

`vendor/` (GSAP) and the stub's decorative SVGs in `assets/`
(garland/mandala/floats/footer) are not referenced by the rebuilt
pages; the rebuild uses no JavaScript libraries and no decorative
confetti, bunting or drift motion — they contradicted the assigned
frame's stillness rule.
