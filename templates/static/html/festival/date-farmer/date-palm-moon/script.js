/* Date Palm Moon — Hingora Grove
   Silent: no audio, no external libraries. */
(function () {
  'use strict';

  /* ---------- nav ---------- */
  var menu = document.querySelector('.menu');
  var nav = document.querySelector('.nav');
  if (menu && nav) {
    menu.addEventListener('click', function () {
      var open = menu.getAttribute('aria-expanded') === 'true';
      menu.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && window.innerWidth <= 760) {
        menu.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      }
    });
  }

  /* ---------- moon ---------- */
  function moonPhase(date) {
    var synodic = 29.530588853;
    var ref = Date.UTC(2000, 0, 6, 18, 14);
    var days = (date.getTime() - ref) / 86400000;
    var phase = ((days / synodic) % 1 + 1) % 1;
    var illum = (1 - Math.cos(2 * Math.PI * phase)) / 2;
    var name;
    if (phase < 0.033 || phase >= 0.967) name = 'New moon';
    else if (phase < 0.216) name = 'Waxing crescent';
    else if (phase < 0.283) name = 'First quarter';
    else if (phase < 0.467) name = 'Waxing gibbous';
    else if (phase < 0.533) name = 'Full moon';
    else if (phase < 0.717) name = 'Waning gibbous';
    else if (phase < 0.783) name = 'Last quarter';
    else name = 'Waning crescent';
    return { phase: phase, illum: illum, name: name, waxing: phase < 0.5 };
  }

  var today = new Date();
  var mp = moonPhase(today);
  var moonName = document.getElementById('moon-name');
  var moonDot = document.getElementById('moon-dot');
  if (moonName) moonName.textContent = mp.name + ' · ' + Math.round(mp.illum * 100) + '%';
  if (moonDot) {
    var off = (moonDot.offsetWidth || 16) * (1 - mp.illum);
    moonDot.style.boxShadow = 'inset ' + (mp.waxing ? -off : off) + 'px 1px 0 0 var(--night)';
  }

  /* ---------- night sky canvas ---------- */
  var sky = document.getElementById('sky');
  if (sky && sky.getContext) {
    var sctx = sky.getContext('2d');
    var SW = 1600, SH = 900;
    var sDpr = Math.min(2, window.devicePixelRatio || 1);

    function rnd(n) {
      var x = Math.sin(n * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    }

    function paintSky() {
      var rect = sky.getBoundingClientRect();
      SW = Math.max(320, Math.round(rect.width || 1600));
      SH = Math.max(360, Math.round(rect.height || 900));
      sky.width = Math.round(SW * sDpr);
      sky.height = Math.round(SH * sDpr);
      sctx.setTransform(sDpr, 0, 0, sDpr, 0, 0);
      sctx.clearRect(0, 0, SW, SH);

      var base = sctx.createLinearGradient(0, 0, 0, SH);
      base.addColorStop(0, '#0a1320');
      base.addColorStop(0.55, '#0d1a28');
      base.addColorStop(1, '#122234');
      sctx.fillStyle = base;
      sctx.fillRect(0, 0, SW, SH);

      /* faint dust band */
      var band = sctx.createLinearGradient(0, 0, SW, SH * 0.8);
      band.addColorStop(0, 'rgba(140,160,180,0)');
      band.addColorStop(0.5, 'rgba(150,170,190,0.06)');
      band.addColorStop(1, 'rgba(140,160,180,0)');
      sctx.fillStyle = band;
      sctx.beginPath();
      sctx.moveTo(0, SH * 0.72);
      sctx.lineTo(SW, SH * 0.12);
      sctx.lineTo(SW, SH * 0.4);
      sctx.lineTo(0, SH * 0.95);
      sctx.closePath();
      sctx.fill();

      /* stars */
      var count = Math.round((SW * SH) / 3400);
      for (var i = 0; i < count; i++) {
        var x = rnd(i + 1) * SW;
        var y = Math.pow(rnd(i + 51), 1.25) * SH * 0.84;
        var r = 0.4 + rnd(i + 101) * 1.35;
        var a = 0.18 + rnd(i + 151) * 0.72;
        sctx.beginPath();
        sctx.arc(x, y, r, 0, Math.PI * 2);
        sctx.fillStyle = 'rgba(236,220,189,' + a.toFixed(2) + ')';
        sctx.fill();
        if (r > 1.4) {
          sctx.strokeStyle = 'rgba(236,220,189,' + (a * 0.35).toFixed(2) + ')';
          sctx.lineWidth = 0.6;
          sctx.beginPath();
          sctx.moveTo(x - 4, y); sctx.lineTo(x + 4, y);
          sctx.moveTo(x, y - 4); sctx.lineTo(x, y + 4);
          sctx.stroke();
        }
      }

      /* moon: stays circular at any viewport */
      var narrow = SW < 760;
      var mx = SW * (narrow ? 0.85 : 0.76);
      var my = SH * (narrow ? 0.045 : 0.27);
      var mr = Math.max(narrow ? 18 : 34, Math.min(SW, SH) * (narrow ? 0.05 : 0.1));
      var glow = sctx.createRadialGradient(mx, my, mr * 0.4, mx, my, mr * 4.2);
      glow.addColorStop(0, 'rgba(236,220,189,0.16)');
      glow.addColorStop(0.45, 'rgba(236,220,189,0.05)');
      glow.addColorStop(1, 'rgba(236,220,189,0)');
      sctx.fillStyle = glow;
      sctx.beginPath();
      sctx.arc(mx, my, mr * 4.2, 0, Math.PI * 2);
      sctx.fill();

      var lit = sctx.createRadialGradient(mx - mr * 0.26, my - mr * 0.3, mr * 0.08, mx, my, mr);
      lit.addColorStop(0, '#f6edd8');
      lit.addColorStop(0.7, '#e8dcc1');
      lit.addColorStop(1, '#cbbb98');
      sctx.fillStyle = lit;
      sctx.beginPath();
      sctx.arc(mx, my, mr, 0, Math.PI * 2);
      sctx.fill();

      sctx.save();
      sctx.beginPath();
      sctx.arc(mx, my, mr, 0, Math.PI * 2);
      sctx.clip();
      var shadowW = mr * 2 * (1 - mp.illum);
      sctx.fillStyle = 'rgba(10,19,30,0.94)';
      if (mp.waxing) {
        sctx.beginPath();
        sctx.ellipse(mx - mr + shadowW * 0.5 - mr * 0.6, my, shadowW * 0.62, mr * 1.02, 0, 0, Math.PI * 2);
        sctx.fill();
      } else {
        sctx.beginPath();
        sctx.ellipse(mx + mr - shadowW * 0.5 + mr * 0.6, my, shadowW * 0.62, mr * 1.02, 0, 0, Math.PI * 2);
        sctx.fill();
      }
      var craters = [[-0.28, -0.18, 0.13], [0.18, 0.26, 0.17], [-0.06, 0.44, 0.08], [0.36, -0.34, 0.07], [-0.44, 0.3, 0.06], [0.08, -0.48, 0.05]];
      craters.forEach(function (c, idx) {
        sctx.beginPath();
        sctx.arc(mx + c[0] * mr, my + c[1] * mr, c[2] * mr, 0, Math.PI * 2);
        sctx.fillStyle = idx % 2 ? 'rgba(150,138,112,0.16)' : 'rgba(150,138,112,0.1)';
        sctx.fill();
      });
      sctx.restore();

      var hor = sctx.createLinearGradient(0, SH * 0.72, 0, SH);
      hor.addColorStop(0, 'rgba(214,139,69,0)');
      hor.addColorStop(1, 'rgba(214,139,69,0.09)');
      sctx.fillStyle = hor;
      sctx.fillRect(0, SH * 0.7, SW, SH * 0.3);
    }
    paintSky();
    var skyTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(skyTimer);
      skyTimer = setTimeout(paintSky, 180);
    });
  }

  /* ---------- reveal ---------- */
  var revealEls = [].slice.call(document.querySelectorAll('.reveal'));
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* ---------- harvest planner ---------- */
  var planForm = document.getElementById('plan-form');
  if (planForm) {
    var VARIETIES = {
      khalas: { name: 'Khalas', yield: 58, days: [0, 30, 118, 158, 182], pick: 'picked and dried by' },
      aseel: { name: 'Aseel', yield: 52, days: [0, 32, 122, 166, 192], pick: 'dried on the mats by' },
      barhi: { name: 'Barhi', yield: 44, days: [0, 26, 106, 124, 132], pick: 'cut at khalal, crisp, by' },
      medjool: { name: 'Medjool', yield: 66, days: [0, 34, 128, 174, 202], pick: 'picked in two passes ending' }
    };
    var vSel = document.getElementById('p-variety');
    var palms = document.getElementById('p-palms');
    var dateIn = document.getElementById('p-date');
    var loss = document.getElementById('p-loss');
    var palmsOut = document.getElementById('p-palms-out');
    var lossOut = document.getElementById('p-loss-out');
    var fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    function addDays(base, n) {
      var d = new Date(base.getTime());
      d.setDate(d.getDate() + n);
      return d;
    }

    function render() {
      var v = VARIETIES[vSel.value] || VARIETIES.khalas;
      var n = +palms.value;
      var pct = +loss.value;
      if (palmsOut) palmsOut.textContent = String(n);
      if (lossOut) lossOut.textContent = pct + '%';

      var start = dateIn.value ? new Date(dateIn.value + 'T00:00:00') : new Date();
      if (isNaN(start.getTime())) start = new Date();
      var d = v.days;

      document.getElementById('s-hababouk').textContent = fmt.format(addDays(start, d[0]));
      document.getElementById('s-kimri').textContent = fmt.format(addDays(start, d[1]));
      document.getElementById('s-khalal').textContent = fmt.format(addDays(start, d[2]));
      document.getElementById('s-tamr').textContent = fmt.format(addDays(start, d[4]));

      var kg = n * v.yield * (1 - pct / 100);
      var tonnes = kg / 1000;
      var boxes = Math.round(kg / 5);
      document.getElementById('plan-yield').textContent = (tonnes >= 10 ? tonnes.toFixed(1) : tonnes.toFixed(2)) + ' tonnes';
      document.getElementById('plan-boxes').textContent = boxes.toLocaleString('en-IN') + ' boxes of 5 kg · ' + Math.round(kg / 1.5).toLocaleString('en-IN') + ' tins of 1.5 kg';

      var note = v.name + ' from a block of ' + n + ' palms, ' + v.pick + ' ' + fmt.format(addDays(start, d[4])) + '. ';
      if (v.name === 'Barhi') {
        note += 'Khalal begins around ' + fmt.format(addDays(start, d[2])) + ' and the fruit is out of the grove within three days of cutting.';
      } else if (v.name === 'Medjool') {
        note += 'Medjool is still a trial here; a wet August can split the fruit before it dries.';
      } else {
        note += 'The second picking follows the next moon, usually ten to fourteen days later.';
      }
      document.getElementById('plan-note').textContent = note;
    }

    [vSel, palms, dateIn, loss].forEach(function (el) { if (el) el.addEventListener('input', render); });
    [vSel, dateIn].forEach(function (el) { if (el) el.addEventListener('change', render); });
    render();
  }

  /* ---------- harvest records filter ---------- */
  var chips = [].slice.call(document.querySelectorAll('.chip[data-var]'));
  if (chips.length) {
    var rows = [].slice.call(document.querySelectorAll('.rec-table tbody tr'));
    var empty = document.querySelector('.rec-empty');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        var f = chip.getAttribute('data-var');
        var shown = 0;
        rows.forEach(function (row) {
          var match = f === 'all' || row.getAttribute('data-var') === f;
          row.hidden = !match;
          if (match) shown++;
        });
        if (empty) empty.hidden = shown !== 0;
      });
    });
  }

  /* ---------- wholesale form ---------- */
  var form = document.getElementById('wholesale-form');
  if (form) {
    var sent = document.getElementById('w-sent');
    var fields = {
      name: { el: document.getElementById('w-name'), msg: 'Please give a name and firm.' },
      email: { el: document.getElementById('w-email'), msg: 'An email that reaches you.' },
      variety: { el: document.getElementById('w-variety'), msg: 'Choose a variety.' },
      tonnes: { el: document.getElementById('w-tonnes'), msg: 'Roughly how much, in tonnes.' },
      month: { el: document.getElementById('w-month'), msg: 'The month you need it.' }
    };
    function err(key, msg) {
      var e = document.getElementById('err-w-' + key);
      if (e) e.textContent = msg || '';
      if (fields[key].el) fields[key].el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }
    function check() {
      var ok = true;
      if (!fields.name.el.value.trim()) { err('name', fields.name.msg); ok = false; } else err('name');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email.el.value.trim())) { err('email', fields.email.msg); ok = false; } else err('email');
      if (!fields.variety.el.value) { err('variety', fields.variety.msg); ok = false; } else err('variety');
      if (!(parseFloat(fields.tonnes.el.value) > 0)) { err('tonnes', fields.tonnes.msg); ok = false; } else err('tonnes');
      if (!fields.month.el.value) { err('month', fields.month.msg); ok = false; } else err('month');
      return ok;
    }
    Object.keys(fields).forEach(function (k) {
      if (!fields[k].el) return;
      fields[k].el.addEventListener('input', function () { if (fields[k].el.getAttribute('aria-invalid') === 'true') check(); });
      fields[k].el.addEventListener('change', function () { if (fields[k].el.getAttribute('aria-invalid') === 'true') check(); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!check()) {
        var bad = form.querySelector('[aria-invalid="true"]');
        if (bad) bad.focus();
        return;
      }
      var nm = fields.name.el.value.trim().split(' ')[0];
      var note = document.getElementById('w-sent-note');
      if (note) {
        note.textContent = 'Thank you, ' + nm + '. I answer wholesale enquiries on Mondays and Thursdays. If the crop is already spoken for, I will tell you straight and name the block that is still free.';
      }
      form.hidden = true;
      if (sent) { sent.hidden = false; sent.focus(); }
    });
  }
})();
