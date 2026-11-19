/**
 * festival/generate.js
 * Emits the Festival template family (Indian batch + worldwide batch):
 *   templates/static/html/festival/<role>/<theme-slug>/
 *
 * Each template gets a distinct festive MODE:
 *   garland : toran | lights | bunting | lanterns | sakura | pine | papel | vine
 *   float   : daisy | marigold | sakura | leaves | snow | stars | fireflies | confetti | lanterns | hearts
 *   footer  : kash | leaves | snow | waves
 *   pattern : mandala variants | snowflake | star
 *   scroll  : parallax | cascade | hero-fade | drift   (+ reveal-on-scroll everywhere)
 *   reveal  : up | zoom | flip | slide | cascade
 *
 * Run: node scripts/festival/generate.js
 */

const fs = require('fs');
const path = require('path');
const {
  FAMILIES, PALETTES, ROWS, personaFor,
  PALETTES_W, GROUPS, WIDE_ROWS, westernPersonaFor
} = require('./data');
const { flowersSVG, garlandSVG, kashSVG, mandalaSVG } = require('./svg');
const {
  garlandLights, garlandBunting, garlandLanterns, garlandSakura, garlandPine,
  garlandPapel, garlandVine,
  floatSakura, floatMarigold, floatLeaves, floatSnow, floatStars, floatFireflies,
  floatConfetti, floatLanterns, floatHearts,
  footerLeaves, footerSnow, footerWaves,
  snowflakeSVG, starBurstSVG
} = require('./svg-more');

const repoRoot = path.resolve(__dirname, '..', '..');
const VENDOR_SRC = {
  'gsap.min.js': path.join(T(), 'technical/creative-developer/3d-desert-rover-playground/vendor/gsap.min.js'),
  'ScrollTrigger.min.js': path.join(T(), 'creative/interaction-designer/3d-spatial-zen-garden/vendor/ScrollTrigger.min.js')
};
function T() { return path.join(repoRoot, 'templates', 'static', 'html'); }
const templatesRoot = path.join(repoRoot, 'templates', 'static', 'html', 'festival');
const outboxRoot = path.join(repoRoot, 'assets-outbox', 'festival-previews');
const ASSETS_CDN = 'https://raw.githubusercontent.com/Alex-DevDrift/Assets/refs/heads/main/portfoliobuilders/images';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------------------------------------------------------------------------
// Uniqueness guards against the existing catalog (outside the festival folder)
// ---------------------------------------------------------------------------
function existingIds() {
  const ids = new Set();
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!['node_modules', '.git', 'assets', 'festival'].includes(e.name)) walk(p);
      } else if (e.name === 'template.json') {
        try { ids.add(JSON.parse(fs.readFileSync(p, 'utf8')).id); } catch { /* ignore */ }
      }
    }
  };
  walk(path.join(repoRoot, 'templates'));
  return ids;
}

// ---------------------------------------------------------------------------
// Mode presets for the Indian batch (deterministic variety by index)
// ---------------------------------------------------------------------------
const IN_GARLANDS = ['toran', 'lights', 'toran', 'vine', 'lights', 'toran', 'lanterns', 'lights', 'toran', 'vine'];
const IN_FLOATS = ['daisy', 'fireflies', 'marigold', 'stars', 'daisy', 'marigold', 'fireflies', 'stars', 'marigold', 'daisy'];
const SCROLLS = ['parallax', 'cascade', 'hero-fade', 'drift'];
const REVEALS = ['up', 'zoom', 'cascade', 'slide', 'flip'];

function indianMode(i) {
  return {
    garland: IN_GARLANDS[i % IN_GARLANDS.length],
    float: IN_FLOATS[i % IN_FLOATS.length],
    footer: 'kash',
    pattern: 'mandala',
    patternVariant: i % 6,
    scroll: SCROLLS[i % SCROLLS.length],
    reveal: REVEALS[i % REVEALS.length]
  };
}

function wideMode(group, i) {
  return {
    garland: group.garland,
    float: group.float,
    footer: group.footer,
    pattern: group.pattern,
    patternVariant: i % 6,
    scroll: SCROLLS[(i + 1) % SCROLLS.length],
    reveal: REVEALS[(i + 2) % REVEALS.length]
  };
}

// ---------------------------------------------------------------------------
// Art builders — palette → tinted SVGs for the resolved mode
// ---------------------------------------------------------------------------
function garlandTints(p) {
  if (p.light) {
    return {
      flowerA: p.primary, flowerA2: p.accent2, flowerB: '#f2a900', flowerB2: '#fbbf24',
      flowerCenter: '#fbb040', flowerDark: '#8a4a06', rope: '#8a6a3c',
      leafs: ['#3f7d20', '#5a9a2b', '#2f6b1a', '#4c8c24'],
      lights: ['#ffe27a', '#ff4d4d', '#6dff95', '#6cbcff', '#ffb347']
    };
  }
  return {
    flowerA: p.primary, flowerA2: p.accent2, flowerB: p.gold, flowerB2: '#fde68a',
    flowerCenter: '#fbb040', flowerDark: '#7c2d12', rope: '#7a4a1c',
    leafs: ['#3f7d20', '#5a9a2b', '#2f6b1a', '#4c8c24'],
    lights: ['#ffe27a', '#ff4d4d', '#6dff95', '#6cbcff', '#ffb347']
  };
}

function kashTints(p) {
  if (p.light) {
    return { straw: '#8a7448', strawLight: '#b09a68', tufts: ['#4f6a2a', '#3d5622', '#5d7a34'] };
  }
  return { straw: '#8a7448', strawLight: '#c9b484', tufts: ['#3d5622', '#4f6a2a', '#2c3f1e'] };
}

function buildArt(id, p, mode) {
  const fx = p.fx;
  const garlands = {
    toran: () => garlandSVG(garlandTints(p), id + '-g', { arc: 110 + (id.length % 3) * 12 }),
    lights: () => garlandLights({ wire: p.light ? '#8a6a3c' : '#5a4632', bulbs: [p.gold, p.primary, p.accent2, '#ffd166'] }, id + '-g'),
    bunting: () => garlandBunting({ flags: [p.primary, p.gold, p.accent2, p.light ? '#ffffff' : '#f8f4e6'], rope: p.light ? '#8a6a3c' : '#5a4632' }, id + '-g'),
    lanterns: () => garlandLanterns({ colors: [p.primary, p.gold, p.accent2], glow: p.gold, rope: p.light ? '#8a6a3c' : '#7a4a1c' }, id + '-g'),
    sakura: () => garlandSakura({ branch: '#6b4a33', pinks: ['#f9c0d4', '#f4a0c0', '#fbc8d9', p.fx.petal], deep: '#b04a68' }, id + '-g'),
    pine: () => garlandPine({ greens: ['#2f5d3a', '#3e7a4a', '#24492e'], baubles: [p.primary, p.gold, p.light ? '#ffffff' : '#f8f4e6'], lights: [p.gold, '#ff5c5c', '#9be7ff'], snowTip: true }, id + '-g'),
    papel: () => garlandPapel({ papers: [p.primary, p.accent2, p.gold, '#f472b6'], rope: p.light ? '#6a4a6a' : '#3a2440' }, id + '-g'),
    vine: () => garlandVine({ leafGreens: ['#3e6b2a', '#5a9a2b', '#2f6b1a', '#4c8c24'], flowerColors: [p.primary, p.gold, p.accent2], deep: '#8a4a06' }, id + '-g')
  };

  const floats = {
    daisy: () => flowersSVG(fx, id, { columns: 12 + (id.length % 4) }),
    marigold: () => floatMarigold(fx, id),
    sakura: () => floatSakura(fx, id),
    leaves: () => floatLeaves({ ...fx, leaves: ['#c2703d', '#d97706', '#a16207', '#b45309', '#9a3412'] }, id),
    snow: () => floatSnow(fx, id),
    stars: () => floatStars(fx, id),
    fireflies: () => floatFireflies({ petal: p.gold, core: '#a3e635' }, id),
    confetti: () => floatConfetti({ confetti: [p.primary, p.gold, p.accent2, '#ff5c8a', '#38bdf8'] }, id),
    lanterns: () => floatLanterns({ petal: p.gold, core: p.primary }, id),
    hearts: () => floatHearts({ petal: '#fb7185', core: '#f43f5e' }, id)
  };

  const footers = {
    kash: () => kashSVG(kashTints(p), id + '-k'),
    leaves: () => footerLeaves({ leaves: ['#c2703d', '#d97706', '#a16207', '#b45309'] }, id + '-k'),
    snow: () => footerSnow(fx, id + '-k'),
    waves: () => footerWaves({ petal: p.accent2, core: p.primary, edge: 'rgba(255,255,255,.4)' }, id + '-k')
  };

  const patterns = {
    mandala: () => mandalaSVG(p.accent2, id + '-m', { variant: mode.patternVariant }),
    snowflake: () => snowflakeSVG(p.accent2, id + '-m'),
    star: () => starBurstSVG(p.accent2, id + '-m')
  };

  return {
    garland: garlands[mode.garland](),
    float: floats[mode.float](),
    footer: footers[mode.footer](),
    pattern: patterns[mode.pattern]()
  };
}

const FONT_PAIRS = [
  { head: 'Playfair Display', body: 'Inter' },
  { head: 'Cormorant Garamond', body: 'Nunito Sans' },
  { head: 'Marcellus', body: 'Mulish' },
  { head: 'Fraunces', body: 'Manrope' }
];

// ---------------------------------------------------------------------------
// HTML page emitters
// ---------------------------------------------------------------------------
function headBlock(t, title, desc) {
  const { head, body } = t.fonts;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<script>document.documentElement.classList.add('js')</script>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ctext y='19' font-size='19'%3E%F0%9F%AA%94%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${head.replace(/ /g, '+')}:wght@400;600;700&family=${body.replace(/ /g, '+')}:wght@300;400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="./style.css">
</head>
<body class="layout-${t.layout} card-${t.layout} rv-${t.mode.reveal} cards-${t.mode.reveal} fx-${t.mode.scroll}">`;
}

function chromeBlock(t) {
  return `
<img class="flowers-bg" src="./assets/floats.svg" alt="" aria-hidden="true">
<img class="mandala mandala-left" src="./assets/mandala.svg" alt="" aria-hidden="true">
<img class="mandala mandala-right" src="./assets/mandala.svg" alt="" aria-hidden="true">
<img class="garland" src="./assets/garland.svg" alt="" aria-hidden="true">

<header class="site-head">
  <a class="brand" href="./index.html">
    <svg class="diya" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path class="flame" d="M12 3 C14 6 15.5 8 12 11 C8.5 8 10 6 12 3Z" fill="var(--gold)"/><path d="M4 13 C7 16 17 16 20 13 C19 17.5 15 19.5 12 19.5 C9 19.5 5 17.5 4 13Z" fill="var(--primary)"/></svg>
    <span>${t.persona.name}</span>
  </a>
  <button class="nav-toggle" aria-label="Toggle navigation"><span></span><span></span><span></span></button>
  <nav class="nav-links">
    <a href="./index.html">Home</a>
    <a href="./about.html">About</a>
    <a href="./projects.html">Work</a>
    <a href="./contact.html">Contact</a>
  </nav>
</header>`;
}

function footerBlock(t) {
  const handle = t.persona.name.toLowerCase().replace(/[^a-z]+/g, '');
  const footerFile = t.mode.footer === 'kash' ? 'kash.svg' : 'footer.svg';
  return `
<footer class="site-foot">
  <div class="foot-inner">
    <div class="foot-mark" aria-hidden="true">
      <svg viewBox="0 0 60 26" width="60" height="26"><path d="M2 20 Q15 4 30 20 Q45 4 58 20" fill="none" stroke="var(--gold)" stroke-width="1.6"/><circle cx="30" cy="20" r="2.4" fill="var(--primary)"/></svg>
    </div>
    <nav class="foot-links">
      <a href="https://instagram.com/${handle}" target="_blank" rel="noopener">Instagram</a>
      <a href="https://x.com/${handle}" target="_blank" rel="noopener">X</a>
      <a href="https://linkedin.com/in/${handle}" target="_blank" rel="noopener">LinkedIn</a>
      <a href="mailto:${t.persona.email}">Email</a>
    </nav>
    <p class="foot-note">&copy; <span id="yr">2026</span> ${t.persona.name} &middot; Made with ${t.footerWord}</p>
  </div>
  <img class="kash" src="./assets/${footerFile}" alt="" aria-hidden="true">
  <div class="kolam-border" aria-hidden="true"></div>
</footer>
<script src="./vendor/gsap.min.js"></script>
<script src="./vendor/ScrollTrigger.min.js"></script>
<script src="./script.js"></script>
</body>
</html>`;
}

function pageHero(t, subtitle, lead) {
  const layout = t.layout;
  const diyaArt = `
    <div class="hero-art" aria-hidden="true">
      <svg viewBox="0 0 200 200" width="220" height="220">
        <circle cx="100" cy="100" r="92" fill="none" stroke="var(--border)" stroke-width="1.4"/>
        <g transform="translate(100 100)" fill="none" stroke="var(--gold)" stroke-width="1.2">
          ${[0, 60, 120, 180, 240, 300].map(a => `<ellipse rx="11" ry="24" transform="rotate(${a}) translate(0 -64)"/>`).join('')}
        </g>
        <path d="M100 74 C112 88 119 98 100 114 C81 98 88 88 100 74Z" fill="var(--gold)"/>
        <path d="M62 122 C76 136 124 136 138 122 C134 142 116 152 100 152 C84 152 66 142 62 122Z" fill="var(--primary)"/>
        <circle cx="100" cy="100" r="6" fill="var(--accent2)"/>
      </svg>
      <span class="glow g1"></span><span class="glow g2"></span><span class="glow g3"></span>
    </div>`;

  if (layout === 1) {
    return `<section class="hero split">
      <div class="hero-copy">
        <p class="eyebrow">${esc(subtitle)}</p>
        <h1>${t.persona.name}</h1>
        <div class="divider" aria-hidden="true"></div>
        <p class="lead">${lead}</p>
        <div class="cta-row">
          <a class="btn" href="./projects.html">View My Work</a>
          <a class="btn ghost" href="./contact.html">Say Hello</a>
        </div>
      </div>
      ${diyaArt}
    </section>`;
  }
  if (layout === 2) {
    return `<section class="hero banner">
      <p class="eyebrow">${esc(subtitle)}</p>
      <h1>${t.persona.name}</h1>
      <div class="divider wide" aria-hidden="true"></div>
      <p class="lead">${lead}</p>
      <div class="cta-row center">
        <a class="btn" href="./projects.html">View My Work</a>
        <a class="btn ghost" href="./contact.html">Say Hello</a>
      </div>
    </section>`;
  }
  return `<section class="hero center">
      ${diyaArt}
      <p class="eyebrow">${esc(subtitle)}</p>
      <h1>${t.persona.name}</h1>
      <div class="divider" aria-hidden="true"></div>
      <p class="lead">${lead}</p>
      <div class="cta-row center">
        <a class="btn" href="./projects.html">View My Work</a>
        <a class="btn ghost" href="./contact.html">Say Hello</a>
      </div>
    </section>`;
}

function indexPage(t) {
  const fam = t.family;
  const quotes = fam.quotes || [
    'Every celebration is an invitation to begin again, brighter.',
    'Light one lamp and the darkness has no argument.',
    'The best decorations are the ones that feel like home.'
  ];
  const highlights = fam.skills.slice(0, 3).map((s, i) => `
      <article class="card">
        <span class="card-num">${String(i + 1).padStart(2, '0')}</span>
        <h3>${esc(s.trim())}</h3>
        <p>${['The heart of every celebration is detail — and every detail is practiced until it looks effortless.', 'Tradition gives the grammar; every festival gives a new sentence to speak with it.', 'Work made by hand and by heart carries a warmth machines cannot copy.'][i]}</p>
      </article>`).join('');

  return `${headBlock(t, `${t.persona.name} — ${t.roleDisplay}`, t.description)}
${chromeBlock(t)}
<main>
  ${pageHero(t, t.roleDisplay, fam.tagline)}
  <section class="section reveal">
    <h2 class="section-title"><span>Celebration Highlights</span></h2>
    <div class="cards">${highlights}
    </div>
  </section>
  <section class="section quote-band reveal">
    <blockquote>&ldquo;${quotes[t.index % quotes.length]}&rdquo;</blockquote>
  </section>
</main>
${footerBlock(t)}`;
}

function aboutPage(t) {
  const fam = t.family;
  const initials = t.persona.name.split(' ').map(w => w[0]).join('');
  const skills = fam.skills.map(s => `<span class="chip">${esc(s.trim())}</span>`).join('\n      ');
  const timeline = fam.timeline.map((m, i) => `<li><span class="tl-year">${2026 - (fam.timeline.length - 1 - i) * 3}</span><p>${esc(m)}</p></li>`).join('\n      ');

  return `${headBlock(t, `About — ${t.persona.name}`, `The story of ${t.persona.name}, ${t.roleDisplay.toLowerCase()} from ${t.persona.city}.`)}
${chromeBlock(t)}
<main>
  <section class="hero center page-head reveal">
    <div class="monogram" aria-hidden="true">${initials}</div>
    <h1>About ${t.persona.name.split(' ')[0]}</h1>
    <div class="divider" aria-hidden="true"></div>
  </section>
  <section class="section narrow reveal">
    <p class="lead">Hello! I'm ${t.persona.name}, a ${esc(t.roleDisplay.toLowerCase())} based in ${t.persona.city}. ${fam.tagline}</p>
    <p>My journey began around family, festivals and community celebrations — the places where this craft lives and breathes. Over the years those beginnings grew into a practice that blends traditional technique with a modern sense of presentation, serving families, festivals and cultural organisations alike.</p>
    <p>Whether it is the biggest night of the year or a quiet personal milestone, my promise is the same: work made with patience, respect for tradition, and a little extra glow.</p>
  </section>
  <section class="section reveal">
    <h2 class="section-title"><span>What I Bring</span></h2>
    <div class="chips">
      ${skills}
    </div>
  </section>
  <section class="section narrow reveal">
    <h2 class="section-title"><span>The Journey</span></h2>
    <ul class="tl">
      ${timeline}
    </ul>
  </section>
</main>
${footerBlock(t)}`;
}

function projectsPage(t) {
  const fam = t.family;
  const cards = fam.projects.map(([title, desc], i) => `
      <article class="card work">
        <div class="card-top" aria-hidden="true"></div>
        <span class="yr">${2019 + i}</span>
        <h3>${esc(title)}</h3>
        <p>${esc(desc)}</p>
        <span class="chip small">${t.familyKey}</span>
      </article>`).join('');

  return `${headBlock(t, `Work — ${t.persona.name}`, `Selected celebrations, collections and creations by ${t.persona.name}, ${t.roleDisplay.toLowerCase()}.`)}
${chromeBlock(t)}
<main>
  <section class="hero center page-head reveal">
    <p class="eyebrow">Selected Work</p>
    <h1>Celebrations &amp; Creations</h1>
    <div class="divider" aria-hidden="true"></div>
    <p class="lead">A garland of favourite projects — each one strung with care, season after season.</p>
  </section>
  <section class="section reveal">
    <div class="cards work-grid">${cards}
    </div>
  </section>
</main>
${footerBlock(t)}`;
}

function contactPage(t) {
  const greet = t.group === 'japan' || t.group === 'lunar' ? 'Hello' : 'Say Namaste';
  return `${headBlock(t, `Contact — ${t.persona.name}`, `Get in touch with ${t.persona.name}, ${t.roleDisplay.toLowerCase()} from ${t.persona.city}.`)}
${chromeBlock(t)}
<main>
  <section class="hero center page-head reveal">
    <p class="eyebrow">${greet === 'Hello' ? 'Say Hello' : greet}</p>
    <h1>Let's Plan Something Beautiful</h1>
    <div class="divider" aria-hidden="true"></div>
  </section>
  <section class="section narrow contact-grid reveal">
    <div class="contact-info">
      <div class="card"><h3>Write to me</h3><p><a href="mailto:${t.persona.email}">${t.persona.email}</a></p></div>
      <div class="card"><h3>Based in</h3><p>${t.persona.city} &middot; available for festivals &amp; travel</p></div>
      <div class="card"><h3>Good times to reach me</h3><p>Festival seasons book fast — say hello early!</p></div>
    </div>
    <form id="contact-form" class="contact-form card" novalidate>
      <label>Your name<input type="text" name="name" required placeholder="Your full name"></label>
      <label>Email<input type="email" name="email" required placeholder="you@example.com"></label>
      <label>Message<textarea name="message" rows="5" required placeholder="Tell me about your celebration..."></textarea></label>
      <button class="btn" type="submit">Send Message</button>
      <p id="form-note" hidden>Thank you! Your message is ready to fly &mdash; connect this form to your email or favourite form service to receive messages.</p>
    </form>
  </section>
</main>
${footerBlock(t)}`;
}

// ---------------------------------------------------------------------------
// CSS emitter (palette variables + reveal / scroll-effect styles)
// ---------------------------------------------------------------------------
function cssFor(t) {
  const p = t.palette;
  return `/* ${t.theme} — ${t.roleDisplay} | Portfolio Builder Festival Family */
:root{
  --bg:${p.bg};
  --bg2:${p.bg2};
  --surface:${p.surface};
  --primary:${p.primary};
  --accent2:${p.accent2};
  --gold:${p.gold};
  --text:${p.text};
  --muted:${p.muted};
  --border:${p.border};
  --font-head:'${t.fonts.head}',Georgia,serif;
  --font-body:'${t.fonts.body}',system-ui,sans-serif;
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{background:radial-gradient(1200px 800px at 50% -10%,var(--bg2),var(--bg) 60%);color:var(--text);font-family:var(--font-body);min-height:100vh;overflow-x:hidden;line-height:1.6}
img{display:block}

/* --- animated chrome ------------------------------------------------------ */
.flowers-bg{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:.85;will-change:transform}
.mandala{position:fixed;z-index:0;pointer-events:none;opacity:.13;animation:spin 150s linear infinite}
.mandala-left{width:min(46vw,460px);height:auto;left:-150px;bottom:-140px}
.mandala-right{width:min(36vw,340px);height:auto;right:-130px;top:-110px;animation-direction:reverse}
.garland{position:fixed;top:0;left:0;width:100%;height:clamp(44px,6.4vw,86px);object-fit:cover;object-position:top center;z-index:60;pointer-events:none;filter:drop-shadow(0 3px 8px rgba(0,0,0,.45));will-change:transform}
@keyframes spin{to{transform:rotate(360deg)}}

/* --- header --------------------------------------------------------------- */
.site-head{position:relative;z-index:50;display:flex;align-items:center;justify-content:space-between;max-width:1180px;margin:0 auto;padding:calc(clamp(44px,6.4vw,86px) + 18px) 24px 10px}
.brand{display:flex;align-items:center;gap:10px;font-family:var(--font-head);font-size:1.25rem;color:var(--gold);text-decoration:none;letter-spacing:.4px}
.diya .flame{transform-origin:12px 11px;animation:flicker 1.8s ease-in-out infinite}
@keyframes flicker{0%,100%{transform:scaleY(1) scaleX(1);opacity:1}45%{transform:scaleY(.86) scaleX(1.06);opacity:.85}70%{transform:scaleY(1.06) scaleX(.96);opacity:.95}}
.nav-links{display:flex;gap:26px}
.nav-links a{color:var(--muted);text-decoration:none;font-size:.95rem;letter-spacing:.4px;transition:color .2s}
.nav-links a:hover{color:var(--gold)}
.nav-toggle{display:none;background:none;border:1px solid var(--border);border-radius:8px;padding:9px;cursor:pointer}
.nav-toggle span{display:block;width:18px;height:2px;background:var(--gold);margin:4px 0;border-radius:2px}

/* --- hero ------------------------------------------------------------------ */
main{position:relative;z-index:2}
.hero{max-width:1180px;margin:0 auto;padding:64px 24px 40px}
.eyebrow{color:var(--accent2);text-transform:uppercase;letter-spacing:3px;font-size:.78rem;font-weight:600;margin-bottom:14px}
.hero h1{font-family:var(--font-head);font-size:clamp(2.4rem,6vw,4.2rem);line-height:1.12;font-weight:700;margin-bottom:18px}
.lead{color:var(--muted);font-size:1.12rem;font-weight:300;max-width:620px}
.divider{height:12px;width:220px;margin:20px 0;background:linear-gradient(135deg,var(--primary) 25%,transparent 25%) -10px 0,linear-gradient(225deg,var(--primary) 25%,transparent 25%) -10px 0,linear-gradient(315deg,var(--primary) 25%,transparent 25%),linear-gradient(45deg,var(--primary) 25%,transparent 25%);background-size:16px 16px;border-bottom:2px solid var(--gold)}
.divider.wide{width:320px}
.cta-row{display:flex;gap:14px;margin-top:26px;flex-wrap:wrap}
.cta-row.center{justify-content:center}
.btn{display:inline-block;background:linear-gradient(135deg,var(--primary),var(--accent2));color:#fff;padding:12px 26px;border-radius:999px;text-decoration:none;font-weight:600;font-size:.95rem;border:none;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.35);transition:transform .2s,box-shadow .2s;font-family:var(--font-body)}
.btn:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(0,0,0,.45)}
.btn.ghost{background:transparent;border:1px solid var(--gold);color:var(--gold);box-shadow:none}
.hero.center{text-align:center}
.hero.center .lead,.hero.center .divider{margin-left:auto;margin-right:auto}
.hero.center .hero-art{display:flex;justify-content:center;margin-bottom:10px}
.hero.banner{min-height:66vh;display:flex;flex-direction:column;justify-content:flex-end;text-align:center}
.hero.banner .divider{margin-left:auto;margin-right:auto}
.hero.split{display:grid;grid-template-columns:1.15fr .85fr;gap:40px;align-items:center}
.hero-art{position:relative;display:flex;justify-content:center}
.hero-art svg{filter:drop-shadow(0 0 26px rgba(0,0,0,.4))}
.glow{position:absolute;width:90px;height:90px;border-radius:50%;background:radial-gradient(circle,var(--gold),transparent 70%);opacity:.4;animation:glowpulse 3.4s ease-in-out infinite;pointer-events:none}
.glow.g1{top:8%;left:14%}
.glow.g2{bottom:16%;right:10%;animation-delay:1.1s;width:60px;height:60px}
.glow.g3{top:48%;left:2%;animation-delay:2.2s;width:46px;height:46px}
@keyframes glowpulse{0%,100%{opacity:.42;transform:scale(1)}50%{opacity:.14;transform:scale(1.28)}}

/* --- scroll-reveal system --------------------------------------------------- */
.js .reveal,.js .card{opacity:0;transition:opacity .8s ease,transform .8s cubic-bezier(.22,.68,.3,1);will-change:opacity,transform}
.js .rv-up .reveal,.js .cards-up .card{transform:translateY(28px)}
.js .rv-zoom .reveal,.js .cards-zoom .card{transform:scale(.9)}
.js .rv-flip .reveal,.js .cards-flip .card{transform:perspective(900px) rotateX(12deg) translateY(20px)}
.js .rv-slide .reveal,.js .cards-slide .card{transform:translateX(-34px)}
.js .reveal.in,.js .card.in{opacity:1;transform:none}

/* --- sections & cards ------------------------------------------------------ */
.section{max-width:1180px;margin:0 auto;padding:44px 24px}
.section.narrow{max-width:820px}
.section-title{display:flex;align-items:center;gap:18px;font-family:var(--font-head);font-size:1.6rem;color:var(--text);margin-bottom:26px}
.section-title::before,.section-title::after{content:'';height:1px;background:linear-gradient(90deg,transparent,var(--border));flex:1}
.section-title::after{background:linear-gradient(90deg,var(--border),transparent)}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:28px;backdrop-filter:blur(14px);position:relative;overflow:hidden;transition:transform .25s,border-color .25s}
.js .card{transition:opacity .8s ease,transform .8s cubic-bezier(.22,.68,.3,1),border-color .25s}
.card:hover{transform:translateY(-4px);border-color:var(--gold)}
.js .card.in:hover{transform:translateY(-4px)}
.card h3{font-family:var(--font-head);color:var(--gold);font-size:1.15rem;margin-bottom:10px}
.card p{color:var(--muted);font-size:.95rem}
.card a{color:var(--gold)}
.card-num{position:absolute;top:14px;right:18px;font-family:var(--font-head);font-size:2rem;color:var(--border)}
.card.work .card-top{position:absolute;top:0;left:0;right:0;height:5px;background:repeating-linear-gradient(90deg,var(--primary) 0 18px,var(--gold) 18px 24px,transparent 24px 32px)}
.card.work{padding-top:34px}
.yr{display:inline-block;font-size:.78rem;color:var(--accent2);letter-spacing:2px;margin-bottom:8px}
.quote-band{text-align:center}
.quote-band blockquote{font-family:var(--font-head);font-size:1.5rem;color:var(--gold);max-width:640px;margin:0 auto;line-height:1.5}
.chips{display:flex;flex-wrap:wrap;gap:10px}
.chip{border:1px solid var(--border);border-radius:999px;padding:8px 16px;font-size:.85rem;color:var(--text);background:var(--surface)}
.chip.small{padding:4px 12px;font-size:.72rem;color:var(--accent2);letter-spacing:1.6px;text-transform:uppercase}
.page-head{text-align:center;padding-top:26px}
.page-head .lead{margin:0 auto}
.monogram{width:88px;height:88px;margin:0 auto 18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-size:2rem;color:#fff;background:radial-gradient(circle at 30% 30%,var(--accent2),var(--primary));box-shadow:0 0 34px var(--border);border:2px solid var(--gold)}
.tl{list-style:none;border-left:2px solid var(--border);margin-left:8px}
.tl li{position:relative;padding:0 0 26px 26px}
.tl li::before{content:'';position:absolute;left:-8px;top:4px;width:14px;height:14px;border-radius:50%;background:var(--primary);border:2px solid var(--gold);box-shadow:0 0 12px var(--border)}
.tl-year{font-family:var(--font-head);color:var(--gold);font-size:1.05rem}
.tl p{color:var(--muted)}

/* --- contact ---------------------------------------------------------------- */
.contact-grid{display:grid;grid-template-columns:1fr 1.3fr;gap:24px}
.contact-info{display:flex;flex-direction:column;gap:16px}
.contact-form{display:flex;flex-direction:column;gap:16px}
.contact-form label{display:flex;flex-direction:column;gap:7px;font-size:.88rem;color:var(--gold)}
.contact-form input,.contact-form textarea{background:rgba(0,0,0,.18);border:1px solid var(--border);border-radius:10px;padding:12px 14px;color:var(--text);font-family:var(--font-body);font-size:.95rem;outline:none;transition:border-color .2s}
.contact-form input:focus,.contact-form textarea:focus{border-color:var(--gold)}
.contact-form .btn{align-self:flex-start}
#form-note{color:var(--gold);font-size:.9rem}

/* --- footer ------------------------------------------------------------------ */
.site-foot{position:relative;z-index:2;margin-top:80px;padding-bottom:150px;text-align:center}
.foot-inner{max-width:1180px;margin:0 auto;padding:30px 24px 40px}
.foot-mark{display:flex;justify-content:center;margin-bottom:16px}
.foot-links{display:flex;justify-content:center;gap:24px;flex-wrap:wrap;margin-bottom:14px}
.foot-links a{color:var(--muted);text-decoration:none;font-size:.9rem;transition:color .2s}
.foot-links a:hover{color:var(--gold)}
.foot-note{color:var(--muted);font-size:.82rem;opacity:.8}
.kash{position:absolute;bottom:30px;left:0;width:100%;height:110px;object-fit:cover;object-position:bottom center;pointer-events:none;opacity:.95}
.kolam-border{position:absolute;bottom:0;left:0;right:0;height:30px;background:repeating-linear-gradient(45deg,var(--gold) 0 9px,transparent 9px 18px),repeating-linear-gradient(-45deg,var(--gold) 0 9px,transparent 9px 18px);background-color:var(--primary);border-top:2px solid var(--gold)}

/* --- entrance stagger + hero polish ------------------------------------------- */
.js .cards article:nth-child(2){transition-delay:.06s}
.js .cards article:nth-child(3){transition-delay:.12s}
.js .cards article:nth-child(4){transition-delay:.18s}
.js .cards article:nth-child(5){transition-delay:.24s}
.js .cards article:nth-child(6){transition-delay:.30s}
.js .cards article:nth-child(n+7){transition-delay:.36s}
.hero .eyebrow,.hero h1,.hero .divider,.hero .lead,.hero .cta-row,.page-head .eyebrow,.page-head h1,.page-head .divider,.page-head .lead{animation:heroIn .85s cubic-bezier(.2,.7,.3,1) backwards}
.hero .eyebrow,.page-head .eyebrow{animation-delay:.05s}
.hero h1,.page-head h1{animation-delay:.15s}
.hero .divider,.page-head .divider{animation-delay:.3s}
.hero .lead,.page-head .lead{animation-delay:.42s}
.hero .cta-row{animation-delay:.55s}
@keyframes heroIn{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}

/* split chars */
.split-ch{display:inline-block;will-change:transform}

/* --- responsive --------------------------------------------------------------- */
@media (max-width:860px){
  .hero.split{grid-template-columns:1fr}
  .contact-grid{grid-template-columns:1fr}
  .nav-toggle{display:block}
  .nav-links{display:none;position:absolute;top:100%;right:24px;flex-direction:column;background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:16px 26px;gap:14px}
  body.nav-open .nav-links{display:flex}
}
@media (prefers-reduced-motion:reduce){
  .flowers-bg,.mandala{display:none}
  .diya .flame,.glow{animation:none}
  .js .reveal,.js .card{opacity:1!important;transform:none!important;transition:none!important}
}
`;
}

// ---------------------------------------------------------------------------
// script.js (reveal + scroll effects, reduced-motion safe)
// ---------------------------------------------------------------------------
const SCRIPT_JS = `/* Festival portfolio — GSAP edition (ScrollTrigger choreography) */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var toggle = document.querySelector('.nav-toggle');
  if (toggle) toggle.addEventListener('click', function () {
    document.body.classList.toggle('nav-open');
  });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  var form = document.getElementById('contact-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var note = document.getElementById('form-note');
    if (note) note.hidden = false;
    form.reset();
  });

  if (!window.gsap) { // libraries missing -> reveal everything, done
    document.querySelectorAll('.reveal,.card').forEach(function (el) { el.classList.add('in'); });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* hero h1: split into chars + gsap rise */
  if (!reduced) document.querySelectorAll('.hero h1').forEach(function (h) {
    if (h.dataset.split) return; h.dataset.split = '1';
    var txt = h.textContent; h.textContent = '';
    txt.split('').forEach(function (c) {
      var sp = document.createElement('span');
      sp.className = 'split-ch'; sp.textContent = c === ' ' ? '\u00A0' : c;
      h.appendChild(sp);
    });
    gsap.from(h.querySelectorAll('.split-ch'), { yPercent: 110, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.035, delay: 0.15 });
  });

  /* reveals: ScrollTrigger.batch (CSS animates the .in class) */
  var els = document.querySelectorAll('.reveal,.card');
  if (reduced) {
    els.forEach(function (el) { el.classList.add('in'); });
  } else {
    ScrollTrigger.batch('.reveal,.card', { start: 'top 90%', once: true,
      onEnter: function (b) { b.forEach(function (el) { el.classList.add('in'); }); } });
  }

  /* fx choreography: ScrollTrigger scrub */
  if (!reduced) {
    var garland = document.querySelector('.garland');
    var floats = document.querySelector('.flowers-bg');
    var heroEl = document.querySelector('.hero');
    var mode = document.body.classList.contains('fx-parallax') ? 'parallax'
      : document.body.classList.contains('fx-cascade') ? 'cascade'
      : document.body.classList.contains('fx-drift') ? 'drift' : 'hero-fade';
    var maxST = { start: 'top top', end: 'max', scrub: true };
    if (mode === 'parallax') {
      if (garland) gsap.to(garland, { yPercent: 35, ease: 'none', scrollTrigger: maxST });
      if (floats) gsap.to(floats, { yPercent: 8, ease: 'none', scrollTrigger: maxST });
    } else if (mode === 'cascade') {
      if (garland) gsap.to(garland, { yPercent: -18, ease: 'none', scrollTrigger: maxST });
      if (floats) gsap.to(floats, { yPercent: -5, ease: 'none', scrollTrigger: maxST });
    } else if (mode === 'drift') {
      if (garland) gsap.to(garland, { yPercent: 10, ease: 'none', scrollTrigger: maxST });
      if (floats) gsap.to(floats, { yPercent: -12, ease: 'none', scrollTrigger: maxST });
    } else if (mode === 'hero-fade' && heroEl) {
      gsap.to(heroEl, { opacity: 0.45, scale: 0.94, ease: 'none',
        scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true } });
    }
  }

  /* magnetic CTAs */
  if (!reduced) document.querySelectorAll('.cta').forEach(function (b) {
    var mx = gsap.quickTo(b, 'x', { duration: 0.3, ease: 'power3' });
    var my = gsap.quickTo(b, 'y', { duration: 0.3, ease: 'power3' });
    b.addEventListener('mousemove', function (e) {
      var r = b.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * 0.22); my((e.clientY - r.top - r.height / 2) * 0.22);
    });
    b.addEventListener('mouseleave', function () { mx(0); my(0); });
  });

  window.dispatchEvent(new CustomEvent('pb:themechange'));
})();
`;

// ---------------------------------------------------------------------------
// Static preview generator — motif follows the garland mode
// ---------------------------------------------------------------------------
function previewSVG(t) {
  const p = t.palette;
  const W = 1200, H = 675;
  const flowers = [];
  for (let i = 0; i < 9; i++) {
    const x = 60 + i * 130 + ((i * 37) % 50);
    const y = 120 + ((i * 91) % 420);
    const s = 0.7 + ((i * 13) % 10) / 12;
    flowers.push(`<g transform="translate(${x} ${y}) scale(${s.toFixed(2)})"><g fill="${p.fx.petal}">${[0, 60, 120, 180, 240, 300].map(a => `<path transform="rotate(${a})" d="M0 0 C2.8-1.2 5.6-6.6 3.6-10.6 C1.8-12.4-2-11.4-2.4-8.2 C-2.8-5-1.4-2 0 0Z"/>`).join('')}</g><circle r="2.4" fill="${p.fx.core}"/></g>`);
  }
  let garland = '';
  const g = t.mode.garland;
  if (g === 'toran' || g === 'vine') {
    for (let x = 0; x < W; x += 100) {
      garland += `<path d="M${x} 8 Q${x + 50} 54 ${x + 100} 8" fill="none" stroke="${p.light ? '#8a6a3c' : '#7a4a1c'}" stroke-width="1.6"/>`;
      for (let k = 1; k <= 5; k++) {
        const u = k / 6;
        const bx = (1 - u) * (1 - u) * x + 2 * (1 - u) * u * (x + 50) + u * u * (x + 100);
        const by = (1 - u) * (1 - u) * 8 + 2 * (1 - u) * u * 54 + u * u * 8;
        garland += `<circle cx="${bx.toFixed(1)}" cy="${(by + 3).toFixed(1)}" r="${(3 + 5 * u * (1 - u) * 2).toFixed(1)}" fill="${k % 2 ? p.primary : p.gold}"/>`;
      }
    }
  } else if (g === 'lights') {
    garland += `<path d="M0 8 Q300 58 600 8 Q900 58 1200 8" fill="none" stroke="#5a4632" stroke-width="2"/>`;
    for (let x = 40; x < W; x += 66) {
      const y = 8 + Math.abs(Math.sin((x / W) * Math.PI * 2)) * 34 + 14;
      garland += `<line x1="${x}" y1="${y - 12}" x2="${x}" y2="${y}" stroke="#5a4632" stroke-width="1.4"/><circle cx="${x}" cy="${y + 6}" r="6" fill="${p.gold}" opacity=".95"/>`;
    }
  } else if (g === 'bunting') {
    garland += `<path d="M0 10 Q300 44 600 12 Q900 44 1200 10" fill="none" stroke="#7a5a34" stroke-width="2"/>`;
    for (let x = 6; x < W; x += 52) {
      const y = 10 + Math.abs(Math.sin((x / W) * Math.PI * 2)) * 16;
      garland += `<path d="M${x} ${y} L${x + 46} ${y} L${x + 23} ${y + 44} Z" fill="${[p.primary, p.gold, p.accent2, '#f8f4e6'][((x / 52) | 0) % 4]}"/>`;
    }
  } else if (g === 'lanterns') {
    garland += `<path d="M0 8 H1200" stroke="#8a5a28" stroke-width="2"/>`;
    for (let x = 48; x < W; x += 96) {
      const drop = 12 + ((x * 7) % 26);
      garland += `<line x1="${x}" y1="8" x2="${x}" y2="${drop}" stroke="#8a5a28" stroke-width="1.4"/><ellipse cx="${x}" cy="${drop + 24}" rx="15" ry="20" fill="${[p.primary, p.gold, p.accent2][((x / 96) | 0) % 3]}"/><ellipse cx="${x}" cy="${drop + 24}" rx="6.5" ry="10" fill="rgba(255,255,255,.3)"/>`;
    }
  } else if (g === 'sakura') {
    garland += `<path d="M0 14 Q300 46 600 28 Q900 46 1200 14" fill="none" stroke="#6b4a33" stroke-width="5"/>`;
    for (let x = 60; x < W; x += 78) {
      const y = 26 + ((x * 13) % 24);
      for (let b = 0; b < 3; b++) {
        const px = x + b * 16 - 12, py = y + ((b * 11) % 18) - 6;
        garland += `<g transform="translate(${px} ${py})" fill="${['#f9c0d4', '#f4a0c0', '#fbc8d9'][b % 3]}">${[0, 72, 144, 216, 288].map(a => `<ellipse rx="4.6" ry="7.4" transform="rotate(${a}) translate(0 -6.4)"/>`).join('')}<circle r="2.4" fill="#b04a68"/></g>`;
      }
    }
  } else if (g === 'pine') {
    for (let x = 0; x < W; x += 130) {
      garland += `<path d="M${x} 8 Q${x + 65} 50 ${x + 130} 8" fill="none" stroke="#2f5d3a" stroke-width="8" stroke-linecap="round"/>`;
      for (let k = 1; k <= 4; k++) {
        const u = k / 5;
        const bx = (1 - u) * (1 - u) * x + 2 * (1 - u) * u * (x + 65) + u * u * (x + 130);
        const by = (1 - u) * (1 - u) * 8 + 2 * (1 - u) * u * 50 + u * u * 8;
        garland += `<circle cx="${bx.toFixed(1)}" cy="${(by + 8).toFixed(1)}" r="6.5" fill="${[p.primary, p.gold, '#f8f4e6'][k % 3]}"/>`;
      }
    }
  } else if (g === 'papel') {
    garland += `<path d="M0 8 Q300 20 600 8 Q900 20 1200 8" fill="none" stroke="#5a3a5a" stroke-width="2"/>`;
    for (let x = 12; x < W; x += 130) {
      const y = 9;
      garland += `<rect x="${x}" y="${y}" width="100" height="56" fill="${[p.primary, p.accent2, p.gold, '#f472b6'][((x / 130) | 0) % 4]}"/><circle cx="${x + 28}" cy="${y + 24}" r="7" fill="rgba(0,0,0,.3)"/><circle cx="${x + 72}" cy="${y + 24}" r="7" fill="rgba(0,0,0,.3)"/><rect x="${x + 44}" y="${y + 36}" width="12" height="12" transform="rotate(45 ${x + 50} ${y + 42})" fill="rgba(0,0,0,.3)"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.bg2}"/><stop offset="1" stop-color="${p.bg}"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <g transform="translate(1050 520) scale(1.9)" opacity=".16"><circle r="130" fill="none" stroke="${p.accent2}" stroke-width="2"/>${[0, 30, 60, 90, 120, 150].map(a => `<ellipse rx="18" ry="62" fill="none" stroke="${p.accent2}" stroke-width="2" transform="rotate(${a})"/>`).join('')}</g>
  <g transform="translate(120 120) scale(1.4)" opacity=".14"><circle r="130" fill="none" stroke="${p.gold}" stroke-width="2"/>${[0, 45, 90, 135].map(a => `<ellipse rx="16" ry="60" fill="none" stroke="${p.gold}" stroke-width="2" transform="rotate(${a})"/>`).join('')}</g>
  ${g === 'snow' || t.mode.float === 'snow' ? '' : flowers.join('\n  ')}
  ${garland}
  <text x="600" y="330" text-anchor="middle" font-family="Georgia,serif" font-size="72" font-weight="700" fill="${p.text}">${esc(t.persona.name)}</text>
  <rect x="470" y="368" width="260" height="8" fill="${p.primary}"/>
  <text x="600" y="420" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="${p.gold}">${esc(t.roleDisplay)}</text>
  <text x="600" y="560" text-anchor="middle" font-family="Georgia,serif" font-size="22" fill="${p.muted}">${esc(t.theme)} &#183; Portfolio Builder Festival Family</text>
</svg>`;
}

// ---------------------------------------------------------------------------
// Template emission
// ---------------------------------------------------------------------------
const FOOTER_WORDS = { kash: 'kash grass', leaves: 'autumn leaves', snow: 'fresh snow', waves: 'rolling waves' };

function emitTemplate({ dir, id, themeSlug, themeName, roleSlug, roleDisplay, palette, family, familyKey, persona, fonts, layout, mode, group, quotes, index, taken, seenIds, svgOutbox }) {
  const assets = path.join(dir, 'assets');
  fs.mkdirSync(assets, { recursive: true });
  fs.mkdirSync(path.join(dir, 'vendor'), { recursive: true });
  for (const lib of ['gsap.min.js', 'ScrollTrigger.min.js']) {
    const vsrc = VENDOR_SRC[lib];
    if (vsrc && fs.existsSync(vsrc)) fs.copyFileSync(vsrc, path.join(dir, 'vendor', lib));
  }

  const art = buildArt(id, palette, mode);
  fs.writeFileSync(path.join(assets, 'floats.svg'), art.float, 'utf8');
  fs.writeFileSync(path.join(assets, 'garland.svg'), art.garland, 'utf8');
  fs.writeFileSync(path.join(assets, 'footer.svg'), art.footer, 'utf8');
  if (mode.footer === 'kash') fs.writeFileSync(path.join(assets, 'kash.svg'), art.footer, 'utf8');
  fs.writeFileSync(path.join(assets, 'mandala.svg'), art.pattern, 'utf8');

  const t = { index, id, themeSlug, themeName, roleSlug, roleDisplay, palette, family, familyKey, persona, fonts, layout, mode, group, footerWord: FOOTER_WORDS[mode.footer] };
  t.description = `${roleDisplay} portfolio in the ${themeName} festival style — ${modeKeyword(mode.garland)} garland, ${modeKeyword(mode.float)} drifting across the page, ${modeKeyword(mode.footer)} footer and ${modeKeyword(mode.scroll)} scroll motion.`;

  fs.writeFileSync(path.join(dir, 'index.html'), indexPage(t), 'utf8');
  fs.writeFileSync(path.join(dir, 'about.html'), aboutPage(t), 'utf8');
  fs.writeFileSync(path.join(dir, 'projects.html'), projectsPage(t), 'utf8');
  fs.writeFileSync(path.join(dir, 'contact.html'), contactPage(t), 'utf8');
  fs.writeFileSync(path.join(dir, 'style.css'), cssFor(t), 'utf8');
  fs.writeFileSync(path.join(dir, 'script.js'), SCRIPT_JS, 'utf8');

  const meta = {
    $schema: 'https://portfoliobuilders.dev/schemas/template-v1.json',
    id,
    name: `${themeName} ${roleDisplay}`,
    category: 'festival',
    role: roleDisplay,
    subcategory: roleSlug,
    framework: 'html',
    stack: 'HTML/CSS/JS',
    theme: themeName,
    language: ['html', 'css', 'javascript'],
    rendering: 'static',
    tags: ['festival', 'multi-page', `garland-${mode.garland}`, `float-${mode.float}`, `scroll-${mode.scroll}`, `reveal-${mode.reveal}`, familyKey, 'html', 'css', 'js'],
    description: t.description,
    source: {
      path: `templates/static/html/festival/${roleSlug}/${themeSlug}`,
      entry: 'index.html'
    },
    deployment: {
      provider: 'github-pages',
      type: 'shared-static',
      shard: 'github-pages-01',
      baseUrl: 'https://sudiptasanki.github.io/PortfolioBuilder',
      path: `festival/${roleSlug}/${themeSlug}`,
      liveUrl: `https://sudiptasanki.github.io/PortfolioBuilder/festival/${roleSlug}/${themeSlug}/index.html`,
      status: 'active'
    },
    preview: {
      image: `${ASSETS_CDN}/img_festival_${id}.webp`
    },
    contributor: {
      name: 'PortfolioBuilder Core',
      github: 'SudiptaSanki'
    }
  };
  fs.writeFileSync(path.join(dir, 'template.json'), JSON.stringify(meta, null, 2) + '\n', 'utf8');

  fs.writeFileSync(path.join(svgOutbox, `${id}.svg`), previewSVG(t), 'utf8');
  return 1;
}

function modeKeyword(key) {
  const map = {
    toran: 'marigold toran', lights: 'glowing string lights', bunting: 'swaying flag bunting',
    lanterns: 'hanging lanterns', sakura: 'cherry-blossom branch', pine: 'pine & bauble',
    papel: 'papel picado banners', vine: 'flower vine',
    daisy: 'drifting petals', marigold: 'spinning marigolds', sakura: 'falling sakura petals',
    leaves: 'falling autumn leaves', snow: 'gently falling snow', stars: 'twinkling stars',
    fireflies: 'wandering fireflies', confetti: 'tumbling confetti', lanterns: 'rising sky lanterns',
    hearts: 'floating hearts', kash: 'swaying kash grass', waves: 'rolling waves',
    parallax: 'layered parallax', cascade: 'rising cascade', 'hero-fade': 'cinematic hero fade', drift: 'dreamy drift'
  };
  return map[key] || key;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const taken = existingIds();
  const seenIds = new Set();
  const seenSlugs = new Set();
  let created = 0;

  fs.mkdirSync(outboxRoot, { recursive: true });
  const svgOutbox = path.join(outboxRoot, 'svg');
  fs.mkdirSync(svgOutbox, { recursive: true });

  // --- Indian batch (100) ---
  for (let i = 0; i < ROWS.length; i++) {
    const [themeSlug, themeName, roleSlug, roleDisplay, palIdx, famIdx, patIdx, layout, fontIdx] = ROWS[i];
    if (seenSlugs.has(themeSlug)) throw new Error(`Duplicate theme slug: ${themeSlug}`);
    seenSlugs.add(themeSlug);
    let id = themeSlug;
    if (taken.has(id) || seenIds.has(id)) id = `fest-${id}`;
    if (taken.has(id) || seenIds.has(id)) throw new Error(`Unresolvable id collision: ${themeSlug}`);
    seenIds.add(id);

    const mode = indianMode(i);
    mode.patternVariant = patIdx;
    created += emitTemplate({
      dir: path.join(templatesRoot, roleSlug, themeSlug),
      id, themeSlug, themeName, roleSlug, roleDisplay,
      palette: PALETTES[palIdx % PALETTES.length],
      family: FAMILIES[famIdx % FAMILIES.length],
      familyKey: FAMILIES[famIdx % FAMILIES.length].key,
      persona: personaFor(i, themeSlug),
      fonts: FONT_PAIRS[fontIdx % FONT_PAIRS.length],
      layout, mode, group: 'india', quotes: null, index: i, taken, seenIds, svgOutbox
    });
  }

  // --- Worldwide batch (100) ---
  for (let i = 0; i < WIDE_ROWS.length; i++) {
    const [themeSlug, themeName, roleSlug, roleDisplay, groupIdx, layout, fontIdx] = WIDE_ROWS[i];
    if (seenSlugs.has(themeSlug)) throw new Error(`Duplicate theme slug: ${themeSlug}`);
    seenSlugs.add(themeSlug);
    let id = themeSlug;
    if (taken.has(id) || seenIds.has(id)) id = `fest-${id}`;
    if (taken.has(id) || seenIds.has(id)) throw new Error(`Unresolvable id collision: ${themeSlug}`);
    seenIds.add(id);

    const group = GROUPS[groupIdx % GROUPS.length];
    const wideFamily = WIDE_FAMILIES[group.key];
    const mode = wideMode(group, i);
    created += emitTemplate({
      dir: path.join(templatesRoot, roleSlug, themeSlug),
      id, themeSlug, themeName, roleSlug, roleDisplay,
      palette: PALETTES_W[group.pal % PALETTES_W.length],
      family: wideFamily,
      familyKey: group.key,
      persona: westernPersonaFor(i, themeSlug),
      fonts: FONT_PAIRS[fontIdx % FONT_PAIRS.length],
      layout, mode, group: group.key, quotes: wideFamily.quotes, index: i, taken, seenIds, svgOutbox
    });
  }

  console.log(`Festival family generated: ${created} templates under ${path.relative(repoRoot, templatesRoot)}`);
  console.log(`Preview SVGs: ${path.relative(repoRoot, svgOutbox)} (convert with scripts/festival/convert-previews.js)`);
}

// ---------------------------------------------------------------------------
// Worldwide family content (per festival group)
// ---------------------------------------------------------------------------
const WIDE_FAMILIES = {
  christmas: {
    tagline: 'Where pine, ribbon and warm light turn winter into wonder.',
    skills: ['Festive styling', 'Handmade technique', 'Seasonal planning', 'Warm lighting design', 'Custom commissions', 'Quality finishing', 'Workshop hosting', 'Client care'],
    projects: [
      ['Holiday Open House', 'A signature seasonal showcase styled end to end for visiting families.'],
      ['Twelve Days Collection', 'A limited series released day by day through the festive season.'],
      ['Village Light Night', 'A community evening of lights, music and warm drinks.'],
      ['Winter Wedding Story', 'A candlelit celebration styled with pine, ribbon and snow-white blooms.'],
      ['Maker Market Stall', 'A season market stand with handmade goods and live demos.'],
      ['Charity Winter Drive', 'A giving campaign paired with festive workshops.']
    ],
    timeline: ['Learned the traditions in a big family kitchen', 'First seasonal commission', 'Featured at a winter market', 'Now runs a full festive-season studio'],
    quotes: ['Winter is the season of glow — and glow is a craft.', 'The warmest decorations are the ones made by hand.', 'Every string of lights is a small act of hope.']
  },
  halloween: {
    tagline: 'A little spooky, a lot of craft — autumn nights done right.',
    skills: ['Thematic design', 'Sculpting & carving', 'Costume craft', 'Atmosphere lighting', 'Prop making', 'Event production', 'Storytelling', 'Safety-first builds'],
    projects: [
      ['Front Yard Haunt', 'An annual home haunt that draws the whole neighbourhood.'],
      ['Cursed Gallery Night', 'An immersive art show of original dark works.'],
      ['Harvest Moon Fair', 'A family-friendly pumpkin patch and craft weekend.'],
      ['Costume Capsule', 'A made-to-order costume line for the spooky season.'],
      ['Ghost Walk Tour', 'A researched walking tour of local legends.'],
      ['Sweet & Sinister Boxes', 'Trick-or-treat confection collections with hand-drawn art.']
    ],
    timeline: ['Grew up building the family haunted porch', 'First paid haunt commission', 'The annual haunt became a local tradition', 'Now produces full spooky-season experiences'],
    quotes: ['The best scares are the ones built with love.', 'Autumn nights were made for storytelling.', 'Every pumpkin hides a grin waiting to be found.']
  },
  dia: {
    tagline: 'Marigolds, memories and colour — a celebration of those we love.',
    skills: ['Ofrenda design', 'Face & body art', 'Paper craft', 'Floral installations', 'Live performance', 'Community altars', 'Workshops', 'Cultural storytelling'],
    projects: [
      ['Community Ofrenda', 'A public altar honouring local loved ones with marigold paths.'],
      ['Face Painting Studio', 'Calavera artistry for festival nights and photo sessions.'],
      ['Papel Picado Series', 'Hand-cut banners for ofrendas, weddings and plazas.'],
      ['Noche de Museo', 'An after-dark museum celebration with altars and music.'],
      ['Mariachi Nights', 'Curated live music evenings for the season.'],
      ['Sugar Skull Workshops', 'Hands-on classes for all ages, sugar and smiles included.']
    ],
    timeline: ['Learned from family ofrendas', 'First public altar installation', 'Festival features and press', 'Now leads community celebrations'],
    quotes: ['To remember is to celebrate twice.', 'Marigolds are little suns we scatter for the ones we miss.', 'Colour is how this festival says we are still here.']
  },
  carnival: {
    tagline: 'Sequins, brass and motion — the street becomes a stage.',
    skills: ['Costume engineering', 'Choreography', 'Float construction', 'Mask making', 'Street performance', 'Sonic direction', 'Group coordination', 'Parade logistics'],
    projects: [
      ['Troupe Premiere', 'A debut dance troupe parade performance with original choreography.'],
      ['Winged Costume Build', 'An engineered feather-and-sequin showpiece.'],
      ['Venetian Ball', 'A masked evening of mystery, music and gilded halls.'],
      ['Street Block Party', 'A neighbourhood celebration with brass bands and confetti.'],
      ['Parade Choreography', 'Movement design for a two-hundred-person procession.'],
      ['Carnival Photo Series', 'A published documentary of the season in motion.']
    ],
    timeline: ['Started in a local parade school', 'First troupe costume built', 'Led a parade section', 'Now designs for the main celebration'],
    quotes: ['The street is the biggest stage in the world.', 'Sequins catch light; choreography catches hearts.', 'One day a year, the city dances as one.']
  },
  eid: {
    tagline: 'Lantern light, sweet days and generous nights.',
    skills: ['Arabic calligraphy', 'Lantern crafting', 'Sacred geometry', 'Oud performance', 'Festive baking', 'Tea hospitality', 'Interior styling', 'Community events'],
    projects: [
      ['Ramadan Nights Bazaar', 'A curated night-market of crafts, sweets and stories.'],
      ['Fanous Collection', 'A handmade lantern series for the holy month.'],
      ['Eid Table Styling', 'Complete festive table design and hosting.'],
      ['Calligraphy Commissions', 'Personalised names and verses as framed art.'],
      ['Oud Evenings', 'Intimate live music gatherings under string lights.'],
      ['Charity Iftar', 'Community fast-breaking dinners organised end to end.']
    ],
    timeline: ['Trained in classical arts', 'First seasonal collection', 'Community iftar leadership', 'Now a full festive studio'],
    quotes: ['Generosity is the decoration that never comes down.', 'A lantern lit for others brightens your own door.', 'The sweetest nights are the shared ones.']
  },
  hanukkah: {
    tagline: 'Eight nights of light, tradition and handmade warmth.',
    skills: ['Silverwork', 'Wood carving', 'Baking', 'Klezmer performance', 'Illuminated art', 'Storytelling', 'Ceremony hosting', 'Community teaching'],
    projects: [
      ['Menorah Collection', 'A handmade series for the festival of lights.'],
      ['Community Candlelight', 'Public menorah lightings with music and latkes.'],
      ['Hanukkah Market Stall', 'Seasonal handmade gifts, dreidels and gelt.'],
      ['Music Night', 'A klezmer evening with dancing and dessert.'],
      ['Illuminated Manuscript Art', 'Original calligraphy and gold-leaf illumination.'],
      ['Family Workshop Series', 'Craft and cooking classes for the season.']
    ],
    timeline: ['Apprenticed in a family workshop', 'First festival market', 'Community celebration leadership', 'Now a seasonal studio and stage'],
    quotes: ['A little light, placed well, outshines a lot of dark.', 'Tradition is a candle passed hand to hand.', 'Eight nights, eight chances to begin again.']
  },
  lunar: {
    tagline: 'Red lanterns rising — luck, family and fresh beginnings.',
    skills: ['Lantern crafting', 'Lion dance', 'Festive baking', 'Calligraphy', 'Paper art', 'Tea ceremony', 'Colour symbolism', 'Event production'],
    projects: [
      ['New Year Street Fair', 'A complete festival street with lanterns and lion dance.'],
      ['Lantern Installation', 'Hundreds of glowing lanterns across a riverfront.'],
      ['Red Envelope Collection', 'Original designs for luck, health and giving.'],
      ['Zodiac Art Series', 'Illustrated zodiac works for the new year.'],
      ['Tea & Mooncake Nights', 'Seasonal tasting evenings under the full moon.'],
      ['Couplet Commissions', 'Handwritten blessings for doorways and scrolls.']
    ],
    timeline: ['Grew up with temple fairs', 'First lantern commission', 'Festival performance leadership', 'Now produces city celebrations'],
    quotes: ['Every new year is a clean page waiting for good ink.', 'Lanterns rise so wishes know the way.', 'Luck follows the generous.']
  },
  japan: {
    tagline: 'Petals, lanterns and quiet craft — seasons honoured beautifully.',
    skills: ['Seasonal aesthetics', 'Textile styling', 'Culinary precision', 'Taiko performance', 'Floral design', 'Paper craft', 'Photography', 'Guest hospitality'],
    projects: [
      ['Hanami Picnic Series', 'Curated cherry-blossom viewings with seasonal cuisine.'],
      ['Kimono Season Shoots', 'Styling and photography under the petals.'],
      ['Matsuri Food Alley', 'A festival stall row with yatai classics and lanterns.'],
      ['Taiko Showcase', 'Thunderous drum performances at shrines and stages.'],
      ['Ikebana Exhibitions', 'Seasonal flower arrangements shown publicly.'],
      ['Origami Workshops', 'Fold-along classes for visitors of all ages.']
    ],
    timeline: ['Learned seasonal traditions locally', 'First exhibition', 'Festival stall and stage debut', 'Now hosts seasonal experiences'],
    quotes: ['The petals fall; the moment stays.', 'Mono no aware — beauty, because it is fleeting.', 'A season noticed well is a life noticed well.']
  },
  oktoberfest: {
    tagline: 'Long tables, brass bands and golden autumn light.',
    skills: ['Brewing craft', 'Baking', 'Folk music', 'Traditional tailoring', 'Hospitality', 'Cheese & pairings', 'Event logistics', 'Merriment curation'],
    projects: [
      ['Fest Tent Nights', 'A full festival tent with bands, food and steins.'],
      ['Pretzel Cart', 'A season street cart with warm, salt-crusted bakes.'],
      ['Dirndl & Lederhosen Edit', 'A traditional dress collection for the season.'],
      ['Alpine Music Evenings', 'Folk band showcases with dancing on the benches.'],
      ['Harvest Wine Walks', 'Guided tastings through the vintage rows.'],
      ['Gingerbread Heart Booth', 'Personalised festival hearts with piped icing.']
    ],
    timeline: ['Family brewery and market roots', 'First fest tent', 'Band residency seasons', 'Now runs seasonal halls'],
    quotes: ['Good cheer is brewed slowly and poured generously.', 'Music first, then the dancing finds you.', 'Autumn tastes like toasted grain and friendship.']
  },
  harvest: {
    tagline: 'Gather the season — gratitude, warmth and shared tables.',
    skills: ['Seasonal cuisine', 'Floral art', 'Market curation', 'Candle & light craft', 'Photography', 'Community hosting', 'Styling', 'Workshops'],
    projects: [
      ['Harvest Long Table', 'A field-to-fork community dinner at sunset.'],
      ['Seasonal Market Days', 'A curated market of makers and growers.'],
      ['Festival of Lights Evening', 'A lantern-lit community celebration.'],
      ['Floral Season Edit', 'Arrangements and styling for celebrations.'],
      ['Gratitude Portrait Sessions', 'Seasonal family photography among the colours.'],
      ['Craft Workshop Weekend', 'Hands-on seasonal making classes.']
    ],
    timeline: ['Rooted in seasonal family traditions', 'First market day', 'Community dinner host', 'Now curates seasonal celebrations'],
    quotes: ['Gratitude sets the best tables.', 'The harvest teaches: plant wide, share wide.', 'Every season deserves a proper welcome and a proper goodbye.']
  }
};

main();
