/* Akash Lens — contour map, flight planner and form. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav ---------- */
  var bar = document.querySelector('.bar');
  var menu = document.querySelector('.menu');
  if (bar && menu) {
    menu.addEventListener('click', function () {
      var open = bar.classList.toggle('open');
      menu.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    bar.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        bar.classList.remove('open');
        menu.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && bar.classList.contains('open')) {
        bar.classList.remove('open');
        menu.setAttribute('aria-expanded', 'false');
        menu.focus();
      }
    });
  }

  /* ---------- hero contour map ---------- */
  var topo = document.getElementById('topo');
  if (topo && topo.getContext) {
    var tctx = topo.getContext('2d');
    var tw = 0, th = 0, tdpr = Math.min(window.devicePixelRatio || 1, 2);
    var beacon = 0;

    function contours(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      // grid
      ctx.strokeStyle = 'rgba(111,214,255,0.055)';
      ctx.lineWidth = 1;
      for (var x = 0; x < w; x += 48) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (var y = 0; y < h; y += 48) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      // contour rings around two centres
      var spots = [
        { cx: w * 0.62, cy: h * 0.42, base: 26, step: 25, count: 13, squash: 0.72, phase: 0.9 },
        { cx: w * 0.2, cy: h * 0.78, base: 18, step: 22, count: 9, squash: 0.9, phase: 2.1 }
      ];
      spots.forEach(function (s) {
        for (var i = 0; i < s.count; i++) {
          var r = s.base + i * s.step;
          ctx.beginPath();
          for (var a = 0; a <= 360; a += 6) {
            var rad = (a * Math.PI) / 180;
            var wobble = 1 + 0.13 * Math.sin(a * 0.055 + i * 0.7 + s.phase) + 0.06 * Math.sin(a * 0.13 + i);
            var px = s.cx + Math.cos(rad) * r * wobble;
            var py = s.cy + Math.sin(rad) * r * wobble * s.squash;
            if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.strokeStyle = i % 3 === 0 ? 'rgba(111,214,255,0.2)' : 'rgba(111,214,255,0.1)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });
      // ridge path
      ctx.beginPath();
      ctx.moveTo(0, h * 0.62);
      ctx.bezierCurveTo(w * 0.22, h * 0.48, w * 0.4, h * 0.76, w * 0.58, h * 0.6);
      ctx.bezierCurveTo(w * 0.72, h * 0.46, w * 0.86, h * 0.66, w, h * 0.52);
      ctx.strokeStyle = 'rgba(232,217,176,0.22)';
      ctx.setLineDash([6, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      // home beacons
      var pulse = reduced ? 0.6 : 0.45 + 0.35 * Math.sin(beacon);
      var hx = w * 0.62, hy = h * 0.42;
      ctx.beginPath();
      ctx.arc(hx, hy, 34 + pulse * 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(111,214,255,' + (0.35 - pulse * 0.2).toFixed(2) + ')';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(hx, hy, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(111,214,255,' + (0.7 + pulse * 0.3).toFixed(2) + ')';
      ctx.fill();

      // crosshair ticks
      ctx.strokeStyle = 'rgba(111,214,255,0.3)';
      ctx.beginPath();
      ctx.moveTo(hx - 60, hy); ctx.lineTo(hx - 16, hy);
      ctx.moveTo(hx + 16, hy); ctx.lineTo(hx + 60, hy);
      ctx.moveTo(hx, hy - 60); ctx.lineTo(hx, hy - 16);
      ctx.moveTo(hx, hy + 16); ctx.lineTo(hx, hy + 60);
      ctx.stroke();

      // tiny elevation labels
      ctx.font = '9px "IBM Plex Mono", monospace';
      ctx.fillStyle = 'rgba(137,161,176,0.55)';
      ctx.fillText('742 m', w * 0.62 - 18, h * 0.42 - 48);
      ctx.fillText('318 m', w * 0.2 - 16, h * 0.78 - 40);
      ctx.fillText('N 12°58′ / E 77°35′', 26, h - 24);
    }

    function drawTopo() {
      var rect = topo.getBoundingClientRect();
      tw = Math.max(rect.width, 320);
      th = Math.max(rect.height, 360);
      topo.width = Math.round(tw * tdpr);
      topo.height = Math.round(th * tdpr);
      tctx.setTransform(tdpr, 0, 0, tdpr, 0, 0);
      contours(tctx, tw, th);
    }

    drawTopo();
    window.addEventListener('resize', drawTopo);

    if (!reduced) {
      var tick = function () {
        beacon += 0.03;
        contours(tctx, tw, th);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  /* ---------- brief form ---------- */
  var form = document.getElementById('brief-form');
  if (form) {
    var status = document.getElementById('form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('name');
      var email = document.getElementById('email');
      var place = document.getElementById('place');
      var note = document.getElementById('note');
      var agree = document.getElementById('agree');
      ['name', 'email', 'place', 'note', 'agree'].forEach(function (id) {
        var node = document.getElementById('err-' + id);
        if (node) node.textContent = '';
      });
      var bad = null;
      if (name.value.trim().length < 2) { document.getElementById('err-name').textContent = 'Name, please — first name is enough.'; bad = bad || name; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { document.getElementById('err-email').textContent = 'That email does not look complete.'; bad = bad || email; }
      if (place.value.trim().length < 2) { document.getElementById('err-place').textContent = 'A place name or a pin helps me check the airspace.'; bad = bad || place; }
      if (note.value.trim().length < 12) { document.getElementById('err-note').textContent = 'A sentence about the shot, the light and the date.'; bad = bad || note; }
      if (!agree.checked) { document.getElementById('err-agree').textContent = 'Please confirm you have read the flight limits.'; bad = bad || agree; }
      if (bad) {
        status.className = 'form-status bad';
        status.textContent = 'A few fields still need you.';
        bad.focus();
        return;
      }
      status.className = 'form-status ok';
      status.textContent = 'Thanks, ' + name.value.trim().split(' ')[0] + '. This is a portfolio preview, so nothing has been sent — write to fly@akashlens.in with the same details and I will reply within two working days with a recce slot.';
      form.querySelector('button[type="submit"]').textContent = 'Brief noted';
    });
  }

  /* ---------- flight planner ---------- */
  var map = document.getElementById('map');
  if (!map || !map.getContext) return;

  var ctx = map.getContext('2d');
  var W = map.width, H = map.height;
  var SCALE = 2.5; // metres per pixel
  var HOME = { x: 210, y: 590 };
  var NFZ = { x: 780, y: 250, rx: 168, ry: 128, label: 'ASI MONUMENT — NO FLY' };
  var route = [];
  var hover = null;
  var speed = 10;
  var altitude = 90;

  var el = {
    wp: document.getElementById('r-wp'),
    dist: document.getElementById('r-dist'),
    time: document.getElementById('r-time'),
    bat: document.getElementById('r-bat'),
    status: document.getElementById('r-status'),
    altOut: document.getElementById('alt-out')
  };

  function inNfz(p) {
    var dx = (p.x - NFZ.x) / NFZ.rx;
    var dy = (p.y - NFZ.y) / NFZ.ry;
    return dx * dx + dy * dy <= 1;
  }

  function drawMap() {
    ctx.clearRect(0, 0, W, H);
    // deck
    ctx.fillStyle = '#0a1219';
    ctx.fillRect(0, 0, W, H);
    // survey grid
    for (var x = 0; x <= W; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, H);
      ctx.strokeStyle = x % 300 === 0 ? 'rgba(111,214,255,0.14)' : 'rgba(111,214,255,0.05)';
      ctx.stroke();
    }
    for (var y = 0; y <= H; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(W, y);
      ctx.strokeStyle = y % 300 === 0 ? 'rgba(111,214,255,0.14)' : 'rgba(111,214,255,0.05)';
      ctx.stroke();
    }
    // terrain contours
    var hills = [{ cx: 520, cy: 300, r0: 40, step: 34, n: 9 }, { cx: 1030, cy: 620, r0: 30, step: 30, n: 7 }];
    hills.forEach(function (h, hi) {
      for (var i = 0; i < h.n; i++) {
        var r = h.r0 + i * h.step;
        ctx.beginPath();
        for (var a = 0; a <= 360; a += 8) {
          var rad = (a * Math.PI) / 180;
          var wob = 1 + 0.15 * Math.sin(a * 0.05 + i * 0.6 + hi * 2) + 0.07 * Math.sin(a * 0.11 + i);
          var px = h.cx + Math.cos(rad) * r * wob;
          var py = h.cy + Math.sin(rad) * r * wob * 0.78;
          if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(111,214,255,0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
    // no-fly zone
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(NFZ.x, NFZ.y, NFZ.rx, NFZ.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,157,92,0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,157,92,0.7)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([7, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,157,92,0.9)';
    ctx.font = '500 11px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(NFZ.label, NFZ.x, NFZ.y - 6);
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(255,157,92,0.65)';
    ctx.fillText('PERMISSION REQUIRED', NFZ.x, NFZ.y + 12);
    ctx.restore();

    // route line
    if (route.length) {
      var pts = [HOME].concat(route);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var p = 1; p < pts.length; p++) ctx.lineTo(pts[p].x, pts[p].y);
      ctx.strokeStyle = 'rgba(232,217,176,0.9)';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // dashes on top for texture
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var q = 1; q < pts.length; q++) ctx.lineTo(pts[q].x, pts[q].y);
      ctx.strokeStyle = 'rgba(10,18,25,0.9)';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 7]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // waypoints
    route.forEach(function (wp, i) {
      var bad = inNfz(wp);
      ctx.beginPath();
      ctx.arc(wp.x, wp.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = bad ? 'rgba(255,157,92,0.22)' : 'rgba(232,217,176,0.12)';
      ctx.fill();
      ctx.strokeStyle = bad ? '#ff9d5c' : '#e8d9b0';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(wp.x, wp.y, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = bad ? '#ff9d5c' : '#e8d9b0';
      ctx.fill();
      ctx.fillStyle = bad ? '#ff9d5c' : 'rgba(232,217,176,0.95)';
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(String(i + 1).padStart(2, '0'), wp.x + 13, wp.y - 9);
    });

    // home
    ctx.beginPath();
    ctx.arc(HOME.x, HOME.y, 12, 0, Math.PI * 2);
    ctx.strokeStyle = '#6fd6ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(HOME.x, HOME.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#6fd6ff';
    ctx.fill();
    ctx.fillStyle = '#6fd6ff';
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('HOME', HOME.x + 18, HOME.y + 4);

    // scale bar and north arrow
    ctx.strokeStyle = 'rgba(214,232,240,0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(38, H - 40); ctx.lineTo(38 + 200, H - 40);
    ctx.moveTo(38, H - 46); ctx.lineTo(38, H - 34);
    ctx.moveTo(238, H - 46); ctx.lineTo(238, H - 34);
    ctx.stroke();
    ctx.fillStyle = 'rgba(214,232,240,0.7)';
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('500 M', 42, H - 50);
    ctx.beginPath();
    ctx.moveTo(W - 56, 44); ctx.lineTo(W - 56, 18);
    ctx.moveTo(W - 62, 28); ctx.lineTo(W - 56, 18); ctx.lineTo(W - 50, 28);
    ctx.stroke();
    ctx.fillText('N', W - 61, 60);

    // survey labels
    ctx.fillStyle = 'rgba(137,161,176,0.6)';
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.fillText('COFFEE BLOCK A', 330, 520);
    ctx.fillText('RIDGE 742 M', 470, 196);
    ctx.fillText('TANK', 940, 610);
    ctx.fillText('ACCESS ROAD', 120, 300);

    // hover crosshair
    if (hover) {
      ctx.strokeStyle = 'rgba(111,214,255,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hover.x, 0); ctx.lineTo(hover.x, H);
      ctx.moveTo(0, hover.y); ctx.lineTo(W, hover.y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(111,214,255,0.8)';
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(Math.round((hover.x) * SCALE) + ' m / ' + Math.round((H - hover.y) * SCALE) + ' m', hover.x + 10, hover.y - 8);
    }
  }

  function fmtTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = Math.round(seconds % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function update() {
    var dist = 0;
    var pts = [HOME].concat(route);
    for (var i = 1; i < pts.length; i++) {
      dist += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    }
    var metres = dist * SCALE;
    var airtime = route.length ? metres / speed + route.length * 12 : 0;
    var minutes = airtime / 60;
    var battery = route.length ? (minutes / 32) * 100 + (metres / 1000) * 4 : 0;

    el.wp.textContent = String(route.length);
    el.dist.textContent = metres >= 1000 ? (metres / 1000).toFixed(2) + ' km' : Math.round(metres) + ' m';
    el.time.textContent = fmtTime(airtime);
    el.bat.textContent = Math.round(Math.min(battery, 100)) + '%';

    var notes = [];
    var cls = 'ok';
    if (!route.length) {
      el.status.className = 'status-idle';
      el.status.textContent = 'Add a waypoint to begin.';
    } else {
      if (route.some(inNfz)) {
        notes.push('Route enters the protected-monument zone: written permission and Digital Sky clearance required, or plan around it.');
        cls = 'warn';
      }
      if (altitude > 120) {
        notes.push('Cruise altitude is above the 120 m ceiling (UAS Rules 2021) — bring it down before flight.');
        cls = 'warn';
      }
      if (battery > 85) {
        notes.push('This flight eats the reserve. Split it into two, or land and swap a battery.');
        cls = 'warn';
      }
      if (!notes.length) {
        notes.push('Within limits: ' + Math.round(metres) + ' m of route at ' + speed + ' m/s, ' + Math.round(battery) + '% of the pack. Add a spotter and log the flight.');
      }
      el.status.className = cls;
      el.status.textContent = notes.join(' ');
    }
    drawMap();
  }

  function toCanvas(evt) {
    var rect = map.getBoundingClientRect();
    var cx = evt.touches ? evt.touches[0].clientX : evt.clientX;
    var cy = evt.touches ? evt.touches[0].clientY : evt.clientY;
    return {
      x: ((cx - rect.left) / rect.width) * W,
      y: ((cy - rect.top) / rect.height) * H
    };
  }

  map.addEventListener('click', function (evt) {
    var p = toCanvas(evt);
    route.push({ x: Math.round(p.x), y: Math.round(p.y) });
    update();
  });

  map.addEventListener('mousemove', function (evt) {
    hover = toCanvas(evt);
    drawMap();
  });
  map.addEventListener('mouseleave', function () {
    hover = null;
    drawMap();
  });

  document.querySelectorAll('input[name="speed"]').forEach(function (input) {
    input.addEventListener('change', function () {
      speed = parseInt(input.value, 10);
      update();
    });
  });

  var alt = document.getElementById('alt');
  if (alt) {
    alt.addEventListener('input', function () {
      altitude = parseInt(alt.value, 10);
      el.altOut.textContent = altitude + ' m';
      update();
    });
  }

  var undo = document.getElementById('undo');
  if (undo) undo.addEventListener('click', function () { route.pop(); update(); });
  var clear = document.getElementById('clear');
  if (clear) clear.addEventListener('click', function () { route = []; update(); });

  drawMap();
  update();

})();
