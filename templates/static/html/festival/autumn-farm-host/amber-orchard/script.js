/* Amber Orchard — interactions. No audio anywhere on this site. */

(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- ISO week + season state ---------- */
  function isoWeek(date) {
    var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    var day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  }
  var now = new Date();
  var week = isoWeek(now);

  function seasonFor(w) {
    if (w >= 49 || w <= 6) return 'Pruning and mulch';
    if (w <= 17) return 'Blossom watch';
    if (w <= 30) return 'Thinning the crop';
    if (w <= 46) return 'Picking';
    return 'Walnut cracking';
  }
  var wn = document.getElementById('week-no');
  var ws = document.getElementById('week-state');
  if (wn) wn.textContent = 'Week ' + week;
  if (ws) ws.textContent = seasonFor(week);

  /* ---------- burger ---------- */
  var burger = document.querySelector('.burger');
  var drawer = document.getElementById('bar-drawer');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      burger.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      drawer.hidden = open;
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        drawer.hidden = true;
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- orchard canvas: rows running to a vanishing point ---------- */
  var canvas = document.getElementById('orchard');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var W = 1, H = 1, DPR = 1;
    var trees = [];
    var apples = [];
    var raf = 0, phase = 0, last = 0, running = false;

    function layout() {
      var r = canvas.parentElement.getBoundingClientRect();
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      build();
    }

    function build() {
      trees = [];
      apples = [];
      var vpx = W * 0.5, vpy = H * 0.34;
      var rows = 7;
      for (var i = 0; i < rows; i++) {
        var spread = (i - (rows - 1) / 2) / ((rows - 1) / 2);
        for (var j = 0; j < 8; j++) {
          var t = 0.18 + (j / 8) * 0.95;
          var scale = 0.18 + t * 1.05;
          var x = vpx + spread * (W * 0.62) * t;
          var y = vpy + t * (H - vpy) * 1.06;
          if (x < -60 || x > W + 60) continue;
          var canopy = (H * 0.075) * scale;
          trees.push({ x: x, y: y, r: canopy, t: t, sway: (i + j) % 5 });
          var count = t > 0.6 ? 5 : 3;
          for (var k = 0; k < count; k++) {
            apples.push({
              x: x + (Math.random() - 0.5) * canopy * 1.5,
              y: y - canopy * (0.3 + Math.random() * 0.75),
              r: Math.max(0.9, canopy * 0.055),
              tone: Math.random() > 0.35 ? 'rust' : 'amber',
              tree: trees.length - 1
            });
          }
        }
      }
      trees.sort(function (a, b) { return a.y - b.y; });
    }

    function paint(wind) {
      ctx.clearRect(0, 0, W, H);
      // sky
      var sky = ctx.createLinearGradient(0, 0, 0, H * 0.55);
      sky.addColorStop(0, '#E3D5B4');
      sky.addColorStop(1, '#EFE6CE');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      // far ridge
      ctx.fillStyle = '#B9BFA1';
      ctx.beginPath();
      ctx.moveTo(0, H * 0.36);
      ctx.lineTo(W * 0.16, H * 0.30);
      ctx.lineTo(W * 0.3, H * 0.345);
      ctx.lineTo(W * 0.46, H * 0.29);
      ctx.lineTo(W * 0.62, H * 0.34);
      ctx.lineTo(W * 0.78, H * 0.30);
      ctx.lineTo(W, H * 0.35);
      ctx.lineTo(W, H * 0.42);
      ctx.lineTo(0, H * 0.42);
      ctx.closePath();
      ctx.fill();
      // ground
      var ground = ctx.createLinearGradient(0, H * 0.38, 0, H);
      ground.addColorStop(0, '#8E9670');
      ground.addColorStop(0.55, '#7C8759');
      ground.addColorStop(1, '#5F6C42');
      ctx.fillStyle = ground;
      ctx.fillRect(0, H * 0.37, W, H * 0.63);
      // mown rows
      ctx.strokeStyle = 'rgba(240,231,210,.30)';
      ctx.lineWidth = 1;
      for (var g = 1; g <= 9; g++) {
        var t = g / 9;
        var y = H * 0.37 + Math.pow(t, 1.8) * H * 0.63;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      // trees, back to front
      function mix(a, b, t) {
        return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' + Math.round(a[1] + (b[1] - a[1]) * t) + ',' + Math.round(a[2] + (b[2] - a[2]) * t) + ')';
      }
      var haze = [223, 214, 186];
      trees.forEach(function (tr) {
        var wobble = Math.sin(wind + tr.sway) * tr.r * 0.06;
        var depth = Math.min(0.62, (1 - tr.t) * 0.8);
        // trunk
        ctx.strokeStyle = 'rgba(74,58,36,.85)';
        ctx.lineWidth = Math.max(1, tr.r * 0.16);
        ctx.beginPath();
        ctx.moveTo(tr.x, tr.y);
        ctx.lineTo(tr.x + wobble * 0.4, tr.y - tr.r * 0.9);
        ctx.stroke();
        // canopy
        var greens = [[76, 92, 52], [91, 107, 60], [63, 78, 44]];
        for (var c = 0; c < 5; c++) {
          var a = (c / 5) * Math.PI * 2;
          ctx.fillStyle = mix(greens[c % 3], haze, depth);
          ctx.globalAlpha = 0.92;
          ctx.beginPath();
          ctx.arc(
            tr.x + wobble + Math.cos(a) * tr.r * 0.52,
            tr.y - tr.r * 1.05 + Math.sin(a) * tr.r * 0.42,
            tr.r * 0.72, 0, Math.PI * 2
          );
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      });
      // apples on top
      apples.forEach(function (ap) {
        var tr = trees[ap.tree];
        if (!tr) return;
        ctx.fillStyle = ap.tone === 'rust' ? '#8C3A1B' : '#C08A2E';
        ctx.beginPath();
        ctx.arc(ap.x, ap.y, ap.r, 0, Math.PI * 2);
        ctx.fill();
      });
      // warm light from the left
      var glow = ctx.createLinearGradient(0, 0, W * 0.7, H * 0.8);
      glow.addColorStop(0, 'rgba(255,232,183,.30)');
      glow.addColorStop(1, 'rgba(255,232,183,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
    }

    function tick(ts) {
      if (!running) return;
      if (ts - last > 42) {
        phase += 0.012;
        paint(phase);
        last = ts;
      }
      raf = requestAnimationFrame(tick);
    }
    function start() {
      if (reduce) { paint(0.4); return; }
      running = true;
      raf = requestAnimationFrame(tick);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
    }

    layout();
    start();
    window.addEventListener('resize', function () { layout(); paint(phase); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
  }

  /* ---------- picking calendar ---------- */
  var VARIETIES = {
    royal: { name: 'Royal Delicious', start: 35, end: 38, store: 26, keeps: 'Five to six months at 1 °C', flavour: 'Sweet, low acid, soft bite', use: 'Cider and dried rings', poll: 'Golden Delicious' },
    red: { name: 'Red Delicious', start: 37, end: 40, store: 22, keeps: 'Four to five months', flavour: 'Sweet, thin skin, mild', use: 'Fresh boxes, juice', poll: 'Golden Delicious' },
    golden: { name: 'Golden Delicious', start: 37, end: 41, store: 24, keeps: 'Four months before it softens', flavour: 'Honeyed, floral, tender', use: 'Drying, cider, the table', poll: 'Red Delicious' },
    granny: { name: 'Granny Smith', start: 40, end: 44, store: 28, keeps: 'Six months, best by March', flavour: 'Sharp, firm, green', use: 'Chutney and cooking', poll: 'Golden Delicious' },
    ambri: { name: 'Ambri', start: 42, end: 45, store: 18, keeps: 'Three months in the shed', flavour: 'Very sweet, thick skin, honeyed', use: 'Gifting, fresh', poll: 'Royal Delicious' },
    cox: { name: "Cox's Orange Pippin", start: 37, end: 39, store: 12, keeps: 'Eight weeks, no longer', flavour: 'Nutty, aromatic, complex', use: 'The farm table only', poll: 'Golden Delicious' }
  };

  var grid = document.getElementById('cal-grid');
  var calName = document.getElementById('cal-name');
  var calWindow = document.getElementById('cal-window');
  var calKeeps = document.getElementById('cal-keeps');
  var calFlavour = document.getElementById('cal-flavour');
  var calUse = document.getElementById('cal-use');
  var calPoll = document.getElementById('cal-poll');
  var vButtons = Array.prototype.slice.call(document.querySelectorAll('.variety'));

  function monthName(m) { return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m]; }
  function weekToDate(w) {
    var jan4 = new Date(now.getFullYear(), 0, 4);
    var start = new Date(jan4.getTime() - ((jan4.getDay() + 6) % 7) * 86400000);
    return new Date(start.getTime() + (w - 1) * 7 * 86400000);
  }

  function buildGrid() {
    if (!grid) return;
    grid.innerHTML = '';
    for (var w = 1; w <= 52; w++) {
      var cell = document.createElement('span');
      cell.className = 'cal-cell';
      cell.setAttribute('data-week', String(w));
      if (w === week) cell.classList.add('is-today');
      grid.appendChild(cell);
    }
  }

  function selectVariety(key) {
    var v = VARIETIES[key];
    if (!v || !grid) return;
    var cells = grid.children;
    for (var w = 1; w <= 52; w++) {
      var cell = cells[w - 1];
      cell.classList.remove('is-harvest', 'is-store');
      if (w >= v.start && w <= v.end) cell.classList.add('is-harvest');
      else if (w > v.end && w <= v.end + v.store) cell.classList.add('is-store');
    }
    var from = weekToDate(v.start), to = weekToDate(v.end);
    calName.textContent = v.name;
    calWindow.textContent = 'Picked weeks ' + v.start + ' – ' + v.end + ' · ' + monthName(from.getMonth()).toLowerCase() + (from.getMonth() !== to.getMonth() ? ' to ' + monthName(to.getMonth()).toLowerCase() : '');
    calKeeps.textContent = v.keeps;
    calFlavour.textContent = v.flavour;
    calUse.textContent = v.use;
    calPoll.textContent = v.poll;
    grid.setAttribute('aria-label', v.name + ' is picked from week ' + v.start + ' to week ' + v.end + ' and keeps in cold store for ' + v.store + ' weeks');
    vButtons.forEach(function (b) {
      var on = b.getAttribute('data-variety') === key;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  if (grid) {
    buildGrid();
    selectVariety('royal');
    vButtons.forEach(function (b) {
      b.addEventListener('click', function () { selectVariety(b.getAttribute('data-variety')); });
    });
    // keyboard: arrows move through the varieties
    vButtons.forEach(function (b, i) {
      b.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = vButtons[(i + 1) % vButtons.length];
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = vButtons[(i - 1 + vButtons.length) % vButtons.length];
        if (next) { e.preventDefault(); next.focus(); selectVariety(next.getAttribute('data-variety')); }
      });
    });
  }

  /* ---------- stay enquiry ---------- */
  var form = document.getElementById('stay-form');
  if (form) {
    var done = document.getElementById('stay-done');
    var summary = document.getElementById('stay-summary');
    var mail = document.getElementById('stay-mail');
    var edit = document.getElementById('stay-edit');

    var FIELD = { name: 'guest-name', email: 'guest-email', arrive: 'arrive' };
    function err(key, msg) {
      var e = document.getElementById('e-' + key);
      var input = document.getElementById(FIELD[key]);
      if (e) e.textContent = msg || '';
      if (input) {
        if (msg) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      }
    }

    var checks = {
      name: function (v) { return v.trim().length >= 2 ? '' : 'A name, please.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Check the email address.'; },
      arrive: function (v) {
        if (!v) return 'Pick an arrival date.';
        var d = new Date(v + 'T00:00:00');
        var today = new Date(); today.setHours(0, 0, 0, 0);
        return d >= today ? '' : 'That date has passed.';
      }
    };

    Object.keys(checks).forEach(function (key) {
      var el = document.getElementById(FIELD[key]);
      el.addEventListener('blur', function () { err(key, checks[key](el.value)); });
      el.addEventListener('input', function () {
        if (el.getAttribute('aria-invalid') === 'true') err(key, checks[key](el.value));
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(checks).forEach(function (key) {
        var el = document.getElementById(FIELD[key]);
        var msg = checks[key](el.value);
        err(key, msg);
        if (msg && !firstBad) firstBad = el;
      });
      var terms = document.getElementById('terms');
      var tErr = document.getElementById('e-terms');
      if (!terms.checked) {
        if (tErr) tErr.textContent = 'Please confirm you have read how the house works.';
        if (!firstBad) firstBad = terms;
      } else if (tErr) tErr.textContent = '';

      if (firstBad) { firstBad.focus(); return; }

      var name = document.getElementById('guest-name').value.trim();
      var email = document.getElementById('guest-email').value.trim();
      var arrive = document.getElementById('arrive').value;
      var nights = document.getElementById('nights').value;
      var guests = document.getElementById('guests').value;
      var kind = document.getElementById('kind').value;
      var notes = document.getElementById('notes').value.trim();
      var nice = new Date(arrive + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

      summary.textContent = name + ', ' + kind.toLowerCase() + ' for ' + guests + (guests === '1' ? ' guest' : ' guests') +
        ' from ' + nice + ', ' + nights + (nights === '1' ? ' night' : ' nights') +
        '. This summary is ready to send; the room is held only once we reply by email.';

      var body = [
        'Stay enquiry — Amber Orchard',
        '',
        'Name: ' + name,
        'Email: ' + email,
        'Arrival: ' + nice,
        'Nights: ' + nights,
        'Guests: ' + guests,
        'Kind of stay: ' + kind,
        '',
        notes || '(No further notes.)'
      ].join('\n');
      mail.href = 'mailto:stay@amberorchard.in?subject=' + encodeURIComponent('Stay enquiry — ' + nice) + '&body=' + encodeURIComponent(body);

      form.hidden = true;
      done.hidden = false;
      done.focus();
    });

    if (edit) {
      edit.addEventListener('click', function () {
        done.hidden = true;
        form.hidden = false;
        document.getElementById('guest-name').focus();
      });
    }
  }
})();
