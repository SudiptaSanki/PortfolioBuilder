/**
 * genre-lab/effects.js — GSAP-powered design system (v2)
 * Real animation architecture: every archetype is driven by GSAP timelines and
 * ScrollTrigger (vendored per template). Techniques ported from React Bits:
 * Split Text, Aurora canvas, Spotlight Cards, Blur Text, Count Up, Particles.
 *
 * 10 hero archetypes · 6 work layouts · 3 contact styles · cursors · progress.
 */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function palette(hue, scheme) {
  const P = {
    dark: { bg: `hsl(${hue} 24% 7%)`, bg2: `hsl(${hue} 30% 11%)`, card: 'rgba(255,255,255,.05)', text: `hsl(${hue} 20% 94%)`, muted: `hsl(${hue} 14% 68%)`, acc: `hsl(${hue} 82% 62%)`, acc2: `hsl(${(hue + 40) % 360} 70% 58%)`, border: `hsl(${hue} 30% 22%)`, light: false },
    light: { bg: `hsl(${hue} 40% 96%)`, bg2: `hsl(${hue} 34% 92%)`, card: 'rgba(255,255,255,.75)', text: `hsl(${hue} 40% 14%)`, muted: `hsl(${hue} 12% 38%)`, acc: `hsl(${hue} 72% 40%)`, acc2: `hsl(${(hue + 40) % 360} 60% 46%)`, border: `hsl(${hue} 30% 82%)`, light: true },
    deep: { bg: `hsl(${hue} 45% 8%)`, bg2: `hsl(${hue} 50% 13%)`, card: 'rgba(255,255,255,.06)', text: `hsl(${hue} 30% 95%)`, muted: `hsl(${hue} 18% 70%)`, acc: `hsl(${hue} 78% 60%)`, acc2: `hsl(${(hue - 30 + 360) % 360} 70% 60%)`, border: `hsl(${hue} 40% 24%)`, light: false },
    warm: { bg: `hsl(${(hue + 12) % 360} 30% 9%)`, bg2: `hsl(${(hue + 12) % 360} 36% 14%)`, card: 'rgba(255,240,220,.05)', text: `hsl(${(hue + 12) % 360} 30% 94%)`, muted: `hsl(${(hue + 12) % 360} 16% 66%)`, acc: `hsl(${(hue + 18) % 360} 78% 60%)`, acc2: `hsl(${(hue - 20 + 360) % 360} 66% 58%)`, border: `hsl(${(hue + 12) % 360} 34% 24%)`, light: false },
    mono: { bg: '#101010', bg2: '#1a1a1a', card: 'rgba(255,255,255,.05)', text: '#eceae4', muted: '#9a9791', acc: `hsl(${hue} 30% 84%)`, acc2: `hsl(${hue} 24% 62%)`, border: '#2c2c2c', light: false }
  };
  return P[scheme] || P.dark;
}

const SCHEMES = ['dark', 'light', 'deep', 'warm', 'mono'];

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------
function css(cfg, v) {
  const scheme = SCHEMES[v];
  const p = palette(cfg.hue, scheme);
  const cursor = cfg.cursor;

  return `/* ${cfg.theme} — ${cfg.role} | Genre Lab v2 — GSAP design system */
:root{
  --bg:${p.bg}; --bg2:${p.bg2}; --card:${p.card}; --text:${p.text}; --muted:${p.muted};
  --acc:${p.acc}; --acc2:${p.acc2}; --border:${p.border};
  --mono:'Space Mono',ui-monospace,'Cascadia Mono',monospace;
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:'Segoe UI',system-ui,-apple-system,sans-serif;line-height:1.6;overflow-x:hidden}
a{color:var(--acc)}
img{display:block;max-width:100%}
::selection{background:var(--acc);color:var(--bg)}
h1,h2,h3{letter-spacing:-.02em}

/* progress */
.progress-bar{position:fixed;top:0;left:0;height:3px;width:0;background:linear-gradient(90deg,var(--acc),var(--acc2));z-index:90}
.ruler{position:fixed;right:18px;top:50%;transform:translateY(-50%);height:220px;width:2px;background:var(--border);z-index:90}
.ruler i{position:absolute;left:-3px;width:8px;height:8px;border-radius:50%;background:var(--acc);top:0}
.ruler span{position:absolute;right:12px;top:0;font-family:var(--mono);font-size:11px;color:var(--muted);transform:translateY(-50%)}

/* cursor */
${cursor === 'none' ? '' : cursor === 'dot' ? `
body{cursor:none}a,button,.chip,.card3d{cursor:none}
.cursor-dot{position:fixed;top:0;left:0;width:10px;height:10px;border-radius:50%;background:var(--acc);pointer-events:none;z-index:99;transform:translate(-50%,-50%)}
.cursor-dot.big{width:44px;height:44px;background:transparent;border:2px solid var(--acc)}` : `
body{cursor:none}a,button,.chip,.card3d{cursor:none}
.cursor-ring{position:fixed;top:0;left:0;width:34px;height:34px;border:1.5px solid var(--acc);border-radius:50%;pointer-events:none;z-index:99;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;transition:width .25s,height .25s,background .25s}
.cursor-ring span{font-family:var(--mono);font-size:10px;color:var(--bg);opacity:0}
.cursor-ring.label{width:64px;height:64px;background:var(--acc)}
.cursor-ring.label span{opacity:1}`}

/* nav */
nav{position:fixed;top:0;left:0;right:0;z-index:80;display:flex;justify-content:space-between;align-items:center;padding:16px 5vw;background:color-mix(in srgb,var(--bg) 82%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--border)}
nav .brand{font-weight:700;color:var(--text);text-decoration:none;display:flex;align-items:center;gap:9px}
nav .brand i{width:9px;height:9px;background:var(--acc);border-radius:2px}
nav .links a{color:var(--muted);text-decoration:none;font-size:.9rem;margin-left:22px;transition:color .2s}
nav .links a:hover{color:var(--acc)}

/* section base + gsap blur-in words */
section{max-width:1180px;margin:0 auto;padding:96px 5vw}
.kicker{font-family:var(--mono);font-size:.75rem;letter-spacing:.25em;text-transform:uppercase;color:var(--acc);margin-bottom:12px}
h2.sec{font-size:clamp(1.8rem,3.8vw,2.6rem);font-weight:800;overflow:hidden;padding-bottom:.1em}
h2.sec .w{display:inline-block;will-change:transform,filter}
h2.sec em{color:var(--acc);font-style:normal}
.about-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:48px;align-items:start;margin-top:34px}
.about-grid p{color:var(--muted);margin-bottom:14px}
.about-grid .side{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px}
.about-grid .side b{color:var(--acc)}

/* images */
.img-wrap{position:relative;overflow:hidden;border-radius:14px;background:var(--bg2)}
.img-wrap img{width:100%;height:100%;object-fit:cover;display:block}
.about-img{border-radius:18px 18px 18px 44px;margin-bottom:38px;outline:1px solid var(--border);outline-offset:7px;aspect-ratio:3/1.6}
.work-h .img-wrap,.works-chips .img-wrap{aspect-ratio:16/10}
.works-bento article:first-child .img-wrap{aspect-ratio:16/9}

/* marquee */
.marquee{overflow:hidden;border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:14px 0;background:var(--bg2)}
.marquee .track{display:flex;gap:48px;width:max-content;animation:slide 26s linear infinite}
.marquee span{font-family:var(--mono);font-size:.85rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);white-space:nowrap}
.marquee span i{color:var(--acc);font-style:normal;margin-right:10px}
@keyframes slide{to{transform:translateX(-50%)}}

/* quote band */
.quote-band{max-width:900px}
.quote-band blockquote{font-size:clamp(1.3rem,2.6vw,1.7rem);color:var(--acc);border-left:3px solid var(--acc);padding-left:24px;line-height:1.5}

/* stats band */
.stats{display:flex;gap:44px;flex-wrap:wrap;justify-content:center}
.stats b{font-size:2.6rem;font-weight:800;color:var(--acc);display:block;font-variant-numeric:tabular-nums}
.stats span{color:var(--muted);font-size:.85rem}

/* works grids */
.grid{display:grid;gap:18px}
.grid.b3{grid-template-columns:repeat(3,1fr)}
.grid.b3 article:first-child{grid-column:span 2}
article.work{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:24px;overflow:hidden;transition:border-color .25s}
article.work:hover{border-color:var(--acc)}
article.work .no{font-family:var(--mono);color:var(--acc);font-size:.8rem}
article.work h3{margin:10px 0 6px;font-size:1.12rem}
article.work p{color:var(--muted);font-size:.92rem}
article.work .cat{font-family:var(--mono);font-size:.68rem;letter-spacing:.15em;color:var(--acc2);text-transform:uppercase}
.spotlight{position:relative}
.spotlight::before{content:'';position:absolute;inset:0;border-radius:inherit;background:radial-gradient(420px circle at var(--mx,50%) var(--my,50%),color-mix(in srgb,var(--acc) 22%,transparent),transparent 45%);opacity:0;transition:opacity .3s;pointer-events:none}
.spotlight:hover::before{opacity:1}
.works-horiz-wrap{display:flex;gap:18px;overflow:hidden;padding:6px 5vw 26px;margin:0 -5vw}
.work-h{min-width:340px;background:var(--card);border:1px solid var(--border);border-radius:18px;padding:24px}
.horiz-progress{height:3px;background:var(--border);border-radius:2px;margin:0 5vw;overflow:hidden}
.horiz-progress i{display:block;height:100%;width:0;background:var(--acc)}
.chips{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0 26px}
.chip{border:1px solid var(--border);background:var(--card);color:var(--muted);border-radius:999px;padding:7px 16px;font-size:.85rem;cursor:pointer;transition:.2s;font-family:inherit}
.chip.on{background:var(--acc);color:var(--bg);border-color:var(--acc)}
.list-rows{border-top:1px solid var(--border)}
.list-rows article{display:grid;grid-template-columns:70px 1fr auto;gap:20px;align-items:center;padding:26px 8px;border-bottom:1px solid var(--border);position:relative;transition:padding .3s,background .3s}
.list-rows article:hover{background:var(--card);padding-left:18px}
.list-rows .no{font-family:var(--mono);color:var(--acc)}
.list-rows h3{font-size:1.25rem}
.list-rows p{color:var(--muted);font-size:.9rem}
.list-rows .arrow{color:var(--acc);font-size:1.3rem;transition:transform .3s}
.list-rows article:hover .arrow{transform:translateX(6px)}
.list-preview{position:fixed;width:300px;height:200px;border-radius:14px;overflow:hidden;pointer-events:none;z-index:70;opacity:0;transform:scale(.9)}
.list-preview img{width:100%;height:100%;object-fit:cover}

/* services accordion */
.svc{border-bottom:1px solid var(--border)}
.svc button{width:100%;background:none;border:none;color:var(--text);display:flex;justify-content:space-between;align-items:center;padding:20px 4px;font-size:1.15rem;font-weight:700;cursor:pointer;font-family:inherit;text-align:left}
.svc button i{font-style:normal;color:var(--acc);transition:transform .3s}
.svc.open button i{transform:rotate(45deg)}
.svc .body{height:0;overflow:hidden}
.svc .body p{color:var(--muted);padding:0 4px 22px}
.svc .num{font-family:var(--mono);color:var(--acc);margin-right:16px;font-size:.9rem}

/* contact */
.terminal{background:#0a0c10;border:1px solid #1d2733;border-radius:14px;overflow:hidden;font-family:var(--mono);font-size:.92rem;max-width:760px;margin:0 auto}
.terminal .bar{display:flex;gap:8px;padding:12px 16px;background:#101620}
.terminal .bar i{width:11px;height:11px;border-radius:50%;background:#2c3a4c}
.terminal .bar i:first-child{background:var(--acc)}
.terminal pre{padding:22px 26px;color:#9fb8cc;white-space:pre-wrap;line-height:1.9}
.terminal pre b{color:var(--acc)}
.terminal pre a{color:#7dd3fc}
.big-cta{text-align:center}
.big-cta a{display:inline-block;font-size:clamp(1.6rem,5vw,3.4rem);font-weight:800;text-decoration:none;color:var(--text);background-image:linear-gradient(var(--acc),var(--acc));background-repeat:no-repeat;background-size:0% 12%;background-position:0 88%;transition:background-size .4s,color .3s}
.big-cta a:hover{background-size:100% 12%;color:var(--acc)}
.big-cta p{color:var(--muted);margin-top:16px}
.form-card{max-width:640px;margin:0 auto;background:var(--card);border:1px solid var(--border);border-radius:18px;padding:32px;display:grid;gap:14px}
.form-card label{display:flex;flex-direction:column;gap:6px;font-size:.85rem;color:var(--muted)}
.form-card input,.form-card textarea{background:color-mix(in srgb,var(--bg) 70%,transparent);border:1px solid var(--border);border-radius:10px;padding:12px 14px;color:var(--text);font-family:inherit;outline:none;transition:border-color .2s}
.form-card input:focus,.form-card textarea:focus{border-color:var(--acc)}
.form-card .btn{justify-self:start;background:var(--acc);color:var(--bg);border:none;padding:13px 26px;border-radius:999px;font-weight:700;cursor:pointer;font-family:inherit}
#form-ok{color:var(--acc);font-size:.9rem}

/* buttons */
.cta{display:inline-block;background:var(--acc);color:var(--bg);padding:13px 28px;border-radius:999px;text-decoration:none;font-weight:700;will-change:transform}
.cta.ghost{background:transparent;border:2px solid var(--acc);color:var(--acc)}

/* footer */
footer{border-top:1px solid var(--border);padding:36px 5vw;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;color:var(--muted);font-size:.85rem}
footer a{color:var(--muted)}

/* ---- hero archetypes ---- */
.hero{min-height:92vh;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;padding:120px 5vw 60px}
.eyebrow{font-family:var(--mono);font-size:.78rem;letter-spacing:.25em;text-transform:uppercase;color:var(--acc);margin-bottom:14px}
.hero .sub{color:var(--muted);font-size:1.1rem;max-width:600px;margin-top:18px}
.cta-row{display:flex;gap:14px;margin-top:30px;flex-wrap:wrap}
.hero.center{text-align:center}
.hero.center .sub,.hero.center .eyebrow{margin-left:auto;margin-right:auto}
.hero.center .cta-row{justify-content:center}

/* 1 splitRise */
.split-hero h1{font-size:clamp(2.8rem,8vw,5.6rem);font-weight:800;line-height:1.02;overflow:hidden;padding-bottom:.12em}
.split-hero h1 .ch{display:inline-block;will-change:transform,filter}
.split-hero h1 .ch.acc{background:linear-gradient(120deg,var(--acc),var(--acc2));-webkit-background-clip:text;background-clip:text;color:transparent}
.split-hero .rule{width:180px;height:6px;margin-top:22px;background:repeating-linear-gradient(-45deg,var(--acc) 0 10px,transparent 10px 20px)}

/* 2 stickerBoard */
.sticker-hero{background:var(--bg2)}
.sticker-hero h1{text-transform:uppercase;font-size:clamp(2.8rem,8vw,5.4rem)}
.badge-outline{display:inline-block;border:3px solid var(--text);padding:6px 14px;font-family:var(--mono);font-weight:700;box-shadow:4px 4px 0 var(--acc)}
.sticker{position:absolute;font-family:var(--mono);font-weight:700;padding:14px 20px;font-size:.9rem;box-shadow:4px 4px 0 rgba(0,0,0,.35);cursor:grab;user-select:none;touch-action:none;display:flex;align-items:center;gap:8px;z-index:5}
.sticker:active{cursor:grabbing}
.sticker small{opacity:.65;font-weight:400}
.sticker.s1{background:var(--acc);color:var(--bg);top:12%;left:6%;transform:rotate(-6deg)}
.sticker.s2{background:var(--acc2);color:var(--bg);top:16%;right:8%;transform:rotate(5deg)}
.sticker.s3{background:var(--text);color:var(--bg);bottom:18%;left:10%;transform:rotate(3deg)}
.sticker.s4{background:var(--acc);color:var(--bg);bottom:22%;right:12%;transform:rotate(-4deg)}

/* 3 aurora */
.aurora-hero canvas.aurora{position:absolute;inset:0;width:100%;height:100%}
.aurora-hero .hero-inner{position:relative;z-index:2;text-align:center;margin:0 auto}

/* 4 particlesMorph */
.particles-hero canvas.pfield{position:absolute;inset:0;width:100%;height:100%}
.particles-hero .hero-inner{position:relative;z-index:2;text-align:center;margin:0 auto}
.particles-hero h1{font-size:clamp(2.6rem,7vw,4.6rem);color:transparent;-webkit-text-stroke:1px var(--muted);text-transform:uppercase}

/* 5 spotlightGrid */
.spot-hero-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:40px;position:relative;z-index:2}
.spot-hero-grid .cell{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px;font-family:var(--mono);font-size:.85rem;color:var(--muted);position:relative;overflow:hidden}
.spot-hero-grid .cell b{color:var(--acc);display:block;margin-bottom:4px}
.spot-hero-grid .cell::before{content:'';position:absolute;inset:0;background:radial-gradient(260px circle at var(--mx,50%) var(--my,50%),color-mix(in srgb,var(--acc) 26%,transparent),transparent 55%);opacity:0;transition:opacity .3s}
.spot-hero-grid .cell:hover::before{opacity:1}

/* 6 marqueeHero */
.mq-hero{justify-content:center;gap:10px;padding-top:80px}
.mq-band{overflow:hidden;white-space:nowrap;font-size:clamp(2.4rem,7vw,4.6rem);font-weight:800;text-transform:uppercase;line-height:1.05;color:var(--bg);-webkit-text-stroke:1.5px var(--muted)}
.mq-band.filled{color:var(--acc);-webkit-text-stroke:0}
.mq-band .inner{display:inline-block;will-change:transform}
.mq-hero .hero-inner{position:relative;z-index:2;text-align:center;margin:30px auto 0}

/* 7 typeCounter */
.type-hero .type-line{font-family:var(--mono);font-size:clamp(1.5rem,3.6vw,2.3rem);font-weight:700;min-height:1.5em}
.type-hero .type-line .caret{display:inline-block;width:.55em;background:var(--acc);animation:blink 1s steps(1) infinite;color:transparent}
@keyframes blink{50%{opacity:0}}

/* 8 imageCollapse */
.collapse-hero .stack{position:absolute;inset:0;z-index:0}
.collapse-hero .stack .layer{position:absolute;inset:0;overflow:hidden}
.collapse-hero .stack img{width:100%;height:100%;object-fit:cover}
.collapse-hero .scrim{position:absolute;inset:0;background:linear-gradient(180deg,transparent 30%,var(--bg));z-index:1}
.collapse-hero .hero-inner{position:relative;z-index:2}
.collapse-hero h1{font-size:clamp(2.6rem,7vw,4.8rem)}

/* 9 tileScatter */
.tile-wall{position:absolute;inset:-40px;display:grid;grid-template-columns:repeat(8,1fr);gap:4px;z-index:0;opacity:.55}
.tile-wall i{background:var(--bg2);border:1px solid var(--border);border-radius:3px}
.hero-tiles .hero-inner{position:relative;z-index:2}

/* 10 glarePortrait */
.glare-hero{display:grid;grid-template-columns:1fr 1fr;gap:44px;align-items:center}
.glare-hero .portrait{position:relative;border-radius:20px;overflow:hidden;aspect-ratio:4/5}
.glare-hero .portrait img{width:100%;height:100%;object-fit:cover}
.glare-hero .portrait::after{content:'';position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.28) 46%,transparent 60%);transform:translateX(-120%);transition:transform .7s}
.glare-hero .portrait:hover::after{transform:translateX(120%)}
.glare-hero .words span{display:inline-block;font-size:clamp(1.9rem,4.6vw,3.3rem);font-weight:800;margin-right:.35em;will-change:transform,filter}
.glare-hero .words span.accent{color:var(--acc)}

@media (max-width:860px){
  .about-grid{grid-template-columns:1fr}
  .grid.b3{grid-template-columns:1fr}
  .grid.b3 article:first-child{grid-column:span 1}
  .spot-hero-grid{grid-template-columns:1fr}
  .glare-hero{grid-template-columns:1fr}
  nav .links a{margin-left:14px;font-size:.82rem}
  .sticker{padding:10px 14px;font-size:.78rem}
  .stats{gap:22px}
  .list-rows article{grid-template-columns:44px 1fr}
  .list-preview{display:none}
}
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .marquee .track{animation:none}
  .hero-type .caret{animation:none}
  body,a,button{cursor:auto!important}
  .cursor-dot,.cursor-ring{display:none!important}
}
`;
}

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------
function splitChars(text, accentEvery) {
  return [...text].map((c, i) => `<span class="ch${accentEvery && i % accentEvery === 2 ? ' acc' : ''}">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('');
}

function navHTML(cfg) {
  return `<nav><a class="brand" href="#top"><i></i>${esc(cfg.persona)}</a><div class="links"><a href="#works">Work</a><a href="#services">Services</a><a href="#contact">Contact</a></div></nav>`;
}

function heroHTML(cfg) {
  const e = esc;
  const eyebrow = `<p class="eyebrow">${e(cfg.role)} · Portfolio</p>`;
  const sub = `<p class="sub">${e(cfg.tag)}</p>`;
  const ctas = `<div class="cta-row"><a class="cta" href="#works">See the work</a><a class="cta ghost" href="#contact">Contact</a></div>`;

  switch (cfg.hero) {
    case 'splitRise':
      return `<header class="hero split-hero" id="top">${eyebrow}<h1 aria-label="${e(cfg.persona)}">${splitChars(cfg.persona, 4)}</h1><div class="rule" aria-hidden="true"></div>${sub}${ctas}</header>`;
    case 'stickerBoard':
      return `<header class="hero sticker-hero" id="top">${eyebrow}<h1>${e(cfg.persona)}</h1><p class="badge-outline">${e(cfg.role.toUpperCase())}</p>${sub}${ctas}
        <div class="sticker s1" data-drag>✦ ${e(cfg.skills[0])}</div>
        <div class="sticker s2" data-drag>◈ est. ${e(String(cfg.year))}</div>
        <div class="sticker s3" data-drag>▲ ${e(cfg.skills[3])}</div>
        <div class="sticker s4" data-drag>✉ drag me</div></header>`;
    case 'aurora':
      return `<header class="hero aurora-hero center" id="top"><canvas class="aurora" data-aurora aria-hidden="true"></canvas><div class="hero-inner">${eyebrow}<h1>${e(cfg.persona)}</h1>${sub}${ctas}</div></header>`;
    case 'particlesMorph':
      return `<header class="hero particles-hero center" id="top"><canvas class="pfield" data-particles aria-hidden="true"></canvas><div class="hero-inner">${eyebrow}<h1>${e(cfg.persona.toUpperCase())}</h1>${sub}${ctas}</div></header>`;
    case 'spotlightGrid':
      return `<header class="hero" id="top">${eyebrow}<h1>${e(cfg.persona)}</h1>${sub}<div class="spot-hero-grid">${cfg.skills.slice(0, 6).map((s, i) => `<div class="cell" data-spot><b>${e(String(i + 1).padStart(2, '0'))}</b>${e(s)}</div>`).join('')}</div>${ctas}</header>`;
    case 'marqueeHero': {
      const band = (t, cls) => `<div class="mq-band ${cls}"><span class="inner">${e((t + ' · ').repeat(4))}</span></div>`;
      return `<header class="hero mq-hero" id="top">
        ${band(cfg.persona.toUpperCase(), 'outline')}${band(cfg.role.toUpperCase(), 'filled')}
        <div class="hero-inner">${sub}${ctas}</div></header>`;
    }
    case 'typeCounter': {
      const stats = cfg.projects.slice(0, 3).map(([t], i) => `<div><b data-count="${6 + i * 5}">0</b><span>${e(t)}</span></div>`).join('');
      return `<header class="hero type-hero" id="top">${eyebrow}<h1>${e(cfg.persona)}</h1>
        <p class="type-line"><span data-type="${e(cfg.tag)}"></span><span class="caret">I</span></p>
        <div class="stats">${stats}</div>${ctas}</header>`;
    }
    case 'imageCollapse': {
      const layers = [1, 2, 3].map(n => `<div class="layer" data-layer="${n}"><img src="./assets/photos/work${n}.webp" alt="" loading="eager"></div>`).join('');
      return `<header class="hero collapse-hero" id="top"><div class="stack" data-stack>${layers}</div><div class="scrim" aria-hidden="true"></div>
        <div class="hero-inner">${eyebrow}<h1>${e(cfg.persona)}</h1>${sub}${ctas}</div></header>`;
    }
    case 'tileScatter': {
      const tiles = Array.from({ length: 40 }, (_, i) => `<i data-tile style="--tx:${((i * 37) % 240) - 120}px;--ty:${((i * 61) % 200) - 100}px;--tr:${((i * 13) % 40) - 20}deg"></i>`).join('');
      return `<header class="hero hero-tiles" id="top"><div class="tile-wall" data-tilewall aria-hidden="true">${tiles}</div><div class="hero-inner">${eyebrow}<h1>${e(cfg.persona)}</h1>${sub}${ctas}</div></header>`;
    }
    case 'glarePortrait': {
      const words = cfg.tag.split(' ').slice(0, 5).map((w, i) => `<span class="${i === 1 ? 'accent' : ''}" data-blurword>${e(w)}</span>`).join('');
      return `<header class="hero glare-hero" id="top">
        <div class="portrait"><img src="./assets/photos/about.webp" alt="${e(cfg.persona)}" loading="eager"></div>
        <div>${eyebrow}<div class="words">${words}</div><h1 style="font-size:1.4rem;font-weight:600;color:var(--muted);margin-top:14px">${e(cfg.role)}</h1>
        <p class="sub">${e(cfg.tag)}</p>${ctas}</div></header>`;
    }
    default:
      return `<header class="hero split-hero" id="top">${eyebrow}<h1>${splitChars(cfg.persona, 4)}</h1>${sub}${ctas}</header>`;
  }
}

function worksHTML(cfg) {
  const e = esc;
  const secHead = `<p class="kicker">Selected work</p><h2 class="sec" data-words>Things I have <em>made</em></h2>`;
  const img = (i) => `<div class="img-wrap"><img src="./assets/photos/work${(i % 3) + 1}.webp" alt="" loading="lazy" width="640" height="427"></div>`;
  const catKeys = ['flagship', 'build', 'study', 'collab', 'field', 'lab'];

  switch (cfg.work) {
    case 'bentoSpotlight':
      return `<section id="works">${secHead}<div class="grid b3">${cfg.projects.map(([t, d], i) =>
        `<article class="work spotlight reveal" data-batch>${img(i)}<span class="no">${String(i + 1).padStart(2, '0')}</span><h3>${e(t)}</h3><p>${e(d)}</p></article>`).join('')}</div></section>`;
    case 'horizPin':
      return `<section id="works" style="max-width:none;padding-left:0;padding-right:0">${secHead}
        <div class="horiz-pin"><div class="works-horiz-wrap">${cfg.projects.map(([t, d], i) =>
          `<article class="work-h">${img(i)}<span class="no">${String(i + 1).padStart(2, '0')}</span><h3>${e(t)}</h3><p>${e(d)}</p></article>`).join('')}</div>
        <div class="horiz-progress"><i data-hprogress></i></div></div></section>`;
    case 'tiltGlare':
      return `<section id="works">${secHead}<div class="grid b3">${cfg.projects.map(([t, d], i) =>
        `<article class="work card3d reveal" data-tilt data-glare>${img(i)}<span class="no">${String(i + 1).padStart(2, '0')}</span><h3>${e(t)}</h3><p>${e(d)}</p></article>`).join('')}</div></section>`;
    case 'chipsFilter': {
      const cats = ['all', ...new Set(cfg.projects.map((p, i) => catKeys[Math.min(i, 5)]))];
      return `<section id="works">${secHead}<div class="chips">${cats.map((c, i) => `<button class="chip${i === 0 ? ' on' : ''}" data-cat="${c}">${e(c)}</button>`).join('')}</div>
        <div class="grid">${cfg.projects.map(([t, d], i) => `<article class="work reveal" data-batch data-cat="${catKeys[Math.min(i, 5)]}"><span class="cat">${e(catKeys[Math.min(i, 5)])}</span><span class="no">${String(i + 1).padStart(2, '0')}</span><h3>${e(t)}</h3><p>${e(d)}</p></article>`).join('')}</div></section>`;
    }
    case 'staggerZig':
      return `<section id="works">${secHead}<div class="grid">${cfg.projects.map(([t, d], i) =>
        `<article class="work reveal" data-batch data-zig="${i % 2}"><div class="img-wrap" data-parallax><img src="./assets/photos/work${(i % 3) + 1}.webp" alt="" loading="lazy"></div><span class="no">${String(i + 1).padStart(2, '0')}</span><h3>${e(t)}</h3><p>${e(d)}</p></article>`).join('')}</div></section>`;
    case 'listHover':
      return `<section id="works">${secHead}<div class="list-rows">${cfg.projects.map(([t, d], i) =>
        `<article class="reveal" data-batch data-preview="work${(i % 3) + 1}.webp"><span class="no">${String(i + 1).padStart(2, '0')}</span><div><h3>${e(t)}</h3><p>${e(d)}</p></div><span class="arrow">→</span></article>`).join('')}</div>
        <div class="list-preview" data-lpreview><img src="./assets/photos/work1.webp" alt=""></div></section>`;
    default:
      return `<section id="works">${secHead}<div class="grid b3">${cfg.projects.map(([t, d], i) => `<article class="work spotlight reveal"><span class="no">${String(i + 1).padStart(2, '0')}</span><h3>${e(t)}</h3><p>${e(d)}</p></article>`).join('')}</div></section>`;
  }
}

function bodyHTML(cfg) {
  const e = esc;
  const mq = cfg.skills.concat(cfg.skills).map(s => `<span><i>◆</i>${e(s)}</span>`).join('');
  const marquee = `<div class="marquee" aria-hidden="true"><div class="track">${mq}</div></div>`;

  const about = `<section class="reveal" id="about">
    <div class="img-wrap about-img"><img src="./assets/photos/about.webp" alt="${e(cfg.persona)}" loading="lazy" width="900" height="600"></div>
    <div class="about-grid"><div><p class="kicker">About</p><h2 class="sec" data-words>The short <em>version</em></h2>
      <p>${e(cfg.tag)}</p><p>Everything on this page is made to be scrolled slowly. The work below is the honest list — outcomes attached, fluff removed.</p></div>
    <div class="side"><p class="kicker">Currently</p><p><b>Focus</b> — ${e(cfg.skills[0])}</p><p><b>Also</b> — ${e(cfg.skills[1])}</p><p><b>Based</b> — ${e(cfg.city)}</p></div></div></section>`;

  const works = worksHTML(cfg);

  const svc = cfg.skills.map((sk, i) => `<div class="svc${i === 0 ? ' open' : ''}"><button type="button"><span><span class="num">${String(i + 1).padStart(2, '0')}</span>${e(sk)}</span><i>+</i></button>
    <div class="body"><p>${e(cfg.tag)} ${e(sk)} is where this shows up most — ask for examples on a call.</p></div></div>`).join('');
  const services = `<section id="services"><p class="kicker">Services</p><h2 class="sec" data-words>What working together <em>looks like</em></h2><div style="margin-top:26px">${svc}</div></section>`;

  const quote = (gi) => (gi % 3 === 0) ? `<section class="quote-band reveal"><blockquote data-words>“${e(cfg.tag)}”</blockquote></section>` : '';
  const statsBand = (gi, v) => ((gi * 2 + v) % 4 === 1) ? `<section class="reveal"><div class="stats">${cfg.projects.slice(0, 3).map(([t], i) => `<div><b data-count="${6 + i * 5}">0</b><span>${e(t)}</span></div>`).join('')}</div></section>` : '';

  let contactHTML;
  if (cfg.contact === 'terminal') {
    contactHTML = `<div class="terminal"><div class="bar"><i></i><i></i><i></i></div><pre><b>guest@${e(cfg.slug)}</b>:~$ contact --init
→ name  : <b>${e(cfg.persona)}</b>
→ role  : ${e(cfg.role)}
→ email : <a href="mailto:${e(cfg.email)}">${e(cfg.email)}</a>
→ response-time : within 24 hours
<b>guest@${e(cfg.slug)}</b>:~$ _</pre></div>`;
    contactHTML = `<section id="contact"><p class="kicker">Contact</p><h2 class="sec" data-words>Open a <em>channel</em></h2><div style="height:26px"></div>${contactHTML}</section>`;
  } else if (cfg.contact === 'bigcta') {
    contactHTML = `<div class="big-cta"><a href="mailto:${e(cfg.email)}">${e(cfg.email)}</a><p>${e(cfg.city)} · replies within a day</p></div>`;
    contactHTML = `<section id="contact"><p class="kicker">Contact</p><h2 class="sec" data-words>Let's make <em>something</em></h2><div style="height:22px"></div>${contactHTML}</section>`;
  } else {
    contactHTML = `<form class="form-card" id="cform" novalidate>
      <label>Name<input name="n" required placeholder="Your name"></label>
      <label>Email<input name="e" type="email" required placeholder="you@example.com"></label>
      <label>Message<textarea name="m" rows="4" required placeholder="What are you building?"></textarea></label>
      <button class="btn" type="submit">Send</button><p id="form-ok" hidden>Thanks! Demo form — wire it to your inbox or a form service.</p></form>`;
    contactHTML = `<section id="contact"><p class="kicker">Contact</p><h2 class="sec" data-words>Start a <em>conversation</em></h2><div style="height:22px"></div>${contactHTML}</section>`;
  }

  const cursorEl = cfg.cursor === 'none' ? '' : cfg.cursor === 'dot' ? '<div class="cursor-dot" aria-hidden="true"></div>' : '<div class="cursor-ring" aria-hidden="true"><span></span></div>';
  const progressEl = cfg.progress === 0 ? '<div class="progress-bar" aria-hidden="true"></div>' : '<div class="ruler" aria-hidden="true"><span>0%</span><i></i></div>';
  const footer = `<footer><span>© <span id="yr"></span> ${e(cfg.persona)}</span><span>${e(cfg.role)} · ${e(cfg.city)}</span><span>Genre Lab · GSAP edition</span></footer>`;

  const core = cfg.worksFirst
    ? `${works}${marquee}${about}${services}${contactHTML}`
    : `${about}${marquee}${works}${services}${contactHTML}`;

  return `${progressEl}${cursorEl}${navHTML(cfg)}${heroHTML(cfg)}${core}${quote(cfg.gi + cfg.v)}${statsBand(cfg.gi, cfg.v)}${footer}
<script src="./vendor/gsap.min.js"></script>
<script src="./vendor/ScrollTrigger.min.js"></script>
<script src="./app.js"></script>
</body>
</html>
`;
}

module.exports = { esc, palette, SCHEMES, css, bodyHTML };
