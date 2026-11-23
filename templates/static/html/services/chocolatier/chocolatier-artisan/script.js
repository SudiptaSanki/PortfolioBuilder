/* ============================================================
   BELTRÁN — bean-to-bar chocolate.
   Sound ruling: FAILS the need-test. Chocolate is not a sound
   trade and no interaction here teaches through audio, so the
   site has no audio anywhere — no <audio>, no Web Audio.
   ============================================================ */
document.documentElement.classList.add('js');

/* Cross-document view transitions abort noisily in Chromium when
   interrupted; the navigation itself always completes. Swallow
   only that specific rejection. */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* ---------- mobile menu: the ticket stub ---------- */
(function () {
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('mpanel');
  if (!btn || !panel) return;
  function open() {
    panel.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var first = panel.querySelector('a');
        if (first) first.focus();
      });
    });
  }
  function close(returnFocus) {
    panel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (returnFocus) btn.focus();
  }
  btn.addEventListener('click', function () {
    if (panel.classList.contains('open')) close(false); else open();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) close(true);
  });
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) close(false);
  });
})();

/* ---------- reveals (opacity only, reduced-motion safe) ---------- */
(function () {
  var els = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window) || !els.length) {
    els.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ---------- money ---------- */
function fmt(n) {
  return '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ============================================================
   BAR & BATCH EXPLORER
   One data model. The sheet's price must equal the printed
   rate-card row (data-rate="cls:band"); the sheet's tempering
   line must equal the printed tempering table's working range.
   ============================================================ */
var EXPL = {
  origin: {
    name: 'Single-origin bar',
    sub: '70 g bar · one lot, one farm region',
    bands: {
      lo: { label: '60–65%', price: 7.50,
        meaning: 'At 60–65% the cacao still leads, but sugar and a little added cocoa butter soften the edges — the gentlest way into a single origin. The percentage counts everything that came from the bean: the mass, its butter, and the sugar that makes up the rest is counted separately on the wrapper.',
        steps: 'Roast kept light to hold the fruit notes. Ground 72 hours in the stone melangeur, then a short conche so the origin\u2019s natural acidity survives.',
        ttype: 'Dark', temper: 'Work at 31–32 °C',
        life: '12 months, cool, dry and odour-free at 14–18 °C. Bloom is cosmetic; flavour fades long before safety does.' },
      mid: { label: '70–75%', price: 8.50,
        meaning: 'The house standard. At 70–75% the origin does the talking — and the percentage is not what decides the flavour. Fermentation at the farm and the roast in this room decide whether it tastes of berries, nuts or tobacco.',
        steps: 'Full roast profile for the lot. Ground 72 hours; the conche is judged by taste every six hours, never by the clock alone.',
        ttype: 'Dark', temper: 'Work at 31–32 °C',
        life: '12 months, cool, dry and odour-free at 14–18 °C. Keep the opened bar wrapped and away from the spice shelf.' },
      hi: { label: '85%', price: 9.50,
        meaning: 'At 85% there is nowhere for a poor lot to hide. Bitterness at this strength is a roasting fault, not a percentage — a clean 85% tastes intense, not harsh.',
        steps: 'Only the driest, best-fermented lots qualify. A longer, slower roast; no added cocoa butter — the bean\u2019s own fat has to carry it.',
        ttype: 'Dark', temper: 'Work at 31–32 °C',
        life: '9 months. High-cacao bars stale faster once opened; wrap tightly, 14–18 °C.' }
    }
  },
  blend: {
    name: 'Blend bar',
    sub: '70 g bar · two or three origins, one recipe',
    bands: {
      lo: { label: '62%', price: 6.50,
        meaning: 'A blend is built backwards from a flavour: each origin covers another\u2019s gaps. At 62% this is the crossing-over bar for milk-chocolate drinkers — cacao first, sweetness close behind.',
        steps: 'Origins ground separately, blended at the conche. The ratio is written on the batch card and never changed mid-season.',
        ttype: 'Dark', temper: 'Work at 31–32 °C',
        life: '12 months, cool, dry and odour-free at 14–18 °C.' },
      mid: { label: '68%', price: 7.00,
        meaning: 'House Blend № 3 at 68%: Ecuador for body, Madagascar for the red-fruit lift. The percentage is the least interesting number on this wrapper — the ratio is the recipe.',
        steps: 'The two lots want different roast curves, so they are roasted apart and blended after grinding. 60-hour conche.',
        ttype: 'Dark', temper: 'Work at 31–32 °C',
        life: '12 months, cool, dry and odour-free at 14–18 °C.' },
      hi: { label: '75%', price: 7.50,
        meaning: 'A darker blend built for bass notes — nuts, malt, dried fruit — rather than top notes. The one the kitchen recommends for cooking, because it survives heat and company.',
        steps: 'Higher roast on the base lot; a touch of added cocoa butter so the bar still snaps cleanly at this percentage.',
        ttype: 'Dark', temper: 'Work at 31–32 °C',
        life: '12 months, cool, dry and odour-free at 14–18 °C.' }
    }
  },
  filled: {
    name: 'Filled selection',
    sub: 'Box of 12 · shells cast thin, filled the same week',
    bands: {
      dark: { label: 'Dark shells · 70%', price: 24.00,
        meaning: 'The shell is a container, not the flavour: 70% dark, cast thin so it cracks and gets out of the ganache\u2019s way. The percentage describes the shell only — every filling is its own recipe, printed inside the lid.',
        steps: 'Shells cast and rested 24 hours before filling. Ganache made the same morning it is piped, capped the same day, packed within the week.',
        ttype: 'Dark', temper: 'Work at 31–32 °C',
        life: '3 weeks from the date stamped on the box — the fresh-cream ganache sets the limit. Cool and dry; bring to room temperature for an hour before eating.' },
      milk: { label: 'Milk shells · 45%', price: 22.00,
        meaning: 'Milk shells at 45% — high for a milk chocolate, chosen so the shell still tastes of cacao under sweet fillings like salted caramel and hazelnut praline.',
        steps: 'Milk chocolate runs on its own tempering curve: work it at dark-chocolate temperatures and the shells streak and bloom. Filled with salted caramel and hazelnut praline.',
        ttype: 'Milk', temper: 'Work at 29–30 °C',
        life: '4 weeks stamped on the box — caramel fillings keep a little longer than cream ganache. Cool, dry, away from strong smells.' },
      mixed: { label: 'Mixed box · dark + milk', price: 23.00,
        meaning: 'Six dark-shell and six milk-shell pieces in one box: the tasting flight of the filled range, and the honest way to find out which you actually prefer.',
        steps: 'Both tempering curves run on the same bench day. Boxes are packed to order so both shell types share one packing date.',
        ttype: 'Dark + milk', temper: 'Dark shells work at 31–32 °C · milk shells work at 29–30 °C',
        life: '3 weeks — the shortest-lived filling in the box sets the date for all twelve pieces.' }
    }
  },
  piece: {
    name: 'Showpiece',
    sub: 'Structural cocoa sculpture · built to commission',
    bands: {
      table: { label: 'Table piece · to 40 cm', price: 450,
        meaning: 'A showpiece is chocolate engineering wearing a costume: load paths, wall thickness and temperature discipline. Percentage matters less than temper — an out-of-temper piece blooms, then sags.',
        steps: 'Sketched and modelled first. Components cast over two days and assembled with melted chocolate as the mortar. Coloured with cocoa butter — no fondant, no wire inside the chocolate.',
        ttype: 'Dark', temper: 'Work at 31–32 °C',
        life: 'Display life 4–6 weeks in a cool room out of sunlight. It is food: after the event it is eaten, not kept.' },
      centre: { label: 'Centrepiece · 40–80 cm', price: 950,
        meaning: 'Centrepieces travel in sections and meet at the venue — the design is as much about the journey as the silhouette. Every joint is planned before the first mould is poured.',
        steps: 'Sections cast and rested a full day. Buttressing is chocolate only. Site assembly with a repair kit and spare panels, always — the spares have been needed twice in six years.',
        ttype: 'Dark', temper: 'Work at 31–32 °C',
        life: 'Display life 4–6 weeks, cool and shaded. Assembled on site on the day of the event.' },
      arch: { label: 'Architectural · 80 cm +', price: 1900,
        meaning: 'Above 80 cm a piece stops being confectionery that stands up and becomes a structure that happens to be edible. It gets a site visit, a base specification and a full-height dummy build first.',
        steps: 'The dummy build happens in the workshop at full height; the real piece follows its measurements exactly. Two people, one full day, on site.',
        ttype: 'Dark', temper: 'Work at 31–32 °C',
        life: 'Display life up to 6 weeks in a cool venue. Not offered for rooms above 20 °C — that limit is printed in the quote, not discovered on the day.' }
    }
  }
};

(function () {
  var sheet = document.getElementById('xSheet');
  if (!sheet) return;
  var clsBtns = Array.prototype.slice.call(document.querySelectorAll('[data-cls]'));
  var bandRow = document.getElementById('bandRow');
  var cur = { cls: 'origin', band: 'mid' };

  function renderBands() {
    bandRow.innerHTML = '';
    Object.keys(EXPL[cur.cls].bands).forEach(function (key) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.setAttribute('data-band', key);
      b.setAttribute('aria-pressed', key === cur.band ? 'true' : 'false');
      b.textContent = EXPL[cur.cls].bands[key].label;
      b.addEventListener('click', function () { cur.band = key; render(); });
      bandRow.appendChild(b);
    });
  }
  function render() {
    var c = EXPL[cur.cls], d = c.bands[cur.band];
    clsBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-cls') === cur.cls ? 'true' : 'false');
    });
    Array.prototype.forEach.call(bandRow.children, function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-band') === cur.band ? 'true' : 'false');
    });
    document.getElementById('xTitle').textContent = c.name + ' — ' + d.label;
    document.getElementById('xSub').textContent = c.sub;
    document.getElementById('xPrice').textContent =
      cur.cls === 'piece'
        ? 'From £' + d.price.toLocaleString('en-GB')
        : 'Retail ' + fmt(d.price) + (cur.cls === 'filled' ? ' · box of 12' : ' · 70 g bar');
    document.getElementById('xMeaning').textContent = d.meaning;
    document.getElementById('xSteps').textContent = d.steps;
    document.getElementById('xTemper').textContent = d.ttype + ' chocolate. ' + d.temper + ' — the full curves are printed in the tempering table below.';
    document.getElementById('xLife').textContent = d.life;
    document.querySelectorAll('[data-rate]').forEach(function (row) {
      row.classList.toggle('hl', row.getAttribute('data-rate') === cur.cls + ':' + cur.band);
    });
  }
  clsBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      cur.cls = b.getAttribute('data-cls');
      cur.band = Object.keys(EXPL[cur.cls].bands)[cur.cls === 'filled' ? 0 : 1];
      renderBands();
      render();
    });
  });
  renderBands();
  render();
})();

/* ============================================================
   WHOLESALE / BATCH CALCULATOR
   Printed tiers: 60–119 bars −10% · 120–299 bars −15% ·
   300+ bars −20%. The arithmetic is printed line by line.
   ============================================================ */
var CALC = {
  origin72: { label: 'Single-Origin 72% · Kilombero Valley', unit: 8.50 },
  blend68: { label: 'House Blend № 3 · 68%', unit: 7.00 },
  origin85: { label: 'Single-Origin 85% · Manabí', unit: 9.50 }
};
(function () {
  var work = document.getElementById('calcWork');
  if (!work) return;
  var total = document.getElementById('calcTotal');
  var note = document.getElementById('calcNote');
  var qtyIn = document.getElementById('calcQty');
  var prodBtns = Array.prototype.slice.call(document.querySelectorAll('[data-calc]'));
  var prod = 'origin72';

  function tier(q) {
    if (q >= 300) return { pct: 20, label: '300+ bars' };
    if (q >= 120) return { pct: 15, label: '120–299 bars' };
    if (q >= 60) return { pct: 10, label: '60–119 bars' };
    return null;
  }
  function compute() {
    var p = CALC[prod];
    var q = parseInt(qtyIn.value, 10);
    prodBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-calc') === prod ? 'true' : 'false');
    });
    if (isNaN(q) || q < 60) {
      work.textContent = 'Wholesale starts at 60 bars.\nBelow that, the retail price on the rate card applies —\nno discount is invented to make a small order look big.';
      total.textContent = '';
      note.textContent = 'Minimum wholesale order: 60 bars of one bar type.';
      return;
    }
    var t = tier(q);
    var sub = q * p.unit;
    var disc = sub * t.pct / 100;
    var tot = sub - disc;
    work.textContent =
      q + ' bars × ' + fmt(p.unit) + ' (' + p.label + ') = ' + fmt(sub) + '\n' +
      'Wholesale discount ' + t.pct + '% (' + t.label + ') = −' + fmt(disc);
    total.textContent = 'Total ' + fmt(tot) + ' · ' + fmt(tot / q) + ' a bar';
    note.textContent = 'Standing orders are invoiced on 14-day terms. The discount follows the quantity of a single delivery, not a year\u2019s promises.';
  }
  prodBtns.forEach(function (b) {
    b.addEventListener('click', function () { prod = b.getAttribute('data-calc'); compute(); });
  });
  qtyIn.addEventListener('input', compute);
  qtyIn.addEventListener('change', compute);
  compute();
})();

/* ============================================================
   CONTACT FORM — a demonstration. Nothing is transmitted;
   the page says so, and the confirmation says so again.
   ============================================================ */
(function () {
  var form = document.getElementById('enquiry');
  if (!form) return;
  var confirm = document.getElementById('confirm');
  var params = new URLSearchParams(window.location.search);
  var typeSel = document.getElementById('fType');
  var wanted = params.get('type');
  if (wanted && typeSel) {
    Array.prototype.forEach.call(typeSel.options, function (o) {
      if (o.value === wanted) typeSel.value = wanted;
    });
  }
  function setErr(id, bad) {
    var f = document.getElementById(id);
    var wrap = f.closest('.field');
    wrap.classList.toggle('err', bad);
    f.setAttribute('aria-invalid', bad ? 'true' : 'false');
    return !bad;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('fName');
    var email = document.getElementById('fEmail');
    var msg = document.getElementById('fMsg');
    var okName = setErr('fName', name.value.trim().length < 2);
    var okEmail = setErr('fEmail', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()));
    var okMsg = setErr('fMsg', msg.value.trim().length < 10);
    if (!(okName && okEmail && okMsg)) {
      var firstBad = form.querySelector('.field.err input, .field.err textarea, .field.err select');
      if (firstBad) firstBad.focus();
      return;
    }
    var ref = 'AB-2026-' + (100 + Math.floor(Math.random() * 900));
    document.getElementById('confirmRef').textContent = ref;
    document.getElementById('confirmType').textContent = typeSel.options[typeSel.selectedIndex].text;
    form.hidden = true;
    confirm.hidden = false;
    confirm.setAttribute('tabindex', '-1');
    confirm.focus();
  });
  document.getElementById('againBtn').addEventListener('click', function () {
    form.reset();
    form.hidden = false;
    confirm.hidden = true;
    document.getElementById('fName').focus();
  });
})();
