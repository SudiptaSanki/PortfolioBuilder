/* Iridium Point — grind catalogue, booking form, reveal.
   The catalogue specimens are DRAWN to scale (30 px = 1 mm) from the measured
   figures in the table below. They are specimens of line width, not handwriting. */
(function () {
  'use strict';

  /* ---------- Grind catalogue ---------- */
  var GRINDS = {
    round: {
      name: 'Round — tuned',
      down: 0.50, cross: 0.50, variation: '1 : 1 — none, by design',
      from: 'Any nib, fine to broad',
      price: 45, bookValue: 'tune', bookLabel: 'Book the tune — £45',
      char: 'The nib you already own, finished properly: tines levelled, the point ' +
            'polished on lapping film, flow set to your paper. No shape change, no ' +
            'material lost — the honest first resort for a scratchy or reluctant pen.',
      best: 'Best for: a pen you like that scratches, skips or floods.'
    },
    needlepoint: {
      name: 'Needlepoint',
      down: 0.25, cross: 0.25, variation: '1 : 1 — round and fine',
      from: 'A medium or broad nib',
      price: 75, bookValue: 'needlepoint', bookLabel: 'Book this grind — £75',
      char: 'A round point ground to the finest practical line and then shaped, never ' +
            'sharpened — a needlepoint that feels like a needle is a fault. It writes ' +
            'in ruled columns and small notebooks where an ordinary fine crowds.',
      best: 'Best for: ledger work, diaries, small handwriting.'
    },
    stub: {
      name: 'Stub 1.1',
      down: 1.10, cross: 0.35, variation: '≈ 3 : 1',
      from: 'A broad nib (B or BB)',
      price: 70, bookValue: 'stub', bookLabel: 'Book this grind — £70',
      char: 'A flat point with its corners rounded away. The downstroke carries weight, ' +
            'the cross-stroke stays narrow, and the rounded corners forgive any writing ' +
            'angle — the easiest grind to live with every day.',
      best: 'Best for: first line variation; signatures; unhurried journals.'
    },
    cursive: {
      name: 'Cursive italic 0.9',
      down: 0.90, cross: 0.20, variation: '4.5 : 1',
      from: 'A broad nib (B)',
      price: 80, bookValue: 'cursive', bookLabel: 'Book this grind — £80',
      char: 'Flatter and crisper than a stub, its corners lightly softened so it survives ' +
            'an ordinary grip and a few degrees of pen rotation. The variation reads as ' +
            'handwriting, not lettering — the grind of Bench № 251.',
      best: 'Best for: daily writing with character; most hands, most of the time.'
    },
    crisp: {
      name: 'Crisp italic 0.7',
      down: 0.70, cross: 0.15, variation: '≈ 4.7 : 1',
      from: 'A broad or medium-broad nib',
      price: 85, bookValue: 'crisp', bookLabel: 'Book this grind — £85',
      char: 'The sharpest work on the list: a near-knife edge across the stroke. Maximum ' +
            'variation — and corners that will dig and catch if the pen rotates or the ' +
            'hand hurries. Chosen deliberately, it is glorious; chosen casually, it is ' +
            'a complaint in the post.',
      best: 'Best for: a consistent grip, unhurried writing, formal hands.'
    },
    architect: {
      name: 'Architect 1.0',
      down: 0.25, cross: 1.00, variation: '1 : 4 — the italic, reversed',
      from: 'A broad nib (B or BB)',
      price: 85, bookValue: 'architect', bookLabel: 'Book this grind — £85',
      char: 'Thin downstrokes, thick cross-strokes — the italic turned ninety degrees. ' +
            'Ground for architectural lettering, ruled headings and scripts written ' +
            'with horizontal emphasis. Unusual in the hand for a week, then hard to ' +
            'give up.',
      best: 'Best for: headings, lettering, drawing with the written line.'
    },
    oblique: {
      name: 'Left oblique cursive italic',
      down: 0.80, cross: 0.20, variation: '4 : 1, cut at 15°',
      from: 'A broad or medium nib',
      price: 80, bookValue: 'oblique', bookLabel: 'Book this grind — £80', angle: -15,
      char: 'A cursive italic cut on a 15° slant, so the flat of the point meets the ' +
            'paper squarely in a rotated grip. Ground for left-handed underwriters and ' +
            'anyone who hooks their wrist — the specimen is drawn rotated, as it writes.',
      best: 'Best for: left-handed writers; rotated grips of either hand.'
    }
  };

  var svg = document.getElementById('specimenSvg');
  if (svg) {
    var NS = 'http://www.w3.org/2000/svg';
    function el(tag, attrs) {
      var n = document.createElementNS(NS, tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      return n;
    }
    function fmt(n) { return n.toFixed(2); }

    function drawSpecimen(key) {
      var g = GRINDS[key], SCALE = 30; /* px per mm */
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      /* ruled lines of the specimen card */
      for (var y = 25; y <= 145; y += 15) {
        svg.appendChild(el('line', { x1: 24, y1: y, x2: 296, y2: y, stroke: '#e7dfca', 'stroke-width': 1 }));
      }
      var strokes = el('g', {});
      if (g.angle) strokes.setAttribute('transform', 'rotate(' + g.angle + ' 160 85)');
      /* downstroke: width = down mm */
      strokes.appendChild(el('rect', {
        x: 160 - (g.down * SCALE) / 2, y: 25,
        width: g.down * SCALE, height: 120, fill: '#2e4057'
      }));
      /* cross-stroke: height = cross mm */
      strokes.appendChild(el('rect', {
        x: 40, y: 85 - (g.cross * SCALE) / 2,
        width: 240, height: g.cross * SCALE, fill: '#2e4057'
      }));
      svg.appendChild(strokes);

      /* dimension labels */
      var t1 = el('text', { x: 168, y: 18, 'font-family': 'IBM Plex Mono, monospace', 'font-size': 9, fill: '#655e4f' });
      t1.textContent = 'DOWN ' + fmt(g.down) + ' MM';
      svg.appendChild(t1);
      var t2 = el('text', { x: 196, y: 85 - (g.cross * SCALE) / 2 - 8, 'font-family': 'IBM Plex Mono, monospace', 'font-size': 9, fill: '#655e4f' });
      t2.textContent = 'ACROSS ' + fmt(g.cross);
      svg.appendChild(t2);

      /* scale bar: 150 px = 5 mm */
      svg.appendChild(el('line', { x1: 40, y1: 168, x2: 190, y2: 168, stroke: '#b9ae94', 'stroke-width': 1.5 }));
      svg.appendChild(el('line', { x1: 40, y1: 163, x2: 40, y2: 173, stroke: '#b9ae94', 'stroke-width': 1.5 }));
      svg.appendChild(el('line', { x1: 190, y1: 163, x2: 190, y2: 173, stroke: '#b9ae94', 'stroke-width': 1.5 }));
      var t3 = el('text', { x: 198, y: 172, 'font-family': 'IBM Plex Mono, monospace', 'font-size': 9, fill: '#655e4f' });
      t3.textContent = '5 MM';
      svg.appendChild(t3);

      document.getElementById('grindName').textContent = g.name;
      document.getElementById('grindChar').textContent = g.char;
      document.getElementById('figDown').textContent = fmt(g.down) + ' mm';
      document.getElementById('figCross').textContent = fmt(g.cross) + ' mm';
      document.getElementById('figVar').textContent = g.variation;
      document.getElementById('figFrom').textContent = g.from;
      document.getElementById('grindBest').textContent = g.best;
      var book = document.getElementById('grindBook');
      book.textContent = g.bookLabel;
      book.setAttribute('href', 'contact.html?grind=' + g.bookValue);
      document.getElementById('specimenCap').textContent =
        'Drawn to scale at 30 px = 1 mm, from the figures beside it. A specimen of line ' +
        'width and variation, drawn by this page — not a photograph of handwriting.';
    }

    var buttons = document.querySelectorAll('.grind-picker button');
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        buttons.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        drawSpecimen(b.getAttribute('data-grind'));
      });
    });
    drawSpecimen('cursive');
  }

  /* ---------- Booking form ---------- */
  var form = document.getElementById('bookForm');
  if (form) {
    var service = document.getElementById('f-service');

    /* Carry a catalogue choice into the form: contact.html?grind=stub */
    try {
      var q = new URLSearchParams(window.location.search).get('grind');
      if (q) {
        for (var i = 0; i < service.options.length; i++) {
          if (service.options[i].value === q) { service.selectedIndex = i; break; }
        }
      }
    } catch (e) { /* older browser: the select simply stays unchosen */ }

    function flag(input, errId, bad) {
      var err = document.getElementById(errId);
      if (bad) {
        input.setAttribute('aria-invalid', 'true');
        if (err) err.classList.add('show');
      } else {
        input.removeAttribute('aria-invalid');
        if (err) err.classList.remove('show');
      }
      return !bad;
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var name = document.getElementById('f-name');
      var email = document.getElementById('f-email');
      var pen = document.getElementById('f-pen');
      var ok = true;
      ok = flag(name, 'e-name', name.value.trim() === '') && ok;
      ok = flag(email, 'e-email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) && ok;
      ok = flag(pen, 'e-pen', pen.value.trim() === '') && ok;
      ok = flag(service, 'e-service', service.value === '') && ok;
      if (!ok) {
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }
      var ref = 'IP-2026-' + String(Math.floor(100 + Math.random() * 900));
      document.getElementById('cName').textContent = name.value.trim();
      document.getElementById('cRef').textContent = ref;
      document.getElementById('cService').textContent =
        service.options[service.selectedIndex].text;
      form.style.display = 'none';
      var conf = document.getElementById('confirmation');
      conf.classList.add('show');
      conf.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    document.getElementById('sendAnother').addEventListener('click', function () {
      form.reset();
      form.style.display = '';
      document.getElementById('confirmation').classList.remove('show');
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.08 });
    revealEls.forEach(function (n) { io.observe(n); });
  } else {
    revealEls.forEach(function (n) { n.classList.add('in'); });
  }
})();

/* ---------- Mobile nav: the breather-hole cap button ----------
   The panel drops from the header like a cap lifting off the nib.
   Esc closes, focus goes in on open and back to the button on close,
   a link tap closes (and navigates), and the page locks behind it. */
(function () {
  'use strict';
  var toggle = document.querySelector('.nav-toggle');
  var panel = document.getElementById('mobile-panel');
  if (!toggle || !panel) return;

  function close(restoreFocus) {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Menu');
    panel.hidden = true;
    document.body.classList.remove('nav-locked');
    if (restoreFocus) toggle.focus();
  }
  function open() {
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    panel.hidden = false;
    document.body.classList.add('nav-locked');
    var first = panel.querySelector('a');
    if (first) first.focus();
  }

  toggle.addEventListener('click', function () {
    if (panel.hidden) open(); else close(true);
  });
  panel.addEventListener('click', function (ev) {
    if (ev.target.closest('a')) close(false); /* the tap navigates */
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !panel.hidden) close(true);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 860 && !panel.hidden) close(false);
  });
})();
