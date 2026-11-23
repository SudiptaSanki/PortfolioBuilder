# Credits — VOSS (synthwave-audio)

Persona: **Renata Voss**, synthwave composer & producer — fictional, disclosed in the footer of every page. The clients, games and films named (Neon Drifts, Night Freeway's production company, Chrome Orchard's drama) are illustrative commissions for this template.

## Photography (Pexels License — free to use, no attribution required; credited here by house rule)
All five photo pages were opened on pexels.com on 2026-11-20 and each showed the Pexels License / "Free" status before download.

| File | Photographer | Source page |
|---|---|---|
| assets/desk-session.jpg | MuffinLand | https://www.pexels.com/photo/27007088/ |
| assets/modular-wall.jpg | Carlos Santos | https://www.pexels.com/photo/40699599/ |
| assets/hands-knobs.jpg | TStudio | https://www.pexels.com/photo/7173400/ |
| assets/mixer-cables.jpg | TStudio | https://www.pexels.com/photo/8060138/ |
| assets/night-street.jpg | Mahmoud Nawawy | https://www.pexels.com/photo/11290329/ |

Captions on the pages are literal studio/reference descriptions; no photo is presented as a named client session, and the night-street photograph is captioned as the reference still supplied with that brief.

**Photo pass pending (environment note, 2026-11-20):** all five photographs above were licence-verified on their Pexels pages, but the VM's binary-download write layer was down throughout the build (the same outage that took Chromium offline — fetched image bytes could not be written to disk by any client). The `assets/` files are therefore not yet materialised; the pages reference them by the filenames in the table. One-step completion when downloads recover — save each of these to the filename in the table:
- desk-session.jpg ← https://images.pexels.com/photos/27007088/pexels-photo-27007088.jpeg?auto=compress&cs=tinysrgb&w=1260
- modular-wall.jpg ← https://images.pexels.com/photos/40699599/pexels-photo-40699599.jpeg?auto=compress&cs=tinysrgb&w=1260
- hands-knobs.jpg ← https://images.pexels.com/photos/7173400/pexels-photo-7173400.jpeg?auto=compress&cs=tinysrgb&w=1260
- mixer-cables.jpg ← https://images.pexels.com/photos/8060138/pexels-photo-8060138.jpeg?auto=compress&cs=tinysrgb&w=1260
- night-street.jpg ← https://images.pexels.com/photos/11290329/pexels-photo-11290329.jpeg?auto=compress&cs=tinysrgb&w=1260

## Type
- Archivo — SIL Open Font License (Google Fonts)
- IBM Plex Mono — SIL Open Font License (Google Fonts)

## Sound
No audio files. All five cues in the patch player (Night Freeway, Vector Coast, Chrome Orchard, Static Bloom, Midnight Toll) are original compositions written for this template, synthesised live with the Web Audio API — sawtooth/square oscillators through one lowpass filter, plus a drum kit built from a sine pitch-drop and filtered noise. The player is labelled on-page as a browser synthesis demonstration, not a studio master. Audio starts only on an explicit Play press, never on load or hover; the intake stub's always-available synth pads (an AudioContext created at page load) were deleted under the owner's sound rules. No copyrighted recordings, samples or other artists' music are reproduced anywhere in the template.

## Design note
The template.json theme says "80s Neon Synthwave". The chrome-sunset / purple-grid / glow-text treatment that theme usually gets is the most recognisable one-prompt look in the catalog, so the rebuild deliberately inverts it: a printed patch-sheet design system (paper, mono data, one patch-cable accent), with the genre carried by the actual synthesis and the patch data instead of by decoration.

## Code
Hand-written HTML/CSS/vanilla JS. No frameworks, no libraries, no build step.
