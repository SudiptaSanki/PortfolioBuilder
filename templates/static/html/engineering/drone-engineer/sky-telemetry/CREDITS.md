# Credits — Sky Telemetry (sky-telemetry)

Persona: **Jonas Weber**, autonomous UAV systems engineer, Delft —
**fictional**, disclosed in every page footer. No photograph shows him or
his clients' aircraft; every image is labelled on-page as a reference
photograph.

## A note on the trade (metadata over brief)

template.json defines this template's trade: **Autonomous UAV Systems
Engineer** (drone telemetry). The build follows the metadata: the
satellite-style framing in the original rebuild brief was adapted to
the drone ground segment, where the same disciplines apply with the
same mathematics — ground stations (GCS), telemetry links, link
budgets and flight-log pipelines. The free-space path-loss formula and
worked-example method carried over unchanged, because the physics did.

## Photography — Pexels (Pexels Licence, free to use; licence shown as
"Free" on each photo page, checked 2026-11-20)

| File | Photographer | Source page | Used as |
|---|---|---|---|
| assets/drone-field.jpg | JESHOOTS.com | https://www.pexels.com/photo/442589/ | Index hero — quadcopter over a field at sunset |
| assets/ground-station-kit.jpg | cottonbro studio | https://www.pexels.com/photo/3945687/ | Case File 01 — drone kit flat lay: controller and spare propellers |
| assets/ag-survey.jpg | Magda Ehlers | https://www.pexels.com/photo/34182311/ | Case File 02 — survey-class drone over a farm field |
| assets/inspection-flight.jpg | Atlantic Ambience | https://www.pexels.com/photo/1093232/ | Case File 03 — quadcopter hovering near a classical building |
| assets/controller-hands.jpg | DARKMODE CINEMA | https://www.pexels.com/photo/16556192/ | About — hands holding a drone transmitter outdoors (caption states the hands are not the persona's) |

All five files were downloaded from images.pexels.com and verified as
JPEG (magic bytes ffd8ff).

## Type — Google Fonts (SIL Open Font License)

- Saira (500/600/700) — display
- Inter (400/500/600) — body
- IBM Plex Mono (400/600) — data labels, log strips, figures

## Honest replacements (template.json promises)

The stub promised a "real-time flight telemetry HUD canvas", a "rotor
sound synthesizer" and a "waypoint navigation tool". The HUD canvas
was ambient animation wearing the trade's clothes; the synthesizer
was hover audio, a deal-breaker regardless. Both were replaced by
tools that do the trade's actual work: the **Link Planner** (four
links, four failure modes) and the **Link Budget calculator** (free-
space path loss with the arithmetic printed and checkable). The
waypoint idea survives where it belongs — inside the mission and log
content, as work, not decoration.

## Sound ruling

**Fails the need-test — no audio anywhere.** A rotor synthesizer is
decoration, the profession's product is the logged flight rather than
its noise, and hover-triggered audio is a deal-breaker regardless.
