# Credits & build notes — web3-developer-crypto-neon

## Persona & honesty

**Tomas Berg** is a fictional smart-contract engineer created for this
portfolio template. The practice, clients, engagements and figures on
the site are illustrative; the persona is disclosed as fictional in
every page footer. Client names are withheld "under NDA" as part of
the fiction — the case files describe finding *classes* and process,
never real projects, and no exploit code or detail appears anywhere.

## Photographs (Pexels — free licence, checked on the photo page)

All photographs are reference images, captioned literally on the
pages where they appear. None depicts the persona, his clients, or
their systems.

| File | Photographer | Pexels photo | Used on |
|---|---|---|---|
| assets/code-review.jpg | Rodrigo Santos | https://www.pexels.com/photo/3888149/ | index hero |
| assets/spec-whiteboard.jpg | Walls.io | https://www.pexels.com/photo/17724744/ | about — method |
| assets/pair-review.jpg | Mizuno K | https://www.pexels.com/photo/12899191/ | about — story |

Licence: Pexels free licence ("Free" on each photo page, checked
2026-11-20). JPEG magic bytes verified on download (ffd8ff).

## Fonts (Google Fonts, SIL Open Font License)

- Newsreader — headings
- Inter — body/UI
- IBM Plex Mono — data, labels, figures

## Sound ruling

**Fails the need-test — no audio anywhere.** A smart-contract
reviewer's profession is not sound, and no interaction on this site
teaches through audio. There is no `<audio>` element, no Web Audio,
no audio file. The ruling is recorded here per program rules.

## Honest replacements (stub → rebuild)

The stub ("Crypto Neon Web3 Dev", persona "0xNova") promised a
futuristic neon theme, displayed invented GitHub repositories with
fabricated star counts, a hero photograph hotlinked from Unsplash,
and Lorem ipsum throughout, with "Project Alpha / Project Beta" on
the projects page. All of it was removed:

- Neon/glass chrome → a sober audit-report document design; the
  richness lives in the content (the lifecycle record, the gas
  arithmetic), not in glow.
- Invented repos and star counts → three anonymised case files told
  as brief → decisions → outcome, with figures from the engagements'
  own (fictional) paperwork and the gas arithmetic printed in the
  open so a reader can check it.
- Lorem ipsum → full domain content: published fees, a services
  register with availability, a method page, and an honesty page
  stating what a review is not.
- The theme's promised interactivity → the Contract Lifecycle
  Explorer and the Gas Estimator, both working tools that teach the
  trade's actual arithmetic (gas used × gas price), labelled as
  illustration, never as a live quote.

## Technical notes

- Zero-build static: 4 HTML pages + css/style.css + js/main.js,
  the folder's original layout, preserved. template.json untouched.
- Gas estimator figures: native transfer 21,000 gas is the
  protocol-fixed figure; token/mint/swap classes (52,000 / 121,000 /
  148,000) are labelled illustrative on the page. Case file 02's
  arithmetic: 96,400 → 61,700 gas; at 25 gwei, 0.002410 → 0.001543
  ETH per claim; saving 0.000868 ETH × the client's modelled 40,000
  claims ≈ 34.7 ETH/year in their model — stated as their model on
  the page.
- Checks-effects-interactions is named on the site as the standard
  implementation pattern it is.
