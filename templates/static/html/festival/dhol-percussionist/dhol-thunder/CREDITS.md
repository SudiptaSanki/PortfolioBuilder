# CREDITS — Dhol Thunder (dhol percussionist portfolio)

## Persona
Manpreet "Manny" Sandhu — dhol player & wedding/event percussionist, Birmingham, UK — is a
**fictional portfolio persona** created for this template. His biography, events, case
studies, client (Amrit Kaur, AK Events — also fictional), testimonial, diary and fees are
illustrative. The fiction is disclosed in the footer of every page. The contact email uses
the reserved `.example` domain so no real inbox is implied.

## Photography — Pexels (Pexels License: free to use; verified "Free" on each photo page, 2026-11-20)
All photographs are reference images of the world the trade works in. Captions on the pages
say so explicitly — none is presented as the persona's own event or portrait.

| File | Subject | Photographer | Source |
|---|---|---|---|
| assets/hero-wedding.jpg | Dhol player at a wedding celebration | BJ PHOTOGRAPHY Saurabh | https://www.pexels.com/photo/32652559/ |
| assets/baraat.jpg | Baraat procession with drummers, Surat | Chand Naliyadhara | https://www.pexels.com/photo/8155771/ |
| assets/dancefloor.jpg | Drummer amid a wedding crowd, Goa | thel0stkidd. | https://www.pexels.com/photo/30664597/ |
| assets/dhol-closeup.jpg | Decorated dhol, close-up | Swastik Arora | https://www.pexels.com/photo/15634127/ |
| assets/portrait.jpg | Dhol player at an outdoor festival | Ibrahim Ansari | https://www.pexels.com/photo/25002540/ |
| assets/drums-resting.jpg | Dhol drums resting on a rug | Swastik Arora | https://www.pexels.com/photo/10744004/ |
| assets/player-outdoors.jpg | Musician playing dhol outdoors | Mushfiqur Rahman | https://www.pexels.com/photo/35488982/ |

The stub's decorative SVGs in assets/ (floats, flowers, garland, kash, mandala, footer art)
are unreferenced by the rebuilt pages and remain in the folder untouched.

## Typography — Google Fonts (SIL Open Font License)
Barlow Condensed (display), Barlow (text), Space Mono (times & data) — all OFL, loaded from
Google Fonts. Fallbacks are local system stacks.

## Sound — Web Audio synthesis, no audio files
The rhythm demonstrations are synthesised live in the visitor's browser (Web Audio API):
three voices modelled on the dhol's strokes — Ge (bass side, pitch-dropped sine),
Na (treble slap, band-passed noise + body), Ka (rim, high-passed noise). No audio files are
used or licensed. Nothing plays until the visitor presses Play; the patterns (Bhangra Chaal,
Dhamaal, Keharwa, Baraat Walk) are traditional folk cycles, described as played and
simplified to the grid, and labelled on the page as demonstrations, not recordings.

**Sound ruling (owner's need-test): PASS.** The trade is sound, and the demonstration
teaches the named patterns buyers choose between. The rebuild is vanilla JS (the stub's
vendored GSAP files remain in the folder, unloaded), and any autoplaying or
hover-triggered audio was removed by design — there was none worth keeping.

## Code
Hand-written HTML/CSS/vanilla JS for this template. No frameworks, no build step.
