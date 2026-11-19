/**
 * festival/svg.js
 * Parametric SVG generators for the Festival template family.
 * All four artworks animate via SMIL (no JavaScript required) and are
 * tinted per-template from its palette so no two templates are identical.
 */

/** Deterministic PRNG (mulberry32) so every template's art is reproducible. */
function prng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const spl = '.45 0 .55 1;.45 0 .55 1'; // shared ease keySplines

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Falling flowers / petals (full-viewport fixed background)
// ---------------------------------------------------------------------------
function flowersSVG(fx, seedStr, { W = 1440, H = 900, columns = 13 } = {}) {
  const rnd = prng(hashSeed(seedStr));
  const petal = fx.petal, edge = fx.edge, core = fx.core, bud = fx.bud;

  const petalPath = "M0 0 C2.8-1.2 5.6-6.6 3.6-10.6 C1.8-12.4-2-11.4-2.4-8.2 C-2.8-5-1.4-2 0 0Z";
  let petals = '';
  for (let r = 0; r < 360; r += 60) {
    petals += `<path transform="rotate(${r})" d="${petalPath}"/>`;
  }
  let shadowPetals = '';
  for (let r = 0; r < 360; r += 60) {
    shadowPetals += `<path transform="rotate(${r})" d="${petalPath}"/>`;
  }

  const defs = `
  <defs>
    <symbol id="f" viewBox="-14 -14 28 28" overflow="visible">
      <g fill="rgba(0,0,0,.28)" transform="translate(.8 1.1)">${shadowPetals}</g>
      <g fill="${petal}" stroke="${edge}" stroke-width=".55">${petals}</g>
      <circle r="2.5" fill="${core}"/><circle r="1.1" fill="rgba(0,0,0,.35)"/>
    </symbol>
    <symbol id="p" viewBox="-14 -14 28 28" overflow="visible">
      <path d="M0 1 C.6 5 .4 9 1 13" fill="none" stroke="${bud}" stroke-width="2.4" stroke-linecap="round"/>
      <g fill="${petal}" stroke="${edge}" stroke-width=".55">
        <path transform="rotate(-75) scale(.95 .9)" d="${petalPath}"/>
        <path transform="rotate(-38) scale(.95 .9)" d="${petalPath}"/>
        <path transform="rotate(0) scale(.95 .9)" d="${petalPath}"/>
        <path transform="rotate(38) scale(.95 .9)" d="${petalPath}"/>
        <path transform="rotate(75) scale(.95 .9)" d="${petalPath}"/>
      </g>
      <circle cy=".6" r="1.9" fill="${bud}"/>
    </symbol>
  </defs>`;

  let body = '';
  for (let i = 0; i < columns; i++) {
    const x = Math.round(((i + 0.5) / columns) * W + (rnd() - 0.5) * 60);
    const dur = (22 + rnd() * 16).toFixed(2);
    const begin = (-rnd() * 24).toFixed(2);
    const swayDur = (5.5 + rnd() * 4).toFixed(2);
    const swayAmp = (11 + rnd() * 10).toFixed(1);
    const spinDur = (10 + rnd() * 9).toFixed(2);
    const spinDir = rnd() > 0.5 ? '0;-360' : '0;360';
    const squashDur = (3.8 + rnd() * 2.2).toFixed(2);
    const scale = (1.25 + rnd() * 1.05).toFixed(2);
    const useId = rnd() > 0.32 ? 'f' : 'p';
    const loop = H + 360;
    body += `
  <g transform="translate(${x} 0)">
    <g><animateTransform attributeName="transform" type="translate" values="0 -170;0 ${H + 190}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite" calcMode="linear"/>
      <use href="#c${i}"/>
      <use href="#c${i}" y="${-loop}"/>
    </g>
  </g>`;
    body += `
  <g id="c${i}">
    <g><animateTransform attributeName="transform" type="translate" values="${-swayAmp} 0;${swayAmp} 0;${-swayAmp} 0" dur="${swayDur}s" begin="${(-rnd() * 6).toFixed(2)}s" calcMode="spline" keyTimes="0;.5;1" keySplines="${spl}" repeatCount="indefinite"/>
      <g transform="scale(${scale})">
        <g><animateTransform attributeName="transform" type="rotate" values="${spinDir}" dur="${spinDur}s" begin="${(-rnd() * 12).toFixed(2)}s" repeatCount="indefinite"/>
          <g><animateTransform attributeName="transform" type="scale" values="1 1;.32 1;1 1" dur="${squashDur}s" begin="${(-rnd() * 4).toFixed(2)}s" calcMode="spline" keyTimes="0;.5;1" keySplines="${spl}" repeatCount="indefinite"/>
            <use href="#${useId}" x="-14" y="-14" width="28" height="28"/>
          </g>
        </g>
      </g>
    </g>
  </g>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" opacity="1">${defs}${body}</svg>`;
}

// ---------------------------------------------------------------------------
// Toran garland (top banner): scalloped marigold strands, mango leaves,
// hanging tassels and glowing fairy lights.
// ---------------------------------------------------------------------------
function garlandSVG(g, seedStr, { W = 1440, arc = 120, droop = 56 } = {}) {
  const rnd = prng(hashSeed(seedStr));
  const A = g.flowerA, A2 = g.flowerA2, B = g.flowerB, B2 = g.flowerB2;
  const center = g.flowerCenter, dark = g.flowerDark;
  const leafs = g.leafs, lights = g.lights, rope = g.rope;

  const marigold = (id, c1, c2) => {
    const outer = [];
    for (let k = 0; k < 8; k++) {
      const a = (Math.PI * 2 * k) / 8;
      outer.push(`<circle cx="${(5.6 * Math.cos(a)).toFixed(2)}" cy="${(5.6 * Math.sin(a)).toFixed(2)}" r="3.1" fill="${c1}"/>`);
    }
    const mid = [];
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI * 2 * k) / 6 + 0.3;
      mid.push(`<circle cx="${(2.9 * Math.cos(a)).toFixed(2)}" cy="${(2.9 * Math.sin(a)).toFixed(2)}" r="2.5" fill="${c2}"/>`);
    }
    return `<symbol id="${id}" viewBox="-8 -8 16 16" overflow="visible">${outer.join('')}${mid.join('')}<circle r="2.1" fill="${center}"/><circle r=".9" fill="${dark}"/></symbol>`;
  };

  const leafPath = (fill) => `<path d="M0 0 C7 7 9 24 0 40 C-9 24 -7 7 0 0 Z" fill="${fill}"/><path d="M0 3 V34" stroke="rgba(255,255,255,.4)" stroke-width=".9"/>`;

  // lights glow filter
  const defs = `
  <defs>
    ${marigold('fo', A, A2)}
    ${marigold('fy', B, B2)}
    <filter id="gl" x="-300%" y="-300%" width="700%" height="700%">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;

  const arcs = Math.round(W / arc);
  let body = `<path d="M0 6 H${W}" stroke="${rope}" stroke-width="1.8"/>`;

  for (let i = 0; i < arcs; i++) {
    const x0 = i * arc;
    const x1 = x0 + arc;
    const cx = x0 + arc / 2;
    const cy = 6 + droop;
    body += `<path d="M${x0} 6 Q${cx} ${cy} ${x1} 6" fill="none" stroke="${rope}" stroke-width="1.6"/>`;

    // flowers along the quadratic curve, biggest at the drape midpoint
    const nF = 7;
    for (let k = 1; k <= nF; k++) {
      const u = k / (nF + 1);
      const bx = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1;
      const by = (1 - u) * (1 - u) * 6 + 2 * (1 - u) * u * cy + u * u * 6;
      const s = (0.85 + 2.1 * u * (1 - u) * 2).toFixed(2);
      const id = (i + k) % 2 === 0 ? 'fo' : 'fy';
      body += `<use href="#${id}" x="-8" y="-8" width="16" height="16" transform="translate(${bx.toFixed(1)} ${(by + 2).toFixed(1)}) scale(${s})"/>`;
    }

    // glowing fairy lights strung along the drape
    for (let k = 0; k < 3; k++) {
      const u = 0.22 + k * 0.28 + (rnd() - 0.5) * 0.05;
      const bx = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1;
      const by = (1 - u) * (1 - u) * 6 + 2 * (1 - u) * u * cy + u * u * 6;
      const c = lights[(i * 3 + k) % lights.length];
      body += `<circle cx="${bx.toFixed(1)}" cy="${(by + 9).toFixed(1)}" r="3" fill="${c}" filter="url(#gl)"><animate attributeName="opacity" values="1;.15;1" dur="${(1.3 + rnd() * 1.4).toFixed(2)}s" begin="${(-rnd() * 2.4).toFixed(2)}s" repeatCount="indefinite"/></circle>`;
    }

    // mango-leaf pair + hanging tassel at each junction
    const li = i % leafs.length;
    body += `<g transform="translate(${x1} 6) rotate(-26)">${leafPath(leafs[li])}</g>`;
    body += `<g transform="translate(${x1} 6) rotate(24) scale(.9)">${leafPath(leafs[(li + 1) % leafs.length])}</g>`;
    if (i % 2 === 0) {
      const tl = (34 + rnd() * 26).toFixed(0);
      const swayDur = (3.4 + rnd() * 1.6).toFixed(2);
      let tassel = `<g transform="translate(${x1} 10)"><g><animateTransform attributeName="transform" type="rotate" values="-5;5;-5" dur="${swayDur}s" begin="${(-rnd() * 3).toFixed(2)}s" calcMode="spline" keyTimes="0;.5;1" keySplines="${spl}" repeatCount="indefinite"/>`;
      const steps = 4;
      for (let k = 0; k < steps; k++) {
        const id = k % 2 === 0 ? 'fo' : 'fy';
        tassel += `<use href="#${id}" x="-7" y="-7" width="14" height="14" transform="translate(0 ${(k * (tl / steps) + 8).toFixed(1)})"/>`;
      }
      tassel += `<g transform="translate(0 ${tl + 10}) rotate(180) scale(.8)">${leafPath(leafs[(li + 2) % leafs.length])}</g></g></g>`;
      body += tassel;
    }
  }

  // grand centre strand hanging under the middle junction
  const cxm = W / 2;
  let strand = `<g transform="translate(${cxm} 10)"><g><animateTransform attributeName="transform" type="rotate" values="-4;4;-4" dur="4.6s" calcMode="spline" keyTimes="0;.5;1" keySplines="${spl}" repeatCount="indefinite"/>`;
  for (let k = 0; k < 5; k++) {
    const id = k % 2 === 0 ? 'fy' : 'fo';
    strand += `<use href="#${id}" x="-8" y="-8" width="16" height="16" transform="translate(0 ${k * 12 + 8})"/>`;
  }
  strand += `<g transform="translate(0 74) rotate(180) scale(.85)">${leafPath(leafs[0])}</g></g></g>`;
  body += strand;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 110" width="${W}" height="110" preserveAspectRatio="xMidYMin meet">${defs}${body}</svg>`;
}

// ---------------------------------------------------------------------------
// Kash grass footer: swaying stalks with seed heads over green tufts.
// ---------------------------------------------------------------------------
function kashSVG(k, seedStr, { W = 1440, H = 150 } = {}) {
  const rnd = prng(hashSeed(seedStr));
  const straw = k.straw, strawLight = k.strawLight, tufts = k.tufts;

  let tuft = '';
  for (let x = 6; x < W; x += 26) {
    const h = 20 + rnd() * 22;
    const c = tufts[x % tufts.length];
    tuft += `<path d="M${x} ${H} Q${x - 4} ${H - h * 0.6} ${x - 7} ${H - h}" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>
             <path d="M${x + 5} ${H} Q${x + 7} ${H - h * 0.7} ${x + 10} ${H - h * 0.9}" stroke="${tufts[(x + 1) % tufts.length]}" stroke-width="3" fill="none" stroke-linecap="round"/>
             <path d="M${x + 10} ${H} Q${x + 11} ${H - h * 0.5} ${x + 13} ${H - h * 0.62}" stroke="${tufts[(x + 2) % tufts.length]}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  }

  let stalks = '';
  const nStalks = Math.round(W / 170);
  for (let i = 0; i < nStalks; i++) {
    const x = 60 + i * (W - 120) / (nStalks - 1) + (rnd() - 0.5) * 40;
    const h = 86 + rnd() * 44;
    const sway = (2.6 + rnd() * 1.6).toFixed(1);
    const dur = (4.4 + rnd() * 2.2).toFixed(2);
    const begin = (-rnd() * 4).toFixed(2);
    const c = i % 3 === 0 ? strawLight : straw;
    const lean = (rnd() - 0.5) * 26;
    stalks += `
  <g transform="translate(${x.toFixed(1)} ${H})">
    <g><animateTransform attributeName="transform" type="rotate" values="${-sway};${sway};${-sway}" dur="${dur}s" begin="${begin}s" calcMode="spline" keyTimes="0;.5;1" keySplines="${spl}" repeatCount="indefinite"/>
      <path d="M0 0 Q${(lean * 0.3).toFixed(1)} ${-h * 0.55} ${lean.toFixed(1)} ${-h}" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <ellipse cx="${lean.toFixed(1)}" cy="${-h - 8}" rx="4.4" ry="14" transform="rotate(${(lean * 0.35).toFixed(1)} ${lean.toFixed(1)} ${-h - 8})" fill="${strawLight}" opacity=".9"/>
      <g stroke="${c}" stroke-width="1" stroke-linecap="round" fill="none">
        <path d="M${(lean - 4).toFixed(1)} ${-h + 6} q-5 -6 -7 -13"/>
        <path d="M${(lean - 3).toFixed(1)} ${-h + 10} q-7 -4 -10 -10"/>
        <path d="M${(lean + 4).toFixed(1)} ${-h + 6} q5 -6 7 -13"/>
      </g>
    </g>
  </g>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMax meet">${stalks}${tuft}</svg>`;
}

// ---------------------------------------------------------------------------
// Rotating mandala / rangoli corner motif (stroke-only, tinted, spun by CSS)
// ---------------------------------------------------------------------------
function mandalaSVG(color, seedStr, { size = 260, variant = 0 } = {}) {
  const rnd = prng(hashSeed(seedStr));
  const petals = [8, 12, 10, 16, 14, 12][variant % 6];
  const c = color;
  let body = `<circle r="${size / 2 - 6}" fill="none" stroke="${c}" stroke-width="1.4" opacity=".8"/>`;
  body += `<circle r="${size / 2 - 18}" fill="none" stroke="${c}" stroke-width="1" opacity=".6"/>`;

  // ring of petals
  const pr = size / 2 - 30;
  body += `<g fill="none" stroke="${c}" stroke-width="1.2">`;
  for (let k = 0; k < petals; k++) {
    const a = (360 * k) / petals;
    body += `<ellipse rx="${(pr / 4.4).toFixed(1)}" ry="${(pr / 1.7).toFixed(1)}" transform="rotate(${a}) translate(0 ${-pr})"/>`;
  }
  body += `</g>`;

  // inner ring of dots + star
  const dots = petals * 2;
  body += `<g fill="${c}">`;
  for (let k = 0; k < dots; k++) {
    const a = (360 * k) / dots;
    const rr = size / 2 - 52 + (k % 2 ? 6 : 0);
    body += `<circle cx="${(rr * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(rr * Math.sin(a * Math.PI / 180)).toFixed(1)}" r="${k % 2 ? 1.6 : 2.4}"/>`;
  }
  body += `</g>`;

  // inner lotus
  const inner = petals / 2;
  body += `<g fill="none" stroke="${c}" stroke-width="1.1" opacity=".9">`;
  for (let k = 0; k < inner; k++) {
    const a = (360 * k) / inner + 12;
    body += `<ellipse rx="12" ry="${(size / 5.2).toFixed(1)}" transform="rotate(${a})"/>`;
  }
  body += `<circle r="${(size / 9).toFixed(1)}"/></g>`;
  body += `<circle r="${(size / 18).toFixed(1)}" fill="${c}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-${size / 2} -${size / 2} ${size} ${size}" width="${size}" height="${size}">${body}</svg>`;
}

module.exports = { prng, hashSeed, flowersSVG, garlandSVG, kashSVG, mandalaSVG };
