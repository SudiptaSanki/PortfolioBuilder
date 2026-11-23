# CREDITS — arctic-frost (Strand Glacier Programmes)

## Photographs (all Pexels, free licence — licence line seen on each photo page, 2026-11-20)

| File | Photographer | Pexels photo | Used on |
|------|--------------|--------------|---------|
| assets/hero-glacier.jpg | Christian Buergi | https://www.pexels.com/photo/12475185/ (Aletsch Glacier, Switzerland) | index hero |
| assets/glacier-panorama.jpg | Jean-Paul Wettstein | https://www.pexels.com/photo/34947251/ (Aletsch Glacier panorama) | projects head |
| assets/field-party.jpg | Tigran Manukyan | https://www.pexels.com/photo/33097708/ (party traversing snowy terrain) | projects close |
| assets/ice-detail.jpg | Abbey Fodor | https://www.pexels.com/photo/29404865/ (glacier ice detail, Chile) | about head |

Every photograph is captioned on-page as a **reference photograph** — never the
practice's own glaciers, fieldwork or teams. JPEG magic bytes (`ffd8ff`)
verified for all four files.

## Type

Google Fonts (SIL Open Font License): Space Grotesk (display), Inter (body),
IBM Plex Mono (figures and data).

## Persona & content

Dr Elin Strand, her clients (Fjellkraft and the rest) and her glaciers —
including the worked example, Vinterbreen — are fictional, and the fiction is
disclosed in every page footer. The glaciology is real practice: mass balance
in metres water equivalent; accumulation vs ablation; the equilibrium line;
area-weighted band balances (the Explorer's arithmetic is the method's
arithmetic); snow and ice density conversions (×0.38 at 380 kg/m³, ×0.90 for
ice); homogenisation of long series; reporting in the standard format used by
the World Glacier Monitoring Service. Rates (£1,850 per field visit, £1,200
reporting, £640 field day) are the fictional practice's published card, and
the estimator and the fee cards are built from the same two numbers.

## Stub-promise replacements (documented, per program rules)

- The stub's falling-snowflake canvas: pure decoration — deleted, not rebuilt.
- The stub's promised "howling polar wind" Web Audio synth: **sound ruling —
  FAILS the need-test.** Glaciology is not a sound profession and no
  interaction here teaches through audio. No audio exists anywhere on the
  site; the ruling is printed in every footer.
- The stub's ice-core angle ("ice core analysis", carbon sampling) belonged
  to a different template's concept (cryosphere-core, Batch 01 Set 4). This
  rebuild's angle is glacier **mass balance** — stakes, snow pits and the
  water-equivalent account — and no ice-core content remains.
- The stub persona "DR. FREYA ICE" and the Project Alpha/Beta subpages were
  deleted entirely.

## Verification

Touch probe + screenshots live in `batch-02/preview/arctic-frost/` (outside
the template folder). Probe asserts, by real touch taps: layout width equals
the emulated viewport at 390×844 and 360×780 before any tap assertion; the
Balance Explorer's weighted mean for the reference configuration (−0.47 m
w.e., matching Table 1) and for a stepped configuration (−0.63 m w.e.,
recomputed independently); the equilibrium-line readout moving to the
2,300 m boundary when Band C is stepped below zero; the estimator's totals
(£14,700 default; £24,500 and £33,750 stepped); the field-index menu by
computed visibility; and the form's validation, generated reference and
reset. Standing caveat: live Google Fonts rendering cannot be verified from
the build VM (fonts.googleapis.com is proxy-blocked); fallback stacks hold
up in every capture.
