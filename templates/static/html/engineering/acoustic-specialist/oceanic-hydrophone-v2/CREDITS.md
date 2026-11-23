# Credits — Duarte Passive Acoustics (oceanic-hydrophone)

**Persona:** Dr Inês Duarte is a fictional persona created for this template,
disclosed as fictional in the footer of every page. The acoustics, the
arithmetic and the working practices described are real. Client organisations
in the case files are described by type, not named; the testimonial is
attributed to a named role at a fictional programme, in keeping with the
persona disclosure.

## Photography — Pexels (Pexels License, free to use; verified on each photo page)

All photographs are **reference photographs**: they show the kinds of places,
vessels and water this work happens around. None shows this practice's own
deployments, recorders or detections, and every caption on the site says so.

1. **Kris Møklebust** — "Dark Ocean Surface with Sunlight Reflection"
   Photo page: https://www.pexels.com/photo/34155535/
   Image: https://images.pexels.com/photos/34155535/pexels-photo-34155535.jpeg
   Used as: `assets/dark-surface.jpg` — home page photo band (the sea surface
   above a hydrophone).

2. **SAIF SIDDIQUE** — "A Whale's Tail Sticking Out of the Water"
   Photo page: https://www.pexels.com/photo/14834819/
   Image: https://images.pexels.com/photos/14834819/pexels-photo-14834819.jpeg
   Used as: `assets/whale-fluke.jpg` — listening bench figure (the animal
   behind contour 1; captioned as a reference photograph, not a detection).

3. **Erik Mclean** — "High Angle View of Boats on Piers" (industrial harbour)
   Photo page: https://www.pexels.com/photo/8826934/
   Image: https://images.pexels.com/photos/8826934/pexels-photo-8826934.jpeg
   Used as: `assets/harbour-aerial.jpg` — Case file 02 (construction
   monitoring at a port).

4. **Mathias Reding** — "White Boat on Dock" (workboat with buoys and equipment)
   Photo page: https://www.pexels.com/photo/11363530/
   Image: https://images.pexels.com/photos/11363530/pexels-photo-11363530.jpeg
   Used as: `assets/workboat.jpg` — Case file 01 (deployments) and the About
   page (deployment workboat; the analyst's portrait is deliberately not
   published).

5. **Blaque X** — "Sun Rays Through Water" (light entering deep water)
   Photo page: https://www.pexels.com/photo/932638/
   Image: https://images.pexels.com/photos/932638/pexels-photo-932638.jpeg
   Used as: `assets/deep-water.jpg` — Case file 03 (the deep mooring's world).

## Fonts — Google Fonts, SIL Open Font License 1.1

- **Space Grotesk** (display) — OFL 1.1
- **Archivo** (body) — OFL 1.1
- **IBM Plex Mono** (data, tables, log entries) — OFL 1.1

## Artwork

Figures 1 and 2 (the spectrogram sheet and the contour sheet) are original
inline SVG diagrams drawn for this template — stylised teaching diagrams,
labelled on the page as drawn, not recorded.

## Sound — ruling and reasoning

**Ruling: tap-gated synthesised audio, frequency-room pattern only.**
Underwater bioacoustics is the one profession in this set whose trade *is*
listening, and the bench teaches something real: detector literacy — the
downsweep contour and the accelerating click train are the two shapes every
detector on a PAM programme is built to find, and hearing them once teaches
more than a paragraph about them. The bench therefore passes the need-test
under the strict conditions of the Set 5 frequency-room precedent:

- contours are **synthesised in the browser** (Web Audio oscillator and
  filtered noise) — they are not, and are printed on the page as not being,
  recordings of animals;
- sound is generated **only on an explicit button press** — the
  AudioContext is created lazily at that moment, never on page load;
- **fixed low gain** (0.12 master), a printed hearing-safety line, a stop
  control, and every contour **self-stops inside two seconds**;
- the matching drawn trace on Fig. 2 lights while its contour plays, tying
  the sound to the diagram it teaches;
- **no hover audio, no autoplay, anywhere on the site** (the stub's
  always-on canvas animation and ambient approach were removed entirely).

## Numbers on this site

- Source levels (Table 1) are **stated example figures** in the published
  ranges for each class, labelled as such on the page.
- Absorption coefficients (Table 2) are planning values **rounded from
  Thorp's relation**, labelled as such.
- Ambient bands (Table 3) are stated planning bands, labelled as such.
- Day rates and hire rates (Table 4) are the persona's printed rate card;
  the estimator reads them from the printed table in the page, and the
  calculator reads all of its inputs from its printed tables — the site
  contains no hidden constants a visitor cannot check.
