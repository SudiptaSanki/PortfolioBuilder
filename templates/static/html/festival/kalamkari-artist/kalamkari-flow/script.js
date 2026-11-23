/* Kalamkari Flow — page behaviour. Silent by design: no audio, no libraries.
   The canvas draws the motif preview; everything else is DOM. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- chrome ---------- */
  var drawer = document.getElementById('drawer');
  var menuBtn = document.querySelector('.menu-btn');
  if (drawer && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        drawer.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- reveals ---------- */
  var rvs = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  if (rvs.length) {
    if (reduceMotion) {
      rvs.forEach(function (el) { el.classList.add('in'); });
    } else {
      var ticking = false;
      var reveal = function () {
        ticking = false;
        var limit = window.innerHeight * 0.94;
        rvs = rvs.filter(function (el) {
          if (el.classList.contains('in')) return false;
          if (el.getBoundingClientRect().top < limit) { el.classList.add('in'); return false; }
          return true;
        });
      };
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(reveal);
      }, { passive: true });
      reveal();
    }
  }

  /* ---------- motifs, drawn with a kalam-ish hand ---------- */
  function lotus(c, s, col) {
    c.save();
    c.scale(s / 100, s / 100);
    c.lineWidth = 2.4 / (s / 100);
    c.strokeStyle = col.primary;
    c.fillStyle = 'rgba(0,0,0,0)';
    /* five outer petals */
    for (var i = -2; i <= 2; i++) {
      c.save();
      c.rotate(i * 0.42);
      c.beginPath();
      c.moveTo(0, 6);
      c.bezierCurveTo(-20, -14, -13, -48, 0, -64);
      c.bezierCurveTo(13, -48, 20, -14, 0, 6);
      c.stroke();
      if (i === 0) { c.fillStyle = col.secondary; c.globalAlpha = .18; c.fill(); c.globalAlpha = 1; c.fillStyle = 'rgba(0,0,0,0)'; }
      c.restore();
    }
    /* inner petals */
    c.strokeStyle = col.secondary;
    for (var j = -1; j <= 1; j++) {
      c.save();
      c.rotate(j * 0.3);
      c.beginPath();
      c.moveTo(0, 2);
      c.bezierCurveTo(-10, -10, -7, -30, 0, -40);
      c.bezierCurveTo(7, -30, 10, -10, 0, 2);
      c.stroke();
      c.restore();
    }
    /* heart */
    c.beginPath();
    c.arc(0, -2, 5, 0, Math.PI * 2);
    c.fillStyle = col.accent;
    c.fill();
    /* base line and tendrils */
    c.strokeStyle = col.primary;
    c.beginPath(); c.moveTo(-30, 12); c.bezierCurveTo(-10, 22, 10, 22, 30, 12); c.stroke();
    c.beginPath(); c.moveTo(-34, 16); c.bezierCurveTo(-52, 4, -48, -12, -36, -16); c.stroke();
    c.beginPath(); c.moveTo(34, 16); c.bezierCurveTo(52, 4, 48, -12, 36, -16); c.stroke();
    c.restore();
  }

  function hamsa(c, s, col) {
    c.save();
    c.scale(s / 100, s / 100);
    var lw = 2.4 / (s / 100);
    c.lineWidth = lw;
    c.strokeStyle = col.primary;
    c.fillStyle = col.secondary;
    c.globalAlpha = .14;
    /* body */
    c.beginPath();
    c.moveTo(-46, 12);
    c.bezierCurveTo(-52, -18, -16, -30, 6, -18);
    c.bezierCurveTo(30, -6, 34, 20, 14, 28);
    c.bezierCurveTo(-8, 36, -38, 30, -46, 12);
    c.closePath();
    c.fill();
    c.globalAlpha = 1;
    c.stroke();
    /* wing */
    c.beginPath();
    c.moveTo(-30, 6);
    c.bezierCurveTo(-16, -12, 6, -12, 14, 2);
    c.bezierCurveTo(0, 10, -16, 12, -30, 6);
    c.stroke();
    c.beginPath();
    c.moveTo(-24, 10);
    c.bezierCurveTo(-12, 2, 0, 2, 8, 8);
    c.stroke();
    /* neck */
    c.strokeStyle = col.primary;
    c.lineWidth = lw * 2.6;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(6, -18);
    c.bezierCurveTo(30, -34, 8, -56, 22, -72);
    c.stroke();
    c.lineWidth = lw;
    /* head */
    c.beginPath();
    c.arc(24, -76, 10, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.moveTo(34, -78); c.lineTo(48, -73); c.lineTo(34, -69);
    c.stroke();
    c.beginPath();
    c.arc(27, -79, 1.8, 0, Math.PI * 2);
    c.fillStyle = col.primary;
    c.fill();
    /* tail */
    c.beginPath();
    c.moveTo(-44, 10);
    c.bezierCurveTo(-66, 2, -78, -18, -70, -34);
    c.stroke();
    /* water */
    c.strokeStyle = col.secondary;
    c.globalAlpha = .55;
    for (var i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(-56 + i * 6, 34 + i * 8);
      c.bezierCurveTo(-24, 26 + i * 8, 12, 42 + i * 8, 44 - i * 6, 32 + i * 8);
      c.stroke();
    }
    c.globalAlpha = 1;
    c.restore();
  }

  function peacock(c, s, col) {
    c.save();
    c.scale(s / 100, s / 100);
    var lw = 2.2 / (s / 100);
    c.lineWidth = lw;
    /* tail fan */
    for (var i = 0; i < 7; i++) {
      var a = Math.PI * (0.16 + i * 0.115);
      var tx = Math.cos(a) * 78;
      var ty = Math.sin(a) * 78 + 34;
      c.strokeStyle = col.primary;
      c.beginPath();
      c.moveTo(0, 26);
      c.quadraticCurveTo(tx * 0.6, ty * 0.5 + 20, tx, ty);
      c.stroke();
      /* feather eye */
      c.beginPath(); c.arc(tx, ty, 8, 0, Math.PI * 2); c.strokeStyle = col.primary; c.stroke();
      c.beginPath(); c.arc(tx, ty, 4.2, 0, Math.PI * 2); c.fillStyle = col.accent; c.fill();
      c.beginPath(); c.arc(tx, ty, 1.6, 0, Math.PI * 2); c.fillStyle = '#231B15'; c.fill();
      /* barbs */
      c.strokeStyle = col.secondary;
      c.globalAlpha = .55;
      for (var k = -2; k <= 2; k++) {
        c.beginPath();
        c.moveTo(tx + k * 3, ty - 12);
        c.lineTo(tx * 0.86 + k * 2, ty * 0.86 + 6);
        c.stroke();
      }
      c.globalAlpha = 1;
    }
    /* body */
    c.fillStyle = col.secondary;
    c.globalAlpha = .16;
    c.beginPath();
    c.ellipse(0, 18, 26, 40, -0.18, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
    c.strokeStyle = col.primary;
    c.stroke();
    /* wing detail */
    c.beginPath();
    c.moveTo(-14, 2);
    c.bezierCurveTo(2, -8, 16, 2, 14, 18);
    c.bezierCurveTo(2, 26, -12, 20, -14, 2);
    c.stroke();
    /* neck */
    c.lineWidth = lw * 2.4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-6, -16);
    c.bezierCurveTo(-22, -48, 6, -62, 4, -84);
    c.stroke();
    c.lineWidth = lw;
    /* head */
    c.beginPath(); c.arc(3, -88, 9, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(-6, -90); c.lineTo(-18, -85); c.lineTo(-6, -81); c.stroke();
    c.beginPath(); c.arc(5, -91, 1.7, 0, Math.PI * 2); c.fillStyle = col.primary; c.fill();
    /* crest */
    c.strokeStyle = col.accent;
    for (var m = -1; m <= 1; m++) {
      c.beginPath();
      c.moveTo(3 + m * 3, -97);
      c.quadraticCurveTo(6 + m * 5, -108, 4 + m * 7, -114);
      c.stroke();
      c.beginPath(); c.arc(4 + m * 7, -115, 2.2, 0, Math.PI * 2); c.fill();
    }
    /* legs */
    c.strokeStyle = col.primary;
    c.beginPath(); c.moveTo(-6, 56); c.lineTo(-8, 78); c.moveTo(-8, 78); c.lineTo(-16, 82); c.moveTo(-8, 78); c.lineTo(-2, 83); c.stroke();
    c.beginPath(); c.moveTo(8, 54); c.lineTo(10, 78); c.moveTo(10, 78); c.lineTo(2, 82); c.moveTo(10, 78); c.lineTo(16, 83); c.stroke();
    c.restore();
  }

  function tree(c, s, col) {
    c.save();
    c.scale(s / 100, s / 100);
    c.lineWidth = 2 / (s / 100);
    c.strokeStyle = col.primary;
    /* trunk and branches */
    c.lineWidth = (s / 100) * 5;
    c.beginPath();
    c.moveTo(-6, 62);
    c.bezierCurveTo(-2, 30, 3, 4, 0, -28);
    c.stroke();
    c.lineWidth = (s / 100) * 2.4;
    var branches = [[-1, 26, -44, 6], [1, 26, 44, 6], [-1, 4, -38, -18], [1, 4, 38, -18], [0, -12, -22, -40], [0, -12, 22, -40]];
    for (var i = 0; i < branches.length; i++) {
      var b = branches[i];
      c.beginPath();
      c.moveTo(b[0] * 3, b[1]);
      c.quadraticCurveTo(b[0] * 20 + b[2] * 0.4, b[1] - 12, b[2], b[3]);
      c.stroke();
    }
    /* leaves */
    c.fillStyle = col.secondary;
    var leaves = [[-44, 4], [-50, 14], [44, 4], [50, 14], [-38, -20], [-30, -30], [38, -20], [30, -30], [-22, -42], [22, -42], [-10, -46], [10, -46]];
    for (var j = 0; j < leaves.length; j++) {
      c.save();
      c.translate(leaves[j][0], leaves[j][1]);
      c.rotate((leaves[j][0] < 0 ? -1 : 1) * 0.7);
      c.beginPath(); c.ellipse(0, 0, 7, 3.2, 0, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    /* flowers */
    var flowers = [[0, -52], [-30, -36], [30, -36], [0, 22]];
    for (var k = 0; k < flowers.length; k++) {
      c.save();
      c.translate(flowers[k][0], flowers[k][1]);
      c.strokeStyle = col.primary;
      c.lineWidth = 1.6 / (s / 100);
      for (var p = 0; p < 6; p++) {
        c.beginPath();
        c.ellipse(0, -9, 4.2, 8, 0, 0, Math.PI * 2);
        c.stroke();
        c.rotate(Math.PI / 3);
      }
      c.beginPath(); c.arc(0, 0, 3, 0, Math.PI * 2); c.fillStyle = col.accent; c.fill();
      c.restore();
    }
    /* ground */
    c.strokeStyle = col.primary;
    c.lineWidth = 2 / (s / 100);
    c.beginPath(); c.moveTo(-58, 64); c.bezierCurveTo(-20, 58, 20, 70, 58, 62); c.stroke();
    c.restore();
  }

  var MOTIFS = { lotus: lotus, hamsa: hamsa, peacock: peacock, tree: tree };

  /* ---------- the workbench ---------- */
  var canvas = document.getElementById('cloth-canvas');
  if (canvas && canvas.getContext) {
    var g = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;

    var DATA = {
      motif: { lotus: { name: 'Lotus', factor: 0.78 }, hamsa: { name: 'Hamsa', factor: 0.92 }, peacock: { name: 'Peacock', factor: 1.28 }, tree: { name: 'Tree of life', factor: 1.55 } },
      repeat: { buta: { name: 'single buta', density: 0.85 }, border: { name: 'border', density: 1.05 }, allover: { name: 'all over', density: 1.5 } },
      cloth: { panel: { name: 'Panel', a: 1.0, b: 0.9 }, stole: { name: 'Stole', a: 2.0, b: 0.7 }, sari: { name: 'Sari', a: 5.5, b: 1.2 } },
      palette: {
        both: { name: 'madder and indigo', primary: '#9C3B2A', secondary: '#25384C', accent: '#A8813B', baths: 5 },
        madder: { name: 'madder only', primary: '#9C3B2A', secondary: '#7A2A1D', accent: '#A8813B', baths: 4 },
        indigo: { name: 'indigo and myrobalan', primary: '#25384C', secondary: '#1B2A3A', accent: '#A8813B', baths: 4 }
      }
    };

    var state = { motif: 'peacock', repeat: 'buta', cloth: 'panel', palette: 'both' };

    function clothBackground() {
      g.fillStyle = '#EFE4CE';
      g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(35,27,21,.09)';
      g.lineWidth = 1;
      for (var y = 0; y < H; y += 7) {
        g.beginPath(); g.moveTo(0, y + .5); g.lineTo(W, y + .5); g.stroke();
      }
      g.strokeStyle = 'rgba(35,27,21,.25)';
      g.lineWidth = 2;
      g.strokeRect(26, 26, W - 52, H - 52);
      g.lineWidth = 1;
      g.strokeRect(36, 36, W - 72, H - 72);
    }

    function layoutAllover() {
      /* positions for a 3 x 2 field */
      return [[230, 240], [640, 240], [1050, 240], [230, 620], [640, 620], [1050, 620]];
    }

    function render() {
      clothBackground();
      var col = DATA.palette[state.palette];
      var ink = { primary: col.primary, secondary: col.secondary, accent: col.accent };
      var fn = MOTIFS[state.motif];

      if (state.repeat === 'buta') {
        g.save();
        g.translate(W / 2, H / 2 + 8);
        fn(g, 430, ink);
        g.restore();
      } else if (state.repeat === 'border') {
        for (var x = 150; x <= W - 120; x += 185) {
          g.save();
          g.translate(x, 118);
          fn(g, 100, ink);
          g.restore();
          g.save();
          g.translate(x, H - 118);
          fn(g, 100, ink);
          g.restore();
        }
        g.strokeStyle = col.primary;
        g.lineWidth = 2;
        g.beginPath(); g.moveTo(70, 190); g.lineTo(W - 70, 190); g.stroke();
        g.beginPath(); g.moveTo(70, H - 190); g.lineTo(W - 70, H - 190); g.stroke();
      } else {
        var pos = layoutAllover();
        for (var i = 0; i < pos.length; i++) {
          g.save();
          g.translate(pos[i][0], pos[i][1]);
          fn(g, 200, ink);
          g.restore();
        }
      }

      /* the workshop mark, bottom right */
      g.save();
      g.globalAlpha = .5;
      g.fillStyle = col.primary;
      g.fillRect(W - 96, H - 70, 30, 30);
      g.globalAlpha = 1;
      g.fillStyle = '#EFE4CE';
      g.fillRect(W - 89, H - 63, 16, 16);
      g.restore();
    }

    function fmt(n) { return n.toLocaleString('en-IN'); }

    function update() {
      var m = DATA.motif[state.motif];
      var r = DATA.repeat[state.repeat];
      var cl = DATA.cloth[state.cloth];
      var pal = DATA.palette[state.palette];
      var area = cl.a * cl.b;
      var hours = Math.round(area * 26 * m.factor * r.density);
      var weeks = Math.max(1, Math.ceil(hours / 30));
      var mordant = m.factor > 1.2 ? 4 : 3;
      var price = Math.round((hours * 450 + area * 1400) / 500) * 500;

      set('stage-label', m.name + ' · ' + r.name + ' · ' + pal.name);
      set('job-cloth', cl.a.toFixed(1) + ' × ' + cl.b.toFixed(1) + ' m');
      var hoursEl = document.getElementById('job-hours');
      if (hoursEl) hoursEl.innerHTML = fmt(hours) + ' hours<small>at the kalam</small>';
      set('job-dye', String(pal.baths));
      set('job-weeks', String(weeks));
      set('job-mordant', String(mordant));
      var priceEl = document.getElementById('job-price');
      if (priceEl) priceEl.innerHTML = '₹' + fmt(price) + '<small>' + m.name + ', ' + r.name + '</small>';

      var note = '';
      if (state.repeat === 'buta') note = 'A single buta leaves the cloth around it empty, which is the harder drawing.';
      else if (state.repeat === 'border') note = 'A border cloth is drawn twice: once along the edge and once in the field, so the eye has rest.';
      else if (state.repeat === 'allover') note = 'All over means six motifs in the field and a vine between them. This is where the weeks go.';
      if (state.cloth === 'sari' && state.repeat === 'allover') note = 'A sari all over is a four-month cloth. I take two a year and no more.';
      if (state.motif === 'tree') note = 'The tree takes the longest because every leaf is drawn twice, once in outline and once in vein.';
      set('job-note', note);

      render();
    }

    function set(id, t) {
      var el = document.getElementById(id);
      if (el) el.textContent = t;
    }

    function bind(id, key) {
      var group = document.getElementById(id);
      if (!group) return;
      group.addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (!chip) return;
        group.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        state[key] = chip.dataset[key === 'motif' ? 'motif' : key === 'repeat' ? 'repeat' : key === 'cloth' ? 'cloth' : 'palette'];
        update();
      });
    }

    bind('motif-chips', 'motif');
    bind('repeat-chips', 'repeat');
    bind('cloth-chips', 'cloth');
    bind('palette-chips', 'palette');

    update();
  }

  /* ---------- cloths filter ---------- */
  var filters = document.querySelector('.filters');
  if (filters) {
    var items = Array.prototype.slice.call(document.querySelectorAll('.item'));
    var showing = document.getElementById('showing');
    filters.addEventListener('click', function (e) {
      var btn = e.target.closest('.fchip');
      if (!btn) return;
      var f = btn.dataset.filter;
      filters.querySelectorAll('.fchip').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      var n = 0;
      items.forEach(function (it) {
        var show = f === 'all' || it.dataset.type === f;
        it.hidden = !show;
        if (show) n++;
      });
      if (showing) showing.textContent = n + ' cloths';
    });
  }

  /* ---------- commission form ---------- */
  var form = document.getElementById('cloth-form');
  if (form) {
    var sent = document.getElementById('sent');
    function field(id) { return document.getElementById(id); }
    function err(id, msg) {
      var e = document.getElementById(id + '-err');
      var input = field(id);
      if (e) e.textContent = msg;
      if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }

    form.addEventListener('input', function (e) {
      if (e.target.id && document.getElementById(e.target.id + '-err')) err(e.target.id, '');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = field('p-name');
      var mail = field('p-email');
      var size = field('p-size');
      var note = field('p-note');
      var agree = field('p-agree');
      var ok = true;

      if (!name || name.value.trim().length < 2) { err('p-name', 'A name for the reply.'); ok = false; } else err('p-name', '');
      if (!mail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim())) { err('p-email', 'An address the reply can reach.'); ok = false; } else err('p-email', '');
      if (!size || !size.value.trim()) { err('p-size', 'The wall or the cloth size, in metres.'); ok = false; } else err('p-size', '');
      if (!note || note.value.trim().length < 12) { err('p-note', 'Tell me the motif and where the cloth will hang.'); ok = false; } else err('p-note', '');
      if (!agree || !agree.checked) { err('p-agree', 'Please confirm the waiting list is not a booking.'); ok = false; } else err('p-agree', '');

      if (!ok) {
        var first = form.querySelector('[aria-invalid="true"]');
        if (first && first.focus) first.focus();
        return;
      }

      set('sent-mail', mail.value.trim());
      set('sent-size', size.value.trim());
      var motif = field('p-motif');
      set('sent-motif', motif ? motif.value : 'Not decided');
      var date = field('p-date');
      if (date && date.value) {
        var d = new Date(date.value + 'T12:00:00');
        set('sent-date', d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
      } else {
        set('sent-date', 'No date fixed yet');
      }
      form.hidden = true;
      sent.hidden = false;
      sent.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  function set(id, t) {
    var el = document.getElementById(id);
    if (el) el.textContent = t;
  }
})();
