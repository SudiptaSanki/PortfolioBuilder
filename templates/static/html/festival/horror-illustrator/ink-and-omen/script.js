/* Ink and Omen — plate desk, tilt, reveals, docket */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- reveal ---------- */
  const revealTargets = [
    '.section-head', '.ledger-list li', '.desk-head', '.desk-body',
    '.bestiary-grid article', '.steps li', '.outro > div', '.plate-card',
    '.prose > *', '.portrait', '.docket', '.side-card', '.page-head > *',
  ];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    revealTargets.forEach((sel) => $$(sel).forEach((el) => el.classList.add('rv')));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.rv').forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i % 6, 4) * 45}ms`;
      io.observe(el);
    });
  }

  /* ---------- 3d tilt ---------- */
  const tiltHosts = $$('[data-tilt]');
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    tiltHosts.forEach((host) => {
      const frame = $('.plate-frame', host) || $('.card-inner', host);
      if (!frame) return;
      host.addEventListener('pointermove', (e) => {
        const r = host.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        frame.style.transform = `rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
      });
      host.addEventListener('pointerleave', () => { frame.style.transform = ''; });
    });
  }

  /* ---------- omen data ---------- */
  const beings = {
    petni: {
      name: 'Petni',
      base: 7,
      line: 'She died unmarried and was not given the rites; the feet point the wrong way, and the sari is wet to the knee.',
      detail: 'Long hair, a sari heavy with water, and the small wrongness of the feet.',
    },
    nishi: {
      name: 'Nishi',
      base: 8,
      line: 'It calls in your own voice, twice, from behind the house. The first call may be answered. The second may not.',
      detail: 'Nothing to draw but the listening: a figure at the edge of the light and the air around it.',
    },
    skondhokata: {
      name: 'Skondhokata',
      base: 6,
      line: 'The headless one, who carries his head under his arm and stands in the lane until you turn back.',
      detail: 'A headless body, a head held under the left arm, and no hurry in the walk.',
    },
    mamdo: {
      name: 'Mamdo bhoot',
      base: 5,
      line: 'A tall thin figure at the edge of an orchard at dusk — mostly a story about the moment before you are certain you saw it.',
      detail: 'Overlong arms, a narrow head, and a silhouette that could still be a tree.',
    },
    begho: {
      name: 'Begho bhoot',
      base: 7,
      line: 'The spirit of someone murdered at that spot, who keeps to it and will not be moved. It sits closer than you expect.',
      detail: 'A seated figure against a wall, patient, occupying the one place you need to walk through.',
    }
  };

  const places = {
    pukur: {
      name: 'pond',
      base: 1,
      line: 'The pond has stone steps and a rope tied to a post; the water keeps its own light.',
      draw: (t) => `
        <path d="M0 486h560" stroke="#14110f" stroke-width="1.4"/>
        <path d="M34 486c46-8 96-9 146-3" stroke="#14110f" stroke-width="1" fill="none" opacity=".6"/>
        <ellipse cx="352" cy="562" rx="172" ry="54" fill="#14110f" opacity=".86"/>
        <ellipse cx="352" cy="562" rx="172" ry="54" fill="none" stroke="#e9e2d3" stroke-width=".8" opacity=".2"/>
        <g stroke="#e9e2d3" stroke-width=".9" fill="none" opacity=".38">
          <path d="M220 548c24-7 50-7 76 0M276 574c34-9 76-9 110 0M196 586c22-5 44-5 66 0M414 590c26-6 54-6 80 0M340 606c18-4 38-4 56 0M232 612c20-4 40-4 58 0"/>
        </g>
        <g stroke="#14110f" stroke-width="3.2" fill="none">
          <path d="M150 486v-64M150 432c-14-4-24-14-26-26"/>
          <path d="M150 486c10 4 18 4 26 0"/>
        </g>
        <path d="M150 486c-6 10-4 26 6 34" stroke="#14110f" stroke-width="1.6" fill="none"/>
        <path d="M138 490c-8 8-10 18-6 26" stroke="#14110f" stroke-width="1" fill="none" opacity=".7"/>
        <g stroke="#14110f" stroke-width="1.3" fill="none">
          <path d="M96 486h26v10h26v10h26v10h26"/>
          <path d="M122 486v10M148 496v10M174 506v10"/>
          <path d="M96 490h24M96 496h48" stroke-width=".8" opacity=".6"/>
        </g>
        <g stroke="#14110f" stroke-width="1.6" fill="none" opacity=".8">
          <path d="M104 490c-4-26 2-46 14-60M118 490c2-22 10-38 24-46M88 490c-8-18-8-34-2-46"/>
        </g>
        ${t}
      `
    },
    shashan: {
      name: 'cremation ground',
      base: 2,
      line: 'Ash, half-burnt wood, a fire that will not take, and a crow that has stopped pretending to be a bird.',
      draw: (t) => `
        <path d="M0 500h560" stroke="#14110f" stroke-width="1.6"/>
        <g stroke="#14110f" stroke-width="1.5" fill="none">
          <path d="M300 500l16-92 44 92M344 500l14-78 36 78"/>
          <path d="M320 458h44M332 486h44M328 470h38"/>
        </g>
        <path d="M352 408c-14-16-2-28 4-38 4 14 16 22 10 38-3 8-11 8-14 0Z" fill="#14110f"/>
        <g stroke="#14110f" stroke-width="1.1" fill="none" opacity=".5">
          <path d="M360 372c10-16 4-30-2-42M372 380c12-18 10-32 4-44M348 384c-10-14-6-26-2-36"/>
        </g>
        <g stroke="#14110f" stroke-width="1.2" fill="none" opacity=".7">
          <path d="M96 500c14-30 20-58 18-80M114 500c2-26 4-48 2-66M78 500c6-24 6-44 2-58"/>
        </g>
        <g fill="#14110f" opacity=".55">
          <circle cx="152" cy="486" r="2"/><circle cx="176" cy="496" r="1.5"/><circle cx="438" cy="490" r="2"/><circle cx="472" cy="504" r="1.5"/><circle cx="214" cy="508" r="2"/><circle cx="496" cy="470" r="1.4"/>
        </g>
        <path d="M414 424c10-8 22-8 30 0-10 6-20 6-30 0Z" fill="#14110f"/>
        ${t}
      `
    },
    aam: {
      name: 'mango orchard',
      base: 1,
      line: 'Low branches at shoulder height, a floor of dry leaves, cicadas, and no wind at all.',
      draw: (t) => `
        <path d="M0 512h560" stroke="#14110f" stroke-width="1.5"/>
        <g stroke="#14110f" fill="none">
          <path d="M92 512V300M92 372c-30-18-46-44-50-74M92 396c32-16 50-40 54-68M92 344c-18-14-28-30-30-48" stroke-width="5"/>
          <path d="M452 512V282M452 360c30-16 48-40 52-68M452 392c-30-16-46-40-50-66" stroke-width="6"/>
        </g>
        <g fill="#14110f" opacity=".92">
          <ellipse cx="58" cy="250" rx="52" ry="26"/><ellipse cx="118" cy="232" rx="46" ry="22"/><ellipse cx="150" cy="266" rx="44" ry="20"/>
          <ellipse cx="420" cy="238" rx="50" ry="24"/><ellipse cx="486" cy="262" rx="44" ry="22"/><ellipse cx="470" cy="214" rx="40" ry="18"/>
        </g>
        <g stroke="#14110f" stroke-width="1" opacity=".55" fill="none">
          <path d="M30 466c18-8 36-8 54 0M120 480c20-6 40-6 58 0M300 478c22-6 44-6 64 0M400 492c20-5 40-5 58 0M180 500c18-4 36-4 52 0"/>
        </g>
        <g fill="#14110f">
          <circle cx="498" cy="330" r="5"/><circle cx="514" cy="352" r="4.5"/><circle cx="70" cy="330" r="4.5"/>
        </g>
        ${t}
      `
    },
    stair: {
      name: 'stairwell',
      base: 1,
      line: 'One bulb on a wire, a landing, and a door at the top that has never been opened in your lifetime.',
      draw: (t) => `
        <path d="M0 512h560" stroke="#14110f" stroke-width="1.4"/>
        <path d="M40 512V96h210v416" stroke="#14110f" stroke-width="2" fill="none"/>
        <path d="M250 512V96" stroke="#14110f" stroke-width="1" opacity=".4"/>
        <path d="M96 512v-96h110v96M96 416h-0" stroke="#14110f" stroke-width="1.4" fill="none"/>
        <path d="M96 416h110M96 448h110M96 480h110" stroke="#14110f" stroke-width=".8" opacity=".5"/>
        <path d="M50 452h34v60H50z" fill="#14110f" opacity=".85"/>
        <path d="M392 512V210h128v302" stroke="#14110f" stroke-width="2" fill="none"/>
        <path d="M410 512V260h92v252" stroke="#14110f" stroke-width="1.4" fill="none"/>
        <circle cx="492" cy="386" r="3.5" fill="#14110f"/>
        <path d="M340 96c0 30 12 44 34 44M340 96v-34" stroke="#14110f" stroke-width="1.2" fill="none"/>
        <path d="M356 96a18 18 0 1 0 36 0 18 18 0 1 0-36 0Z" fill="#e9e2d3" stroke="#14110f" stroke-width="1.4"/>
        <g stroke="#14110f" stroke-width=".7" opacity=".3">
          <path d="M374 114v340M350 150l24 40M398 150l-24 40M330 250l44 70M418 250l-44 70"/>
        </g>
        <g stroke="#14110f" stroke-width="1" opacity=".35" fill="none">
          <path d="M260 512v-40h20v40M280 512v-80h20v80M300 512v-120h20v120"/>
        </g>
        ${t}
      `
    },
    rail: {
      name: 'rail line',
      base: 0,
      line: 'The 2:10 goods train, grass between the sleepers, and a horizon with nothing on it.',
      draw: (t) => `
        <path d="M0 476h560" stroke="#14110f" stroke-width="1.3"/>
        <g stroke="#14110f" stroke-width="1.5" fill="none">
          <path d="M282 476l-96 108M330 476l96 108"/>
          <path d="M296 470l-4-24M326 470l4-24"/>
        </g>
        <g stroke="#14110f" stroke-width="1" opacity=".6">
          <path d="M250 500h112M232 522h144M212 548h176M188 580h208"/>
        </g>
        <g stroke="#14110f" stroke-width="1" fill="none" opacity=".55">
          <path d="M84 486c-6-20 0-36 12-48M96 486c2-18 8-32 20-42M62 486c-4-14-2-26 4-36"/>
          <path d="M456 486c-4-18 2-32 14-44M470 486c0-16 6-30 18-38M506 486c-2-14 0-24 6-32"/>
        </g>
        <g fill="#14110f" opacity=".4">
          <circle cx="140" cy="470" r="1.4"/><circle cx="424" cy="470" r="1.4"/><circle cx="366" cy="466" r="1.2"/>
        </g>
        ${t}
      `
    }
  };

  const techs = {
    hatch: {
      name: 'hatching',
      base: 0,
      line: 'Parallel strokes, nib 0.3, no wash. The shadows are built rather than painted.',
      meta: 'Hatching · 0.3mm nib · Indian ink on cartridge'
    },
    stipple: {
      name: 'stipple',
      base: 1,
      line: 'Every value is a density of dots. It takes four times as long and cannot be corrected.',
      meta: 'Stipple · 0.1mm nib · Indian ink on Bristol'
    },
    dry: {
      name: 'dry brush',
      base: 1,
      line: 'A dry hog brush dragged across the tooth of the paper. The accidents are the drawing.',
      meta: 'Dry brush · hog filbert 6 · Indian ink on rough paper'
    }
  };

  function hatchPattern(id, angle, gap, opacity, width) {
    return `<pattern id="${id}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})">
      <line x1="0" y1="0" x2="0" y2="${gap}" stroke="#14110f" stroke-width="${width}" opacity="${opacity}"/>
    </pattern>`;
  }
  function dotPattern(id, gap, r, opacity) {
    return `<pattern id="${id}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse">
      <circle cx="${gap / 2}" cy="${gap / 2}" r="${r}" fill="#14110f" opacity="${opacity}"/>
    </pattern>`;
  }

  function figureFor(being) {
    const ink = '#0f0d0c';
    if (being === 'petni') {
      return `
        <ellipse cx="266" cy="516" rx="62" ry="7" fill="${ink}" opacity=".22"/>
        <g fill="${ink}">
          <path d="M238 516c-4-42-8-88-2-124 4-26 16-44 28-53 11-8 24-8 35 0 13 9 25 27 29 53 6 36 2 82-2 124z"/>
          <path d="M230 326c0-32 13-52 34-52s35 20 35 52c0 32-15 50-35 50s-34-18-34-50z"/>
          <path d="M230 342c-9 46-8 100-2 140 2 16 9 28 15 36 6-11 8-26 6-42-2-38 0-76 5-106zM298 342c9 46 8 100 2 140-2 16-9 28-15 36-6-11-8-26-6-42 2-38 0-76-5-106z"/>
          <path d="M234 366c-12 18-18 44-18 72 0 14 2 26 6 34 6-2 10-8 12-18 3-22 6-44 12-62zM300 372c10 20 14 44 13 70-1 14-4 24-8 30-6-4-9-12-9-22 0-20-2-42-8-60z" opacity=".95"/>
        </g>
        <g stroke="#3b322b" stroke-width="1.2" fill="none">
          <path d="M243 324c-8 38-11 82-9 126 1 20 4 38 7 54"/>
          <path d="M250 318c-3 32-1 62 2 88"/>
          <path d="M262 316c-1 30 1 56 5 76"/>
          <path d="M274 320c2 26 2 48 0 66"/>
          <path d="M288 330c4 30 3 60 1 82"/>
        </g>
        <g stroke="#e9e2d3" stroke-width=".7" opacity=".4" fill="none">
          <path d="M296 318c3 44 1 96-3 136"/>
          <path d="M244 370c-8 40-11 70-10 92M292 372c8 36 11 68 10 90"/>
        </g>
        <path d="M247 374c-7 34-8 58-7 74" stroke="#3b322b" stroke-width=".8" fill="none"/>
        <path d="M246 448c12 6 26 6 40 0M246 466c14 8 28 8 42 0M248 486c14 10 28 10 40 2" stroke="#e9e2d3" stroke-width=".8" opacity=".28" fill="none"/>
        <g fill="${ink}">
          <path d="M252 518c-5 2-9 6-9 10 0 4 5 6 10 5 6-1 9-5 8-9-1-3-5-5-9-6z"/>
          <path d="M282 518c5 0 9 3 9 7 0 4-5 6-10 6-5 0-9-3-9-6 0-4 5-7 10-7z"/>
        </g>
        <g stroke="#e9e2d3" stroke-width=".7" opacity=".35">
          <path d="M247 530h9M283 532h8"/>
        </g>`;
    }
    if (being === 'nishi') {
      return `
        <g opacity=".28" fill="${ink}">
          <path d="M380 512c-4-36-6-76-2-104 3-22 12-36 22-42 9-5 19-5 27 0 10 6 19 20 22 42 4 28 2 68-2 104z"/>
          <path d="M376 388c0-24 10-38 26-38s26 14 26 38-11 36-26 36-26-12-26-36z"/>
        </g>
        <g stroke="${ink}" fill="none" opacity=".55">
          <path d="M352 470c-22-14-34-32-34-52s12-38 34-52" stroke-width="1"/>
          <path d="M334 474c-26-16-40-34-40-56s14-40 40-56" stroke-width=".8" opacity=".7"/>
          <path d="M316 478c-30-18-46-38-46-60s16-42 46-60" stroke-width=".6" opacity=".5"/>
        </g>
        <g fill="${ink}">
          <path d="M220 424c4-4 8-4 12 0-4 4-8 4-12 0Z"/>
        </g>`;
    }
    if (being === 'skondhokata') {
      return `
        <g fill="${ink}">
          <path d="M236 512c-5-42-8-88-3-124 4-26 15-44 26-52 9-6 21-6 30 0 12 8 23 26 27 52 5 36 2 82-3 124z"/>
          <path d="M232 326c0-26 11-42 29-42 8 0 14 3 19 8-4-2-8-2-12-1-12 3-19 17-19 37 0 18 6 30 16 34-3 1-6 2-10 2-16 0-23-16-23-38z" opacity=".2"/>
        </g>
        <g fill="${ink}">
          <path d="M290 408c-2-26 8-44 26-48 16-3 28 7 30 24 3 20-6 34-22 38-16 3-31-2-34-14Z"/>
          <path d="M296 412l4 20 8-14z"/>
        </g>
        <g stroke="#e9e2d3" stroke-width=".8" opacity=".35" fill="none">
          <path d="M303 374c10-3 20 2 24 12M300 390c12-2 22 4 26 12"/>
        </g>
        <g stroke="${ink}" stroke-width="4.5" stroke-linecap="round" fill="none">
          <path d="M318 402c8 12 10 26 8 40"/>
          <path d="M260 438c12 10 24 12 36 8"/>
        </g>
        <g stroke="${ink}" stroke-width="5" stroke-linecap="round">
          <path d="M254 522c1 8 7 10 9 1M280 522c1 9 7 11 9 2"/>
        </g>`;
    }
    if (being === 'mamdo') {
      return `
        <g fill="${ink}">
          <path d="M242 512c-4-48-6-104-2-144 3-30 12-52 22-62 8-8 20-8 28 0 10 10 19 32 22 62 4 40 2 96-2 144z"/>
          <path d="M250 292c0-22 9-36 23-36s23 14 23 36-10 34-23 34-23-12-23-34z"/>
          <path d="M246 330c-18 12-30 40-34 78-3 28-1 60 4 88h14c-4-30-4-62-1-88 4-32 12-58 24-70zM300 330c18 12 30 40 34 78 3 28 1 60-4 88h-14c4-30 4-62 1-88-4-32-12-58-24-70z"/>
        </g>
        <g stroke="${ink}" stroke-width="4" stroke-linecap="round" fill="none">
          <path d="M249 522v10M288 522v10"/>
          <path d="M258 288c-2-10 4-16 14-16"/>
        </g>
        <g stroke="#e9e2d3" stroke-width=".7" opacity=".28" fill="none">
          <path d="M260 350c-10 40-12 80-8 116M288 350c8 40 8 80 4 116"/>
        </g>`;
    }
    return `
      <g fill="${ink}">
        <path d="M214 512c0-12 2-24 8-32 8-12 22-18 38-18 18 0 32 8 38 24 4 10 4 18 2 26z"/>
        <path d="M236 420c0-22 10-36 24-36s24 14 24 36-10 34-24 34-24-12-24-34z"/>
        <path d="M288 488c16 4 26 12 30 24h-18c-6-8-12-14-20-18z"/>
      </g>
      <g stroke="${ink}" stroke-width="4" stroke-linecap="round" fill="none">
        <path d="M246 494c12-6 26-6 40 0"/>
        <path d="M230 506h74"/>
        <path d="M258 394c4-6 12-6 16 0"/>
      </g>`;
  }

  function buildPlate(beingKey, placeKey, techKey) {
    const b = beings[beingKey];
    const p = places[placeKey];
    const t = techs[techKey];

    const sky = techKey === 'stipple'
      ? `<rect x="0" y="0" width="560" height="392" fill="url(#skyDots)"/>`
      : `<rect x="0" y="0" width="560" height="392" fill="url(#skyHatch)"/>`;

    const inkFigure = figureFor(beingKey);

    return `
      <title id="omen-title">Composed plate: ${b.name} at the ${p.name}, ${t.name}</title>
      <desc id="omen-desc">${captionFor(b, p, t).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</desc>
      <defs>
        ${hatchPattern('skyHatch', 32, techKey === 'hatch' ? 10 : 13, '.12', '.7')}
        ${hatchPattern('groundHatch', -18, 6, '.5', '1')}
        ${dotPattern('skyDots', 11, .9, '.16')}
        ${dotPattern('figDots', 5, 1.15, '.95')}
        ${hatchPattern('figHatch', 38, 5, '.98', '1.5')}
        ${hatchPattern('figDry', 12, 11, '.55', '6')}
        <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#e8e1d1"/><stop offset="1" stop-color="#ded5c2"/>
        </linearGradient>
      </defs>
      <rect width="560" height="700" fill="url(#paper)"/>
      <rect x="16" y="16" width="528" height="668" fill="none" stroke="#14110f" stroke-width="1"/>
      <rect x="24" y="24" width="512" height="652" fill="none" stroke="#14110f" stroke-width=".5" opacity=".5"/>
      ${sky}
      <circle cx="418" cy="116" r="46" fill="#e8e1d1" stroke="#14110f" stroke-width="1.2"/>
      <circle cx="418" cy="116" r="49" fill="none" stroke="#14110f" stroke-width=".5" opacity=".4"/>
      <g stroke="#14110f" stroke-width=".6" opacity=".3" fill="none">
        <path d="M418 92a24 24 0 0 1 0 48M418 98a18 18 0 0 0 0 36"/>
      </g>
      <g stroke="#14110f" stroke-width=".8" opacity=".45" fill="none">
        <path d="M52 78h96M52 88h58M52 98h78"/>
      </g>
      <text x="52" y="126" font-family="Space Mono, monospace" font-size="8" letter-spacing="2.5" fill="#14110f" opacity=".5">FIG. 1</text>
      ${p.draw('')}
      <rect x="0" y="392" width="560" height="4" fill="#14110f" opacity=".08"/>
      ${inkFigure}
      <ellipse cx="266" cy="512" rx="44" ry="4" fill="#14110f" opacity=".2"/>
      <g stroke="#14110f" stroke-width="1.2" fill="none" opacity=".75">
        <path d="M0 636c40-12 80-10 118 4M150 654c36-10 76-8 110 4M372 640c42-10 90-8 132 4"/>
      </g>
      <rect x="0" y="0" width="560" height="392" fill="${techKey === 'dry' ? 'url(#groundHatch)' : 'none'}" opacity=".08"/>
      <text x="40" y="676" font-family="Space Mono, monospace" font-size="9" letter-spacing="3" fill="#14110f" opacity=".55">INK AND OMEN · ${b.name.toUpperCase()}</text>
      <text x="520" y="676" text-anchor="end" font-family="Space Mono, monospace" font-size="9" letter-spacing="3" fill="#14110f" opacity=".55">KOLKATA · 2026</text>
    `;
  }

  function captionFor(b, p, t) {
    return `${b.name} at the ${p.name}, ${t.name}. ${b.line} ${p.line}`;
  }

  function dreadNote(n) {
    if (n >= 9) return 'A plate that gives the reader no safe place to look. Use once per book.';
    if (n >= 7) return 'Enough to keep the reader on the page; not enough to lose them.';
    if (n >= 5) return 'An uneasy image. It works if the page around it is quiet.';
    return 'Almost a landscape. The horror is in the caption, not the drawing.';
  }

  const state = { being: 'petni', place: 'pukur', tech: 'hatch' };
  let plateCount = 0;

  function renderOmen() {
    const svg = $('#omen-svg');
    if (!svg) return;
    const b = beings[state.being];
    const p = places[state.place];
    const t = techs[state.tech];
    svg.innerHTML = buildPlate(state.being, state.place, state.tech);
    plateCount += 1;
    const id = String(plateCount).padStart(3, '0');
    $('#plate-id').textContent = `OMN—PL. ${id}`;
    $('#omen-caption').textContent = captionFor(b, p, t);
    $('#omen-meta').textContent = t.meta;
    const dread = Math.max(1, Math.min(10, b.base + p.base + t.base));
    $('#dread-value').textContent = `${dread} / 10`;
    $('#dread-fill').style.width = `${dread * 10}%`;
    $('#dread-bar').setAttribute('aria-label', `Dread index, ${dread} out of 10`);
    $('#dread-note').textContent = dreadNote(dread);
  }

  const omenForm = $('#omen-form');
  if (omenForm) {
    omenForm.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      if (chip.dataset.being) {
        state.being = chip.dataset.being;
        $$('.chip[data-being]', omenForm).forEach((c) => {
          c.classList.toggle('is-set', c === chip);
          c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
        });
      }
      if (chip.dataset.place) {
        state.place = chip.dataset.place;
        $$('.chip[data-place]', omenForm).forEach((c) => {
          c.classList.toggle('is-set', c === chip);
          c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
        });
      }
      if (chip.dataset.tech) {
        state.tech = chip.dataset.tech;
        $$('.chip[data-tech]', omenForm).forEach((c) => {
          c.classList.toggle('is-set', c === chip);
          c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
        });
      }
      renderOmen();
    });
    renderOmen();
  }

  /* ---------- catalogue filter ---------- */
  const filters = $('.filters');
  if (filters) {
    const cards = $$('.plate-card');
    const count = $('.filter-count');
    const empty = $('.empty-note');
    const apply = (key) => {
      let shown = 0;
      cards.forEach((card) => {
        const match = key === 'all' || card.dataset.type === key;
        card.hidden = !match;
        if (match) shown += 1;
      });
      if (count) count.textContent = `${shown} of ${cards.length} plates`;
      if (empty) empty.classList.toggle('show', shown === 0);
    };
    filters.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      $$('.chip', filters).forEach((c) => {
        c.classList.toggle('is-set', c === chip);
        c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
      });
      apply(chip.dataset.filter);
    });
    apply('all');
  }

  /* ---------- commission docket ---------- */
  const form = $('#docket-form');
  if (form) {
    const fields = {
      name: { el: $('#c-name'), test: (v) => v.trim().length >= 2, msg: 'A name I can put on the file.' },
      email: { el: $('#c-email'), test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), msg: 'An address that accepts mail.' },
      project: { el: $('#c-project'), test: (v) => v !== '', msg: 'Choose the kind of project.' },
      deadline: { el: $('#c-deadline'), test: (v) => v !== '' && !Number.isNaN(Date.parse(v)), msg: 'A date, even an approximate one.' },
      brief: { el: $('#c-brief'), test: (v) => v.trim().length >= 40, msg: 'At least a few sentences about the work.' },
    };
    const success = $('#sent');

    Object.values(fields).forEach(({ el }) => {
      if (!el) return;
      el.addEventListener('input', () => {
        el.removeAttribute('aria-invalid');
        const err = $(`#${el.id}-err`);
        if (err) err.textContent = '';
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let firstBad = null;
      Object.entries(fields).forEach(([key, f]) => {
        if (!f.el) return;
        const bad = !f.test(f.el.value);
        if (bad) {
          f.el.setAttribute('aria-invalid', 'true');
          const err = $(`#${f.el.id}-err`);
          if (err) err.textContent = f.msg;
          if (!firstBad) firstBad = f.el;
        }
      });
      const agree = $('#c-agree');
      if (agree && !agree.checked) {
        if (!firstBad) firstBad = agree;
      }
      if (firstBad) {
        firstBad.focus({ preventScroll: false });
        return;
      }
      const name = fields.name.el.value.trim().split(/\s+/)[0];
      const out = $('#sent-name');
      if (out) out.textContent = name;
      form.hidden = true;
      success.hidden = false;
      success.focus?.();
      success.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  /* ---------- footer year done above ---------- */
})();
