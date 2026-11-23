/* Chestnut Table — host site behaviour
   Nav, planner, canopy dapples, season filters, form. No audio anywhere. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* year */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* nav */
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.nav a').forEach(function (link) {
      link.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* reveals */
  var reveals = document.querySelectorAll('.reveal');
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- chestnut leaves drifting ---------- */
  (function canopy() {
    var canvas = document.getElementById('canopy');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var leaves = [];

    function seed() {
      leaves = [];
      for (var i = 0; i < 14; i += 1) {
        leaves.push({
          x: Math.random(),
          y: Math.random(),
          size: 4 + Math.random() * 5,
          rot: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.5,
          fall: 0.02 + Math.random() * 0.03,
          phase: Math.random() * Math.PI * 2,
          alpha: 0.22 + Math.random() * 0.28,
          tone: Math.random() > 0.5 ? '85, 100, 63' : '110, 74, 40'
        });
      }
    }

    function resize() {
      var box = canvas.getBoundingClientRect();
      if (!box.width) return;
      w = box.width; h = box.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function leafPath(size) {
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.quadraticCurveTo(size * 0.62, -size * 0.16, 0, size);
      ctx.quadraticCurveTo(-size * 0.62, -size * 0.16, 0, -size);
      ctx.closePath();
    }

    function draw(t) {
      if (!ctx || !w) return;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < leaves.length; i += 1) {
        var leaf = leaves[i];
        var y = (leaf.y + t * leaf.fall) % 1.04;
        var x = leaf.x + Math.sin(t * 0.5 + leaf.phase) * 0.02;
        ctx.save();
        ctx.translate((((x % 1) + 1) % 1) * w, y * h);
        ctx.rotate(leaf.rot + t * leaf.spin);
        ctx.fillStyle = 'rgba(' + leaf.tone + ',' + leaf.alpha + ')';
        leafPath(leaf.size);
        ctx.fill();
        ctx.strokeStyle = 'rgba(42, 32, 24, .2)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(0, -leaf.size);
        ctx.lineTo(0, leaf.size);
        ctx.stroke();
        ctx.restore();
      }
      var gx = (0.7 + Math.sin(t * 0.004) * 0.05) * w;
      var gy = (0.3 + Math.cos(t * 0.0035) * 0.03) * h;
      var grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, w * 0.26);
      grad.addColorStop(0, 'rgba(255, 243, 214, 0.14)');
      grad.addColorStop(1, 'rgba(255, 243, 214, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    resize();
    seed();
    if (reduced) {
      draw(5);
    } else {
      var start = null;
      var frame = function (now) {
        if (start === null) start = now;
        draw((now - start) / 1000);
        window.requestAnimationFrame(frame);
      };
      window.requestAnimationFrame(frame);
    }
    window.addEventListener('resize', function () {
      resize();
      if (reduced) draw(5);
    });
  })();

  /* ---------- seat & stein planner ---------- */
  (function planner() {
    var form = document.getElementById('planner-form');
    var canvas = document.getElementById('table-canvas');
    if (!form || !canvas) return;
    var ctx = canvas.getContext('2d');
    var outSeats = document.querySelector('[data-out="seats"]');
    var outTable = document.querySelector('[data-out="table"]');
    var outSteins = document.querySelector('[data-out="steins"]');
    var outBrezn = document.querySelector('[data-out="brezn"]');
    var outTab = document.querySelector('[data-out="tab"]');
    var party = document.getElementById('party-size');
    var evening = document.getElementById('evening');
    var weather = document.getElementById('weather');
    var board = document.getElementById('board');

    var weatherFactor = { shade: 1, open: 1.12, tent: 1.04 };
    var boardAdd = { classic: 0, fish: 4.5, vegetarian: 2 };
    var LOGICAL_W = 720;
    var LOGICAL_H = 420;

    function euro(value) {
      return '€' + value.toFixed(0);
    }

    function compute() {
      var guests = parseInt(party.value, 10);
      var hours = parseInt(evening.value, 10);
      var factor = weatherFactor[weather.value] || 1;
      var steins = Math.round(guests * (hours + 0.6) * factor);
      var brezn = Math.ceil(guests * 1.2);
      var drinks = steins * 9.4;
      var food = guests * (16 + (boardAdd[board.value] || 0));
      var tab = Math.round((drinks + food) * 0.92);
      var perSide = Math.ceil(guests / 2);
      var length = perSide * 0.72 + 1;
      return { guests: guests, hours: hours, steins: steins, brezn: brezn, tab: tab, length: length, perSide: perSide };
    }

    window.__tableDraws = 0;

    function fit() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var box = canvas.getBoundingClientRect();
      var width = box.width || LOGICAL_W;
      canvas.width = Math.round(LOGICAL_W * dpr);
      canvas.height = Math.round(LOGICAL_H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return width;
    }

    function drawPlan(data) {
      if (!ctx) return;
      fit();
      var W = LOGICAL_W, H = LOGICAL_H;
      ctx.clearRect(0, 0, W, H);

      /* ground */
      ctx.fillStyle = '#f7f0e2';
      ctx.fillRect(0, 0, W, H);

      /* grass / gravel texture */
      ctx.fillStyle = 'rgba(85,100,63,0.10)';
      for (var i = 0; i < 90; i += 1) {
        var gx = ((i * 83) % W);
        var gy = ((i * 137) % H);
        ctx.fillRect(gx, gy, 2, 2);
      }

      /* shade under the chestnuts */
      if (weather.value === 'shade' || weather.value === 'tent') {
        ctx.fillStyle = weather.value === 'tent' ? 'rgba(31,76,140,0.08)' : 'rgba(85,100,63,0.13)';
        ctx.beginPath();
        ctx.ellipse(W * 0.5, H * 0.5, W * 0.46, H * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      var tableW = Math.min(560, 180 + data.length * 92);
      var tableH = 96;
      var cx = W / 2;
      var cy = H / 2;
      var left = cx - tableW / 2;
      var top = cy - tableH / 2;

      /* benches */
      ctx.fillStyle = '#c9b48f';
      ctx.fillRect(left - 6, top - 34, tableW + 12, 20);
      ctx.fillRect(left - 6, top + tableH + 14, tableW + 12, 20);
      ctx.strokeStyle = 'rgba(58,46,34,0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(left - 6, top - 34, tableW + 12, 20);
      ctx.strokeRect(left - 6, top + tableH + 14, tableW + 12, 20);

      /* table slab */
      ctx.fillStyle = '#8a5a33';
      ctx.fillRect(left, top, tableW, tableH);
      ctx.fillStyle = 'rgba(255,240,214,0.16)';
      ctx.fillRect(left, top, tableW, 7);
      ctx.strokeStyle = 'rgba(42,32,24,0.45)';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(left, top, tableW, tableH);

      /* plank lines */
      ctx.strokeStyle = 'rgba(42,32,24,0.16)';
      ctx.lineWidth = 1;
      for (var p = 1; p < 5; p += 1) {
        var px = left + (tableW / 5) * p;
        ctx.beginPath();
        ctx.moveTo(px, top);
        ctx.lineTo(px, top + tableH);
        ctx.stroke();
      }

      /* place settings: mugs on both benches */
      var totalSeats = data.perSide * 2;
      var seatIndex = 0;
      function mug(x, y, s) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(s, s);
        ctx.fillStyle = '#efe6d2';
        ctx.strokeStyle = 'rgba(42,32,24,0.35)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#d9bf87';
        ctx.beginPath();
        ctx.arc(0, 0, 5.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(42,32,24,0.3)';
        ctx.beginPath();
        ctx.arc(11, 0, 4, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        ctx.restore();
      }

      for (var side = 0; side < 2; side += 1) {
        for (var j = 0; j < data.perSide; j += 1) {
          if (seatIndex >= totalSeats) break;
          if (seatIndex >= data.guests) break;
          var fx = left + 28 + (tableW - 56) * (data.perSide === 1 ? 0.5 : j / (data.perSide - 1));
          var fy = side === 0 ? top - 24 : top + tableH + 24;
          mug(fx, fy, 1);
          seatIndex += 1;
        }
      }

      /* board in the middle */
      ctx.fillStyle = '#a5825a';
      ctx.strokeStyle = 'rgba(42,32,24,0.4)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.min(78, tableW * 0.22), 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#6f4526';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 10, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      /* measuring line */
      ctx.strokeStyle = 'rgba(42,32,24,0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, top + tableH + 62);
      ctx.lineTo(left + tableW, top + tableH + 62);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(left, top + tableH + 56);
      ctx.lineTo(left, top + tableH + 68);
      ctx.moveTo(left + tableW, top + tableH + 56);
      ctx.lineTo(left + tableW, top + tableH + 68);
      ctx.stroke();

      ctx.fillStyle = '#4c3d2e';
      ctx.font = '500 15px "Public Sans", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(data.length.toFixed(1) + ' m · ' + data.guests + ' seats', cx, top + tableH + 86);
      ctx.textAlign = 'left';

      ctx.fillStyle = '#6b5a48';
      ctx.font = '400 12px "Public Sans", Arial, sans-serif';
      ctx.fillText(weather.options[weather.selectedIndex].text, 18, 26);
      ctx.textAlign = 'right';
      ctx.fillText('top-down plan · not to scale', W - 18, 26);
      ctx.textAlign = 'left';

      window.__tableDraws += 1;
    }

    function update() {
      var data = compute();
      if (outSeats) outSeats.textContent = String(data.guests);
      if (outTable) outTable.textContent = data.guests + ' seats · ' + data.length.toFixed(1) + ' m';
      if (outSteins) outSteins.textContent = String(data.steins);
      if (outBrezn) outBrezn.textContent = String(data.brezn);
      if (outTab) outTab.textContent = euro(data.tab);
      drawPlan(data);
    }

    form.addEventListener('input', update);
    form.addEventListener('change', update);
    window.addEventListener('resize', function () {
      drawPlan(compute());
    });
    update();
  })();

  /* ---------- season filters ---------- */
  (function filters() {
    var buttons = document.querySelectorAll('.filters button');
    if (!buttons.length) return;
    var items = document.querySelectorAll('.season');
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var filter = button.getAttribute('data-filter');
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', b === button ? 'true' : 'false'); });
        items.forEach(function (item) {
          var match = filter === 'all' || item.getAttribute('data-kind') === filter;
          item.hidden = !match;
        });
        var status = document.getElementById('filter-status');
        var shown = document.querySelectorAll('.season:not([hidden])').length;
        if (status) status.textContent = shown + ' of ' + items.length + ' seasons shown';
      });
    });
  })();

  /* ---------- contact form ---------- */
  (function contact() {
    var form = document.getElementById('contact-form');
    if (!form) return;
    var note = document.getElementById('form-note');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var name = form.querySelector('#name');
      var email = form.querySelector('#email');
      var message = form.querySelector('#message');
      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        if (note) {
          note.textContent = 'One field is still open. A name, an email and a line about the evening will do.';
          note.hidden = false;
        }
        return;
      }
      if (note) {
        note.textContent = 'Danke, ' + name.value.trim().split(' ')[0] + '. Your note is with Liesl; she answers within a day, usually before the kettle boils.';
        note.hidden = false;
      }
      form.reset();
    });
  })();
})();
