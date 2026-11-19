/**
 * generate-preview-hub.js
 * Builds preview-hub.html at the repo root: a categorized, searchable index
 * of every template for LOCAL browsing via the preview server (run.bat).
 *
 * Local links point at http://127.0.0.1:<port>/<github-pages-path>/index.html
 * Templates hosted elsewhere (Netlify/Vercel) link to their live URL instead.
 *
 * Run: node scripts/generate-preview-hub.js
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const catalogPath = path.join(repoRoot, 'showcase', 'src', 'data', 'templates.json');
const outPath = path.join(repoRoot, 'preview-hub.html');
const PORT = process.env.PB_PORT || 8741;

const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const WORLD_GROUPS = [
  ['christmas', 'Christmas & Winter'],
  ['halloween', 'Halloween & Autumn'],
  ['dia', 'Día de Muertos & Latin Fiestas'],
  ['carnival', 'Carnival & Mardi Gras'],
  ['eid', 'Eid & Ramadan Nights'],
  ['hanukkah', 'Hanukkah & Jewish Traditions'],
  ['lunar', 'Lunar New Year & East Asia'],
  ['japan', 'Hanami & Matsuri Japan'],
  ['oktoberfest', 'Oktoberfest & Alpine Autumn'],
  ['harvest', 'World Harvest & Celebrations']
];

const INDIA_FAMILIES = [
  ['dance', 'Dance & Theatre'],
  ['music', 'Music & Rhythm'],
  ['craft', 'Handicrafts & Textiles'],
  ['art', 'Folk & Painting'],
  ['food', 'Festival Food'],
  ['spiritual', 'Spiritual & Ritual'],
  ['events', 'Events & Decoration'],
  ['media', 'Media & Stories'],
  ['fashion', 'Festive Fashion'],
  ['wellness', 'Wellness & Ayurveda']
];

const CATEGORIES = [
  ['technical', 'Technical & Software'],
  ['engineering', 'Engineering'],
  ['research', 'Science & Research'],
  ['educator', 'Educators & Training'],
  ['medical', 'Medical & Healthcare'],
  ['wellness-sports', 'Wellness & Sports'],
  ['agriculture', 'Agriculture & Farming'],
  ['transport-aviation', 'Aviation, Rail & Maritime'],
  ['construction-trades', 'Construction & Trades'],
  ['creative', 'Creative & Design'],
  ['business', 'Business & Finance'],
  ['law-public', 'Law & Public Service'],
  ['music', 'Music & Audio'],
  ['retail', 'Retail & Shops'],
  ['services', 'Services & Hospitality'],
  ['startup', 'Startups & Students'],
  ['gaming', 'Gaming & Esports']
];

function cardHTML(t) {
  const local = t.deployment && t.deployment.provider === 'github-pages' && t.deployment.path;
  const url = local
    ? `http://127.0.0.1:${PORT}/${t.deployment.path}/index.html`
    : (t.deployment && t.deployment.liveUrl) || '#';
  const external = local ? '' : ' <span class="ext">external</span>';

  const chips = [];
  for (const tag of t.tags || []) {
    if (/^(garland-|float-|scroll-|reveal-)/.test(tag)) chips.push(tag);
  }

  const search = esc([t.name, t.role, t.theme, t.category, t.subCategory || '', (t.aliases || []).join(' '), (t.tags || []).join(' ')].join(' ').toLowerCase());

  return `      <a class="card" data-search="${search}" href="${esc(url)}" target="_blank" rel="noopener">
        <span class="dot ${esc(t.category)}"></span>
        <span class="c-name">${esc(t.name)}</span>
        <span class="c-role">${esc(t.role)}${external}</span>
        <span class="c-theme">${esc(t.theme || '')}</span>
        ${chips.length ? `<span class="c-chips">${chips.map(c => `<i>${esc(c)}</i>`).join('')}</span>` : ''}
      </a>`;
}

function sectionHTML(id, title, subtitle, templates) {
  if (!templates.length) return '';
  const cards = templates.map(cardHTML).join('\n');
  return `
  <section class="group" id="${id}">
    <h2>${esc(title)} <span class="count">${templates.length}</span></h2>
    ${subtitle ? `<p class="sub">${esc(subtitle)}</p>` : ''}
    <div class="grid">
${cards}
    </div>
  </section>`;
}

function main() {
  let templates;
  try {
    templates = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  } catch (e) {
    console.error('Cannot read catalog. Run: npm run catalog:generate');
    process.exit(1);
  }

  const festival = templates.filter(t => (t.tags || []).includes('festival'));
  const rest = templates.filter(t => !(t.tags || []).includes('festival'));

  // Festival — India: grouped by craft family
  const indiaBuckets = INDIA_FAMILIES.map(([key, label]) => [label, festival.filter(t => t.category === 'festival' && (t.tags || []).includes(key) && !WORLD_GROUPS.some(([wk]) => (t.tags || []).includes(wk)))]);
  const indiaAssigned = new Set(indiaBuckets.flatMap(([, list]) => list.map(t => t.id)));
  const indiaOther = festival.filter(t => !indiaAssigned.has(t.id) && !WORLD_GROUPS.some(([wk]) => (t.tags || []).includes(wk)));
  if (indiaOther.length) indiaBuckets.push(['More from India', indiaOther]);

  // Festival — World: grouped by festival group
  const worldBuckets = WORLD_GROUPS.map(([key, label]) => [label, festival.filter(t => (t.tags || []).includes(key))]);

  // Other categories
  const catBuckets = CATEGORIES.map(([key, label]) => [label, rest.filter(t => t.category === key)]);
  const catAssigned = new Set(catBuckets.flatMap(([, list]) => list.map(t => t.id)));
  const catOther = rest.filter(t => !catAssigned.has(t.id));
  if (catOther.length) catBuckets.push(['Other Templates', catOther]);

  let sections = '';
  sections += sectionHTML('india', '🪔 Festival Batch — India', 'Indian puja & festival aesthetics: torans, diyas, rangoli, kash grass. Mode chips show each template\'s garland / float / scroll / reveal style.', indiaBuckets.flatMap(([, l]) => l));
  sections += sectionHTML('world', '🌍 Festival Batch — World', 'Festive modes from around the world, each with its own garland, floating elements and footer.', worldBuckets.flatMap(([, l]) => l));
  for (const [label, list] of catBuckets) {
    const id = 'cat-' + label.toLowerCase().replace(/[^a-z]+/g, '-');
    sections += sectionHTML(id, label, '', list);
  }

  const totalLocal = templates.filter(t => t.deployment && t.deployment.provider === 'github-pages').length;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Portfolio Builder — Local Preview Hub</title>
<style>
  :root{--bg:#0d0a14;--bg2:#1a1330;--surface:rgba(255,255,255,.05);--gold:#fbbf24;--text:#f4f1ff;--muted:#b6aed6;--border:rgba(251,191,36,.25)}
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:radial-gradient(1200px 800px at 50% -10%,var(--bg2),var(--bg) 60%);color:var(--text);font-family:system-ui,sans-serif;min-height:100vh;line-height:1.5}
  header{padding:36px 28px 10px;max-width:1400px;margin:0 auto}
  h1{font-family:Georgia,serif;font-size:1.9rem;color:var(--gold);letter-spacing:.5px}
  .meta{color:var(--muted);font-size:.92rem;margin-top:6px}
  .meta b{color:var(--text)}
  .searchrow{max-width:1400px;margin:18px auto 0;padding:0 28px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
  #q{flex:1;min-width:260px;background:var(--surface);border:1px solid var(--border);border-radius:999px;padding:11px 18px;color:var(--text);font-size:.95rem;outline:none}
  #q:focus{border-color:var(--gold)}
  .nav{display:flex;gap:8px;flex-wrap:wrap}
  .nav a{color:var(--muted);font-size:.8rem;text-decoration:none;border:1px solid var(--border);border-radius:999px;padding:5px 12px;transition:.2s}
  .nav a:hover{color:var(--gold);border-color:var(--gold)}
  main{max-width:1400px;margin:0 auto;padding:10px 28px 80px}
  .group{margin-top:44px}
  .group h2{font-family:Georgia,serif;font-size:1.4rem;color:var(--text);display:flex;align-items:center;gap:12px}
  .count{background:rgba(251,191,36,.14);color:var(--gold);border:1px solid var(--border);border-radius:999px;font-size:.8rem;padding:2px 12px;font-family:system-ui}
  .sub{color:var(--muted);font-size:.88rem;margin-top:6px;max-width:900px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-top:18px}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px 18px;text-decoration:none;color:var(--text);display:flex;flex-direction:column;gap:6px;transition:.2s;position:relative}
  .card:hover{border-color:var(--gold);transform:translateY(-3px)}
  .dot{position:absolute;top:14px;right:16px;width:10px;height:10px;border-radius:50%;background:var(--gold)}
  .c-name{font-weight:600;font-size:.98rem;padding-right:24px}
  .c-role{color:var(--muted);font-size:.83rem}
  .c-theme{color:var(--muted);font-size:.78rem;font-style:italic;opacity:.85}
  .c-chips{display:flex;gap:5px;flex-wrap:wrap;margin-top:2px}
  .c-chips i{font-style:normal;font-size:.68rem;color:var(--gold);border:1px solid var(--border);border-radius:999px;padding:2px 8px;background:rgba(251,191,36,.07)}
  .ext{color:#7dd3fc;border:1px solid rgba(125,211,252,.4);border-radius:999px;font-size:.66rem;padding:1px 7px;margin-left:6px;font-style:normal}
  .hidden{display:none!important}
  footer{color:var(--muted);text-align:center;padding:30px;font-size:.8rem}
</style>
</head>
<body>
<header>
  <h1>🪔 Portfolio Builder — Local Preview Hub</h1>
  <p class="meta"><b>${templates.length}</b> templates · <b>${totalLocal}</b> served locally at <b>http://127.0.0.1:${PORT}</b> (start it with <b>run.bat</b>) · external templates open their live URL</p>
</header>
<div class="searchrow">
  <input id="q" type="text" placeholder="Search by name, role, theme, garland, float... (e.g. sakura, toran, snow, lights)">
  <nav class="nav">
    <a href="#india">🪔 India</a>
    <a href="#world">🌍 World</a>
    ${CATEGORIES.map(([k, l]) => `<a href="#cat-${l.toLowerCase().replace(/[^a-z]+/g, '-')}">${esc(l.split(' &')[0].split(',')[0])}</a>`).join('')}
  </nav>
</div>
<main>${sections}
</main>
<footer>Generated by scripts/generate-preview-hub.js · Portfolio Builder Festival Family</footer>
<script>
  var q = document.getElementById('q');
  q.addEventListener('input', function () {
    var v = q.value.trim().toLowerCase();
    document.querySelectorAll('.card').forEach(function (c) {
      c.classList.toggle('hidden', v && c.dataset.search.indexOf(v) === -1);
    });
    document.querySelectorAll('.group').forEach(function (g) {
      var any = g.querySelectorAll('.card:not(.hidden)').length > 0;
      g.classList.toggle('hidden', v && !any);
    });
  });
</script>
</body>
</html>
`;

  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`Preview hub written: ${path.relative(repoRoot, outPath)} (${templates.length} templates, ${totalLocal} local links)`);
}

main();
