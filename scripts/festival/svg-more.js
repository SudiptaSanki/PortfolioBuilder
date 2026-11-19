/**
 * festival/svg-more.js
 * Additional parametric SVG art modes for the Festival family:
 *   Garlands : lights, bunting, lanterns, sakura, pine, papel, vine
 *   Floats   : sakura, marigold, leaves, snow, stars, confetti, lanterns, fireflies, hearts
 *   Footers  : leaves-ground, snow-ground, waves
 *   Patterns : snowflake, starburst
 * All animation is SMIL-based (no JS required at view time).
 */

const { prng, hashSeed } = require('./svg');
const spl = '.45 0 .55 1;.45 0 .55 1';

// ---------------------------------------------------------------------------
// Shared: falling-column scaffolding (same motion rig as flowersSVG)
// ---------------------------------------------------------------------------
function floatColumns({ W = 1440, H = 900, columns = 12, defs, instanceFor }) {
  let body = '';
  for (let i = 0; i < columns; i++) {
    body += instanceFor(i);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" opacity="1">${defs}${body}</svg>`;
}

function fallColumn(i, rnd, { W, H, columns, inner }) {
  const x = Math.round(((i + 0.5) / columns) * W + (rnd() - 0.5) * 60);
  const dur = (22 + rnd() * 16).toFixed(2);
  const begin = (-rnd() * 24).toFixed(2);
  const swayDur = (5.5 + rnd() * 4).toFixed(2);
  const swayAmp = (11 + rnd() * 10).toFixed(1);
  const spinDur = (10 + rnd() * 9).toFixed(2);
  const spinDir = rnd() > 0.5 ? '0;-360' : '0;360';
  const squashDur = (3.8 + rnd() * 2.2).toFixed(2);
  const scale = (1.1 + rnd() * 1.0).toFixed(2);
  const loop = H + 360;
  return `
  <g transform="translate(${x} 0)">
    <g><animateTransform attributeName="transform" type="translate" values="0 -170;0 ${H + 190}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite" calcMode="linear"/>
      <g id="col${i}">${inner(i)}</g>
      <use href="#col${i}" y="${-loop}"/>
    </g>
  </g>`;
}

// ---------------------------------------------------------------------------
// GARLANDS (top banner, viewBox 1440x110)
// ---------------------------------------------------------------------------

/** String fairy lights with glowing hanging bulbs. */
function garlandLights({ wire = '#5a4632', bulbs, glowId = 'gl' }, seedStr, { W = 1440 } = {}) {
  const rnd = prng(hashSeed(seedStr));
  let body = `<path d="M0 8 Q${W / 4} ${58} ${W / 2} 8 Q${(3 * W) / 4} ${58} ${W} 8" fill="none" stroke="${wire}" stroke-width="1.6"/>`;
  const arcs = [
    { x0: 0, cx: W / 4, x1: W / 2 },
    { x0: W / 2, cx: (3 * W) / 4, x1: W }
  ];
  for (let a = 0; a < arcs.length; a++) {
    const { x0, cx, x1 } = arcs[a];
    for (let k = 1; k <= 9; k++) {
      const u = k / 10;
      const bx = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1;
      const by = (1 - u) * (1 - u) * 8 + 2 * (1 - u) * u * 58 + u * u * 8;
      const c = bulbs[(a * 9 + k) % bulbs.length];
      const d = (9 + rnd() * 10).toFixed(1);
      body += `<g transform="translate(${bx.toFixed(1)} ${by.toFixed(1)})">
        <line x1="0" y1="0" x2="0" y2="${d}" stroke="${wire}" stroke-width="1"/>
        <rect x="-2.6" y="${d}" width="5.2" height="3.4" rx="1" fill="${wire}"/>
        <circle cx="0" cy="${+d + 9}" r="4.6" fill="${c}" filter="url(#${glowId})"><animate attributeName="opacity" values="1;.25;1" dur="${(1.2 + rnd() * 1.6).toFixed(2)}s" begin="${(-rnd() * 2.4).toFixed(2)}s" repeatCount="indefinite"/></circle>
      </g>`;
    }
  }
  return wrapGarland(body, glowId, W);
}

/** Triangle flag bunting (Oktoberfest / carnival / celebration). */
function garlandBunting({ flags, rope = '#7a5a34' }, seedStr, { W = 1440 } = {}) {
  const rnd = prng(hashSeed(seedStr));
  let body = `<path d="M0 10 Q${W / 4} ${44} ${W / 2} 12 Q${(3 * W) / 4} ${44} ${W} 10" fill="none" stroke="${rope}" stroke-width="1.8"/>`;
  const n = Math.round(W / 48);
  for (let i = 0; i < n; i++) {
    const x = i * 48 + 2;
    const wave = Math.sin((x / W) * Math.PI * 2) * 8;
    const c = flags[i % flags.length];
    const swayDur = (3.6 + rnd() * 1.8).toFixed(2);
    const h = 40 + rnd() * 14;
    body += `<g transform="translate(${x} ${10 + wave})">
      <g><animateTransform attributeName="transform" type="rotate" values="-2.4 23 0;2.4 23 0;-2.4 23 0" dur="${swayDur}s" begin="${(-rnd() * 3).toFixed(2)}s" calcMode="spline" keyTimes="0;.5;1" keySplines="${spl}" repeatCount="indefinite"/>
        <path d="M0 0 L46 0 L23 ${h} Z" fill="${c}" stroke="rgba(0,0,0,.14)" stroke-width=".8"/>
        <circle cx="23" cy="${h * 0.42}" r="4.5" fill="rgba(255,255,255,.35)"/>
      </g></g>`;
  }
  return wrapGarland(body, 'gl', W);
}

/** Hanging paper/festival lanterns on strings (Lunar New Year, Eid fanous, mid-autumn). */
function garlandLanterns({ colors, glow, rope = '#8a5a28' }, seedStr, { W = 1440 } = {}) {
  const rnd = prng(hashSeed(seedStr));
  let body = `<path d="M0 8 H${W}" stroke="${rope}" stroke-width="1.8"/>`;
  const n = Math.round(W / 96);
  for (let i = 0; i < n; i++) {
    const x = i * 96 + 48;
    const drop = 12 + rnd() * 22;
    const c = colors[i % colors.length];
    const swayDur = (4 + rnd() * 2).toFixed(2);
    const big = rnd() > 0.55;
    body += `<g transform="translate(${x} 8)">
      <g><animateTransform attributeName="transform" type="rotate" values="-3.4 0 0;3.4 0 0;-3.4 0 0" dur="${swayDur}s" begin="${(-rnd() * 4).toFixed(2)}s" calcMode="spline" keyTimes="0;.5;1" keySplines="${spl}" repeatCount="indefinite"/>
        <line x1="0" y1="0" x2="0" y2="${drop}" stroke="${rope}" stroke-width="1.2"/>
        <rect x="-9" y="${drop}" width="18" height="4.5" rx="1.6" fill="${glow}"/>
        <ellipse cx="0" cy="${drop + 22}" rx="${big ? 17 : 13}" ry="${big ? 21 : 16}" fill="${c}" opacity=".94"/>
        <ellipse cx="0" cy="${drop + 22}" rx="${big ? 9 : 7}" ry="${big ? 13 : 10}" fill="rgba(255,255,255,.28)"/>
        <rect x="-8" y="${drop + (big ? 39 : 30)}" width="16" height="4" rx="1.6" fill="${glow}"/>
        <line x1="0" y1="${drop + (big ? 43 : 34)}" x2="0" y2="${drop + (big ? 56 : 45)}" stroke="${glow}" stroke-width="1.6"/>
        <circle cx="0" cy="${drop + (big ? 58 : 47)}" r="2.4" fill="${glow}"/>
        <circle cx="0" cy="${drop + 22}" r="${big ? 12 : 9}" fill="#fff" opacity=".22" filter="url(#gl)"><animate attributeName="opacity" values=".25;.5;.25" dur="${(2 + rnd() * 2).toFixed(2)}s" repeatCount="indefinite"/></circle>
      </g></g>`;
  }
  return wrapGarland(body, 'gl', W);
}

/** Cherry-blossom branch across the top (Hanami). */
function garlandSakura({ branch = '#6b4a33', pinks, deep = '#c2415a' }, seedStr, { W = 1440 } = {}) {
  const rnd = prng(hashSeed(seedStr));
  let body = `<g><animateTransform attributeName="transform" type="rotate" values="-.7 ${W / 2} -20;.7 ${W / 2} -20;-.7 ${W / 2} -20" dur="7s" calcMode="spline" keyTimes="0;.5;1" keySplines="${spl}" repeatCount="indefinite"/>
  <path d="M0 12 Q${W * 0.25} ${44} ${W * 0.5} 26 Q${W * 0.75} ${44} ${W} 12" fill="none" stroke="${branch}" stroke-width="4" stroke-linecap="round"/>`;
  const subN = 10;
  for (let i = 0; i < subN; i++) {
    const x = 60 + i * ((W - 120) / (subN - 1)) + (rnd() - 0.5) * 30;
    const y = 24 + rnd() * 12;
    const dx = (rnd() - 0.5) * 70;
    const dy = 26 + rnd() * 16;
    body += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} Q${(x + dx / 2).toFixed(1)} ${(y + dy * 0.7).toFixed(1)} ${(x + dx).toFixed(1)} ${(y + dy).toFixed(1)}" fill="none" stroke="${branch}" stroke-width="2.2" stroke-linecap="round"/>`;
    const bx = x + dx, by = y + dy;
    for (let b = 0; b < 3; b++) {
      const px = bx + (rnd() - 0.5) * 34;
      const py = by + (rnd() - 0.5) * 22;
      const s = (0.7 + rnd() * 0.55).toFixed(2);
      const pk = pinks[(i * 3 + b) % pinks.length];
      body += blossom(px.toFixed(1), py.toFixed(1), s, pk, deep, rnd);
    }
    // leaf pair
    body += `<ellipse cx="${(x + dx / 3).toFixed(1)}" cy="${(y + 8).toFixed(1)}" rx="9" ry="3.6" transform="rotate(${(rnd() * 60 - 30).toFixed(0)} ${(x + dx / 3).toFixed(1)} ${(y + 8).toFixed(1)})" fill="#5a8a3c" opacity=".85"/>`;
  }
  body += `</g>`;
  return wrapGarland(body, 'gl', W);
}

function blossom(cx, cy, s, petal, deep, rnd) {
  let petals = '';
  for (let k = 0; k < 5; k++) {
    petals += `<ellipse rx="4.6" ry="7.4" transform="rotate(${k * 72}) translate(0 -6.4)"/>`;
  }
  return `<g transform="translate(${cx} ${cy}) scale(${s})" fill="${petal}">${petals}<circle r="2.6" fill="${deep}"/></g>`;
}

/** Pine garland with baubles and lights (Christmas). */
function garlandPine({ greens, baubles, lights, snowTip = false }, seedStr, { W = 1440, arc = 130 } = {}) {
  const rnd = prng(hashSeed(seedStr));
  let body = `<path d="M0 8 H${W}" stroke="#3a2a1a" stroke-width="1.6"/>`;
  const arcs = Math.round(W / arc);
  for (let i = 0; i < arcs; i++) {
    const x0 = i * arc, x1 = x0 + arc, cx = x0 + arc / 2, cy = 8 + 42;
    body += `<path d="M${x0} 8 Q${cx} ${cy} ${x1} 8" fill="none" stroke="${greens[0]}" stroke-width="7" stroke-linecap="round" opacity=".95"/>`;
    body += `<path d="M${x0} 8 Q${cx} ${cy} ${x1} 8" fill="none" stroke="${greens[1]}" stroke-width="3.4" stroke-linecap="round" opacity=".9" transform="translate(0 -3)"/>`;
    // needle ticks
    for (let k = 1; k <= 7; k++) {
      const u = k / 8;
      const bx = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1;
      const by = (1 - u) * (1 - u) * 8 + 2 * (1 - u) * u * cy + u * u * 8;
      const a = (rnd() * 80 - 40).toFixed(0);
      body += `<path d="M${bx.toFixed(1)} ${by.toFixed(1)} l${(rnd() * 10 - 5).toFixed(1)} ${(rnd() * -14 - 6).toFixed(1)}" stroke="${greens[(k + i) % greens.length]}" stroke-width="1.8" stroke-linecap="round"/>`;
      body += `<path d="M${bx.toFixed(1)} ${by.toFixed(1)} l${(rnd() * 12 - 6).toFixed(1)} ${(rnd() * 10 + 5).toFixed(1)}" stroke="${greens[(k + i + 1) % greens.length]}" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>`;
    }
    // baubles
    for (const u of [0.28, 0.72]) {
      const bx = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1;
      const by = (1 - u) * (1 - u) * 8 + 2 * (1 - u) * u * cy + u * u * 8;
      const c = baubles[(i + (u < 0.5 ? 0 : 1)) % baubles.length];
      body += `<g transform="translate(${bx.toFixed(1)} ${(by + 9).toFixed(1)})">
        <line x1="0" y1="-6" x2="0" y2="0" stroke="#3a2a1a" stroke-width="1.2"/>
        <circle r="7.4" fill="${c}"/>
        <circle cx="-2.4" cy="-2.6" r="2.2" fill="rgba(255,255,255,.55)"/>
        <rect x="-3" y="-8.6" width="6" height="3.4" rx="1.2" fill="#c9a227"/>
      </g>`;
    }
    // lights
    for (const u of [0.16, 0.5, 0.85]) {
      const bx = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1;
      const by = (1 - u) * (1 - u) * 8 + 2 * (1 - u) * u * cy + u * u * 8;
      const c = lights[(i * 3 + Math.round(u * 3)) % lights.length];
      body += `<circle cx="${bx.toFixed(1)}" cy="${(by + 2).toFixed(1)}" r="3" fill="${c}" filter="url(#gl)"><animate attributeName="opacity" values="1;.2;1" dur="${(1.3 + rnd() * 1.4).toFixed(2)}s" begin="${(-rnd() * 2.2).toFixed(2)}s" repeatCount="indefinite"/></circle>`;
    }
    if (snowTip) {
      const bx = cx, by = cy + 6;
      body += `<circle cx="${bx}" cy="${by}" r="2.2" fill="#fff" opacity=".8"/>`;
    }
  }
  return wrapGarland(body, 'gl', W);
}

/** Papel picado banners (Día de Muertos / Mexican fiestas). */
function garlandPapel({ papers, rope = '#5a3a5a' }, seedStr, { W = 1440 } = {}) {
  const rnd = prng(hashSeed(seedStr));
  let body = `<path d="M0 8 Q${W / 4} ${20} ${W / 2} 8 Q${(3 * W) / 4} ${20} ${W} 8" fill="none" stroke="${rope}" stroke-width="1.8"/>`;
  const n = Math.round(W / 130);
  for (let i = 0; i < n; i++) {
    const x = i * 130 + 12;
    const y = 9 + Math.sin((x / W) * Math.PI * 2) * 8;
    const c = papers[i % papers.length];
    const swayDur = (4 + rnd() * 2).toFixed(2);
    let cuts = '';
    const shapes = [[28, 22, 'c'], [72, 22, 'c'], [50, 40, 'd'], [28, 44, 'd'], [72, 44, 'd']];
    for (const [sx, sy, kind] of shapes) {
      if (kind === 'c') cuts += `<circle cx="${sx}" cy="${sy}" r="7" fill="rgba(0,0,0,.28)"/>`;
      else cuts += `<rect x="${sx - 6}" y="${sy - 6}" width="12" height="12" transform="rotate(45 ${sx} ${sy})" fill="rgba(0,0,0,.28)"/>`;
    }
    body += `<g transform="translate(${x} ${y})">
      <g><animateTransform attributeName="transform" type="rotate" values="-1.8 50 0;1.8 50 0;-1.8 50 0" dur="${swayDur}s" begin="${(-rnd() * 4).toFixed(2)}s" calcMode="spline" keyTimes="0;.5;1" keySplines="${spl}" repeatCount="indefinite"/>
        <path d="M0 0 H100 V52 ${[100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0].map(px => `Q${px - 5} 64 ${px - 10} 52`).join('')} Z" fill="${c}" stroke="rgba(0,0,0,.18)" stroke-width=".8"/>
        ${cuts}
      </g></g>`;
  }
  return wrapGarland(body, 'gl', W);
}

/** Flowering vine garland (spring / Easter / harvest / general). */
function garlandVine({ leafGreens, flowerColors, deep = '#c2410c' }, seedStr, { W = 1440 } = {}) {
  const rnd = prng(hashSeed(seedStr));
  let body = `<path d="M0 14 Q${W * 0.25} ${48} ${W * 0.5} 20 Q${W * 0.75} ${48} ${W} 14" fill="none" stroke="#3e6b2a" stroke-width="2.6"/>`;
  const n = Math.round(W / 64);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const x = u * W;
    const y = 14 + Math.sin(u * Math.PI * 2) * -14 + 18 * Math.sin(Math.PI * u);
    const leafSide = i % 2 === 0 ? -1 : 1;
    body += `<ellipse cx="${x.toFixed(1)}" cy="${(y + leafSide * 7).toFixed(1)}" rx="10" ry="4.2" transform="rotate(${(leafSide * 32).toFixed(0)} ${x.toFixed(1)} ${(y + leafSide * 7).toFixed(1)})" fill="${leafGreens[i % leafGreens.length]}"/>`;
    if (i % 3 === 1) {
      const s = (0.85 + rnd() * 0.5).toFixed(2);
      const c = flowerColors[(i / 3 | 0) % flowerColors.length];
      body += `<g transform="translate(${x.toFixed(1)} ${(y + 12).toFixed(1)}) scale(${s})" fill="${c}">${[0, 72, 144, 216, 288].map(a => `<ellipse rx="5" ry="8" transform="rotate(${a}) translate(0 -7)"/>`).join('')}<circle r="2.8" fill="${deep}"/></g>`;
    }
  }
  return wrapGarland(body, 'gl', W);
}

function wrapGarland(body, glowId = 'gl', W = 1440) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 110" width="${W}" height="110" preserveAspectRatio="xMidYMin meet">
  <defs>
    <filter id="${glowId}" x="-300%" y="-300%" width="700%" height="700%">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  ${body}</svg>`;
}

// ---------------------------------------------------------------------------
// FLOATS (full-viewport animated background)
// ---------------------------------------------------------------------------

function floatSakura(fx, seedStr, opts = {}) {
  const rnd = prng(hashSeed(seedStr + 'f'));
  const petal = fx.petal || '#f9a8c9', deep = fx.core || '#c2415a', edge = fx.edge || 'rgba(255,255,255,.55)';
  const defs = `<defs><g id="sk"><ellipse rx="7" ry="11" transform="rotate(0) translate(0 -9)"/><ellipse rx="7" ry="11" transform="rotate(72) translate(0 -9)"/><ellipse rx="7" ry="11" transform="rotate(144) translate(0 -9)"/><ellipse rx="7" ry="11" transform="rotate(216) translate(0 -9)"/><ellipse rx="7" ry="11" transform="rotate(288) translate(0 -9)"/></g></defs>`;
  return floatColumns({
    ...opts, defs,
    instanceFor: (i) => fallColumn(i, rnd, {
      W: opts.W || 1440, H: opts.H || 900, columns: opts.columns || 13,
      inner: () => `<g transform="scale(${(1.1 + rnd() * 0.8).toFixed(2)})"><g fill="${petal}" stroke="${edge}" stroke-width=".7"><use href="#sk"/><animateTransform attributeName="transform" type="rotate" values="${rnd() > .5 ? '0;-360' : '0;360'}" dur="${(9 + rnd() * 10).toFixed(1)}s" repeatCount="indefinite"/></g><circle r="2.4" fill="${deep}"/></g>`
    })
  });
}

function floatMarigold(fx, seedStr, opts = {}) {
  const rnd = prng(hashSeed(seedStr + 'f'));
  const A = fx.petal || '#fbbf24', B = fx.core || '#ea580c';
  const marigold = `<g id="mg">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<circle cx="${(6 * Math.cos(a * Math.PI / 180)).toFixed(2)}" cy="${(6 * Math.sin(a * Math.PI / 180)).toFixed(2)}" r="3.4" fill="${A}"/>`).join('')}${[30, 90, 150, 210, 270, 330].map(a => `<circle cx="${(3.1 * Math.cos(a * Math.PI / 180)).toFixed(2)}" cy="${(3.1 * Math.sin(a * Math.PI / 180)).toFixed(2)}" r="2.8" fill="${B}" opacity=".85"/>`).join('')}<circle r="2" fill="${B}"/></g>`;
  const defs = `<defs>${marigold}</defs>`;
  return floatColumns({
    ...opts, defs,
    instanceFor: (i) => fallColumn(i, rnd, {
      W: opts.W || 1440, H: opts.H || 900, columns: opts.columns || 11,
      inner: () => `<g transform="scale(${(1.0 + rnd() * 0.8).toFixed(2)})"><g><animateTransform attributeName="transform" type="rotate" values="${rnd() > .5 ? '0;-360' : '0;360'}" dur="${(10 + rnd() * 10).toFixed(1)}s" repeatCount="indefinite"/><use href="#mg"/></g></g>`
    })
  });
}

function floatLeaves(fx, seedStr, opts = {}) {
  const rnd = prng(hashSeed(seedStr + 'f'));
  const colors = fx.leaves || ['#c2703d', '#d97706', '#a16207', '#b45309', '#9a3412'];
  const defs = `<defs><g id="lf"><path d="M0 -12 C10 -12 16 -4 14 6 C8 14 -4 12 -8 4 C-10 -4 -6 -10 0 -12 Z" stroke="rgba(0,0,0,.18)" stroke-width=".8"/><path d="M0 -10 Q2 0 -2 10" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1"/></g></defs>`;
  return floatColumns({
    ...opts, defs,
    instanceFor: (i) => fallColumn(i, rnd, {
      W: opts.W || 1440, H: opts.H || 900, columns: opts.columns || 10,
      inner: () => `<g transform="scale(${(1.0 + rnd() * 0.8).toFixed(2)})"><g fill="${colors[i % colors.length]}"><use href="#lf"/><animateTransform attributeName="transform" type="rotate" values="${rnd() > .5 ? '0;-360' : '0;360'}" dur="${(11 + rnd() * 9).toFixed(1)}s" repeatCount="indefinite"/></g></g>`
    })
  });
}

function floatSnow(fx, seedStr, opts = {}) {
  const rnd = prng(hashSeed(seedStr + 'f'));
  const c = fx.petal || '#eaf4ff';
  const defs = `<defs>
    <g id="sf" stroke="${c}" stroke-width="1.3" stroke-linecap="round">
      ${[0, 60, 120, 180, 240, 300].map(a => `<g transform="rotate(${a})"><line y2="-11"/><line x1="0" y1="-7" x2="3.4" y2="-10"/><line x1="0" y1="-7" x2="-3.4" y2="-10"/></g>`).join('')}
    </g>
    <circle id="sd" r="2.1" fill="${c}" opacity=".85"/>
  </defs>`;
  return floatColumns({
    ...opts, defs,
    instanceFor: (i) => {
      const flake = i % 3 !== 2;
      return fallColumn(i, rnd, {
        W: opts.W || 1440, H: opts.H || 900, columns: opts.columns || 14,
        inner: () => flake
          ? `<g transform="scale(${(0.8 + rnd() * 0.8).toFixed(2)})"><g><animateTransform attributeName="transform" type="rotate" values="${rnd() > .5 ? '0;360' : '0;-360'}" dur="${(14 + rnd() * 12).toFixed(1)}s" repeatCount="indefinite"/><use href="#sf"/></g></g>`
          : `<use href="#sd" transform="scale(${(1 + rnd()).toFixed(2)})"/>`
      });
    }
  });
}

function floatStars(fx, seedStr, opts = {}) {
  const rnd = prng(hashSeed(seedStr + 'f'));
  const c = fx.petal || '#fbbf24';
  const defs = `<defs>
    <path id="st" d="M0 -9 L2.2 -2.2 L9 0 L2.2 2.2 L0 9 L-2.2 2.2 L-9 0 L-2.2 -2.2 Z" fill="${c}"/>
    <filter id="tw" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>`;
  // stars twinkle in place (no falling) — scattered fixed positions with drift
  let body = '';
  const n = 26;
  for (let i = 0; i < n; i++) {
    const x = (rnd() * 1440).toFixed(0), y = (rnd() * 900).toFixed(0);
    const s = (0.5 + rnd() * 1.1).toFixed(2);
    const dur = (1.6 + rnd() * 2.6).toFixed(2);
    const driftDur = (9 + rnd() * 8).toFixed(1);
    const dx = (rnd() * 60 - 30).toFixed(0);
    body += `<g transform="translate(${x} ${y})">
      <g><animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${(rnd() * 40 - 20).toFixed(0)};0 0" dur="${driftDur}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines="${spl}"/>
        <g filter="url(#tw)"><g transform="scale(${s})"><use href="#st"/><animate attributeName="opacity" values="1;.15;1" dur="${dur}s" begin="${(-rnd() * 3).toFixed(2)}s" repeatCount="indefinite"/></g></g>
      </g></g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" width="1440" height="900" preserveAspectRatio="xMidYMid slice">${defs}${body}</svg>`;
}

function floatFireflies(fx, seedStr, opts = {}) {
  const rnd = prng(hashSeed(seedStr + 'f'));
  const c = fx.petal || '#fbbf24', c2 = fx.core || '#a3e635';
  const defs = `<defs><filter id="ff" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
  let body = '';
  const n = 24;
  for (let i = 0; i < n; i++) {
    const x = (60 + rnd() * 1320).toFixed(0), y = (80 + rnd() * 760).toFixed(0);
    const r = (1.8 + rnd() * 1.6).toFixed(1);
    const col = i % 3 === 0 ? c2 : c;
    const dx1 = (rnd() * 120 - 60).toFixed(0), dy1 = (rnd() * 90 - 45).toFixed(0);
    const dx2 = (rnd() * 120 - 60).toFixed(0), dy2 = (rnd() * 90 - 45).toFixed(0);
    const dur = (7 + rnd() * 7).toFixed(1);
    const flick = (1.1 + rnd() * 1.7).toFixed(2);
    body += `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" filter="url(#ff)">
      <animateTransform attributeName="transform" type="translate" values="0 0;${dx1} ${dy1};${dx2} ${dy2};0 0" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.33;.66;1" keySplines="${spl};${spl};${spl}"/>
      <animate attributeName="opacity" values=".1;1;.1" dur="${flick}s" begin="${(-rnd() * 2).toFixed(2)}s" repeatCount="indefinite"/>
    </circle>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" width="1440" height="900" preserveAspectRatio="xMidYMid slice">${defs}${body}</svg>`;
}

function floatConfetti(fx, seedStr, opts = {}) {
  const rnd = prng(hashSeed(seedStr + 'f'));
  const colors = fx.confetti || ['#f43f5e', '#22d3ee', '#facc15', '#a78bfa', '#34d399'];
  const defs = `<defs>
    <rect id="cf1" x="-5" y="-2" width="10" height="4" rx="1.4"/>
    <circle id="cf2" r="3"/>
  </defs>`;
  return floatColumns({
    ...opts, defs,
    instanceFor: (i) => {
      const shape = i % 2 === 0 ? 'cf1' : 'cf2';
      const c = colors[i % colors.length];
      return fallColumn(i, rnd, {
        W: opts.W || 1440, H: opts.H || 900, columns: opts.columns || 16,
        inner: () => `<g fill="${c}" opacity=".9"><use href="#${shape}"/><animateTransform attributeName="transform" type="rotate" from="0" to="${rnd() > .5 ? 360 : -360}" dur="${(6 + rnd() * 6).toFixed(1)}s" repeatCount="indefinite"/></g>`
      });
    }
  });
}

/** Sky lanterns rising slowly from the bottom (Lunar New Year / mid-autumn). */
function floatLanterns(fx, seedStr, opts = {}) {
  const rnd = prng(hashSeed(seedStr + 'f'));
  const body = fx.petal || '#fbbf24', glow = fx.core || '#f97316';
  const defs = `<defs>
    <g id="skl">
      <ellipse rx="13" ry="16" fill="${body}"/>
      <ellipse rx="6.5" ry="9" fill="#fff" opacity=".3"/>
      <rect x="-8" y="-19" width="16" height="4" rx="1.6" fill="${glow}"/>
      <rect x="-7" y="13" width="14" height="3.4" rx="1.4" fill="${glow}"/>
      <circle cy="0" r="9" fill="#fff" opacity=".16" filter="url(#skg)"/>
    </g>
    <filter id="skg" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>`;
  let out = '';
  const columns = opts.columns || 9;
  for (let i = 0; i < columns; i++) {
    const x = Math.round(((i + 0.5) / columns) * 1440 + (rnd() - 0.5) * 70);
    const dur = (26 + rnd() * 18).toFixed(1);
    const begin = (-rnd() * 30).toFixed(1);
    const swayDur = (5 + rnd() * 3).toFixed(2);
    const scale = (0.9 + rnd() * 0.9).toFixed(2);
    const flick = (1.4 + rnd() * 1.8).toFixed(2);
    out += `<g transform="translate(${x} 0)">
      <g><animateTransform attributeName="transform" type="translate" values="0 ${900 + 160};0 -160" dur="${dur}s" begin="${begin}s" repeatCount="indefinite" calcMode="linear"/>
        <g><animateTransform attributeName="transform" type="translate" values="-14 0;14 0;-14 0" dur="${swayDur}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines="${spl}"/>
          <g transform="scale(${scale})"><use href="#skl"/><animate attributeName="opacity" values=".95;.7;.95" dur="${flick}s" repeatCount="indefinite"/></g>
        </g>
      </g>
    </g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" width="1440" height="900" preserveAspectRatio="xMidYMid slice">${defs}${out}</svg>`;
}

function floatHearts(fx, seedStr, opts = {}) {
  const rnd = prng(hashSeed(seedStr + 'f'));
  const A = fx.petal || '#fb7185', B = fx.core || '#f43f5e';
  const defs = `<defs><path id="ht" d="M0 -3 C-3 -9 -12 -8 -12 -1 C-12 6 -5 10 0 14 C5 10 12 6 12 -1 C12 -8 3 -9 0 -3 Z"/></defs>`;
  return floatColumns({
    ...opts, defs,
    instanceFor: (i) => fallColumn(i, rnd, {
      W: opts.W || 1440, H: opts.H || 900, columns: opts.columns || 12,
      inner: () => `<g transform="scale(${(0.8 + rnd() * 0.7).toFixed(2)})"><g fill="${i % 3 === 0 ? B : A}"><use href="#ht"/><animateTransform attributeName="transform" type="rotate" values="${rnd() > .5 ? '0;360' : '0;-360'}" dur="${(10 + rnd() * 8).toFixed(1)}s" repeatCount="indefinite"/></g></g>`
    })
  });
}

// ---------------------------------------------------------------------------
// FOOTERS (bottom band, viewBox 1440x150)
// ---------------------------------------------------------------------------
function footerLeaves(fx, seedStr, { W = 1440, H = 150 } = {}) {
  const rnd = prng(hashSeed(seedStr));
  const colors = fx.leaves || ['#c2703d', '#d97706', '#a16207', '#b45309'];
  let leaves = '';
  for (let i = 0; i < 26; i++) {
    const x = (rnd() * W).toFixed(0);
    const y = H - 12 - rnd() * 46;
    const rot = (rnd() * 90 - 45).toFixed(0);
    const s = (0.8 + rnd() * 1).toFixed(2);
    const c = colors[i % colors.length];
    leaves += `<g transform="translate(${x} ${y.toFixed(0)}) rotate(${rot}) scale(${s})" fill="${c}" opacity=".92"><path d="M0 -11 C9 -11 15 -4 13 5 C7 13 -4 11 -8 4 C-9 -3 -5 -9 0 -11 Z"/><path d="M0 -9 Q2 0 -2 9" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1"/></g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMax meet">${leaves}</svg>`;
}

function footerSnow(fx, seedStr, { W = 1440, H = 150 } = {}) {
  const rnd = prng(hashSeed(seedStr));
  const c = fx.petal || '#f2f7fd';
  let sparkle = '';
  for (let i = 0; i < 22; i++) {
    const x = (rnd() * W).toFixed(0), y = (H - 8 - rnd() * 40).toFixed(0);
    sparkle += `<circle cx="${x}" cy="${y}" r="${(1.2 + rnd() * 1.6).toFixed(1)}" fill="#fff" opacity=".9"><animate attributeName="opacity" values=".9;.2;.9" dur="${(1.6 + rnd() * 2).toFixed(2)}s" begin="${(-rnd() * 2).toFixed(2)}s" repeatCount="indefinite"/></circle>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMax meet">
    <path d="M0 ${H} L0 ${H - 34} Q${W * 0.2} ${H - 52} ${W * 0.38} ${H - 30} Q${W * 0.55} ${H - 12} ${W * 0.72} ${H - 36} Q${W * 0.88} ${H - 54} ${W} ${H - 30} L${W} ${H} Z" fill="${c}" opacity=".95"/>
    ${sparkle}
  </svg>`;
}

function footerWaves(fx, seedStr, { W = 1440, H = 150 } = {}) {
  const c1 = fx.petal || '#38bdf8', c2 = fx.core || '#0ea5e9', c3 = fx.edge || 'rgba(255,255,255,.35)';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMax meet">
    <g opacity=".95">
      <path fill="${c2}" opacity=".55" d="M0 ${H} L0 ${H - 40} Q${W * 0.125} ${H - 70} ${W * 0.25} ${H - 40} T${W * 0.5} ${H - 40} T${W * 0.75} ${H - 40} T${W} ${H - 40} L${W} ${H} Z">
        <animateTransform attributeName="transform" type="translate" values="0 0;60 0;0 0" dur="9s" repeatCount="indefinite"/>
      </path>
      <path fill="${c1}" opacity=".7" d="M0 ${H} L0 ${H - 22} Q${W * 0.125} ${H - 52} ${W * 0.25} ${H - 22} T${W * 0.5} ${H - 22} T${W * 0.75} ${H - 22} T${W} ${H - 22} L${W} ${H} Z">
        <animateTransform attributeName="transform" type="translate" values="0 0;-70 0;0 0" dur="7.5s" repeatCount="indefinite"/>
      </path>
      <path fill="${c3}" opacity=".5" d="M0 ${H} L0 ${H - 8} Q${W * 0.125} ${H - 30} ${W * 0.25} ${H - 8} T${W * 0.5} ${H - 8} T${W * 0.75} ${H - 8} T${W} ${H - 8} L${W} ${H} Z">
        <animateTransform attributeName="transform" type="translate" values="0 0;50 0;0 0" dur="6s" repeatCount="indefinite"/>
      </path>
    </g>
  </svg>`;
}

// ---------------------------------------------------------------------------
// PATTERNS (corner motifs)
// ---------------------------------------------------------------------------
function snowflakeSVG(color, seedStr, { size = 260 } = {}) {
  const rnd = prng(hashSeed(seedStr));
  let arms = '';
  for (let k = 0; k < 6; k++) {
    arms += `<g transform="rotate(${k * 60})">
      <line y2="-${size / 2 - 10}" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/>
      ${[-0.35, -0.6, -0.82].map(f => `<g transform="translate(0 ${(size / 2 - 10) * f})"><line x1="0" y1="0" x2="10" y2="-8" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/><line x1="0" y1="0" x2="-10" y2="-8" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/></g>`).join('')}
    </g>`;
  }
  let dots = '';
  for (let k = 0; k < 12; k++) {
    const a = (360 * k) / 12;
    const rr = size / 2 - 22;
    dots += `<circle cx="${(rr * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(rr * Math.sin(a * Math.PI / 180)).toFixed(1)}" r="1.8" fill="${color}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-${size / 2} -${size / 2} ${size} ${size}" width="${size}" height="${size}">${arms}<circle r="${size / 2 - 6}" fill="none" stroke="${color}" stroke-width="1.2" opacity=".6"/>${dots}<circle r="4" fill="${color}"/></svg>`;
}

function starBurstSVG(color, seedStr, { size = 260 } = {}) {
  let rays = '';
  for (let k = 0; k < 8; k++) {
    rays += `<path d="M0 -${size / 2 - 12} L7 -${size / 4} L0 -${size / 4 - 16} L-7 -${size / 4} Z" transform="rotate(${k * 45})" fill="${color}" opacity=".85"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-${size / 2} -${size / 2} ${size} ${size}" width="${size} " height="${size}">
    ${rays}
    <circle r="${size / 4}" fill="none" stroke="${color}" stroke-width="1.4"/>
    <circle r="${size / 2 - 8}" fill="none" stroke="${color}" stroke-width="1.2" opacity=".55"/>
    ${[0, 45, 90, 135].map(a => `<ellipse rx="10" ry="${size / 5}" fill="none" stroke="${color}" stroke-width="1" transform="rotate(${a})" opacity=".8"/>`).join('')}
    <circle r="7" fill="${color}"/>
  </svg>`;
}

module.exports = {
  garlandLights, garlandBunting, garlandLanterns, garlandSakura, garlandPine,
  garlandPapel, garlandVine,
  floatSakura, floatMarigold, floatLeaves, floatSnow, floatStars, floatFireflies,
  floatConfetti, floatLanterns, floatHearts,
  footerLeaves, footerSnow, footerWaves,
  snowflakeSVG, starBurstSVG
};
