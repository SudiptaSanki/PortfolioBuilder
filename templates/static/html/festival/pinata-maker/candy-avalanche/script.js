/* Candy Avalanche — piñata bench. Silent by design: no audio anywhere. */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var years = document.querySelectorAll('[data-year]');
  for (var y = 0; y < years.length; y++) years[y].textContent = new Date().getFullYear();

  var PALETTES = {
    fiesta: ['#d9552f', '#f2c14e', '#1d3f8f'],
    maguey: ['#1f6b4a', '#e8d9a8', '#c2521f'],
    rosa: ['#c2185b', '#f4a6b8', '#f7ead2'],
    noche: ['#23150f', '#6b4fa0', '#f2c14e']
  };

  var SHAPES = {
    burro: { rows: 24, candy: ['tamarind pods', 'mazapán', 'chocolate coins'], face: true },
    star: { rows: 22, candy: ['hard caramel', 'peanuts', 'orange slices'], face: false },
    pineapple: { rows: 26, candy: ['coconut candy', 'gummies', 'peanuts'], face: false },
    sun: { rows: 20, candy: ['lollipops', 'mazapán', 'jelly beans'], face: false }
  };

  var SIZE = {
    small: { label: '40 cm', factor: 0.7, drying: 2 },
    medium: { label: '70 cm', factor: 1, drying: 3 },
    large: { label: '1 m', factor: 1.35, drying: 4 }
  };

  var FRINGES_PER_ROW = 88;

  /* clipPaths are filled from the shape groups, because a clipPath cannot
     reliably resolve a <use> in every browser. */
  ['burro', 'star', 'pineapple', 'sun'].forEach(function (key) {
    var src = document.getElementById('shape-' + key);
    var clip = document.getElementById('clip-' + key);
    if (!src || !clip) return;
    clip.textContent = '';
    for (var i = 0; i < src.childNodes.length; i++) {
      clip.appendChild(src.childNodes[i].cloneNode(true));
    }
  });

  function paintFringes(layer, palette) {
    layer.textContent = '';
    var step = 9;
    var width = 6.2;
    var gap = 1.6;
    var row = 0;
    for (var yPos = 36; yPos < 342; yPos += step) {
      var colour = palette[row % palette.length];
      for (var xPos = -2; xPos < 362; xPos += width + gap) {
        var rect = document.createElementNS(NS, 'rect');
        rect.setAttribute('x', xPos.toFixed(1));
        rect.setAttribute('y', yPos.toFixed(1));
        rect.setAttribute('width', width);
        rect.setAttribute('height', step - 0.6);
        rect.setAttribute('fill', colour);
        layer.appendChild(rect);
      }
      row++;
    }
  }

  /* hero piñata: fixed so the first screen always has its object */
  var heroLayer = document.getElementById('heroFringeLayer');
  if (heroLayer) paintFringes(heroLayer, PALETTES.fiesta);

  var pinata = document.getElementById('pinata');
  var fringeLayer = document.getElementById('fringeLayer');
  var outlineLayer = document.getElementById('outlineLayer');
  var faceLayer = document.getElementById('faceLayer');
  var candyCanvas = document.getElementById('candy');
  var stageNote = document.getElementById('stageNote');
  var loot = document.getElementById('loot');
  var rowsOut = document.getElementById('rowsOut');
  var fringesOut = document.getElementById('fringesOut');
  var paperOut = document.getElementById('paperOut');
  var dryingOut = document.getElementById('dryingOut');
  var swingBtn = document.getElementById('swing');
  var repairBtn = document.getElementById('repair');

  var state = { body: 'burro', paper: 'fiesta', size: 'medium', broken: false };

  function checkedValue(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }

  function shapeLabel(v) {
    return v.charAt(0).toUpperCase() + v.slice(1);
  }

  function render() {
    if (!pinata) return;
    var palette = PALETTES[state.paper];
    paintFringes(fringeLayer, palette);
    fringeLayer.setAttribute('clip-path', 'url(#clip-' + state.body + ')');

    outlineLayer.textContent = '';
    var use = document.createElementNS(NS, 'use');
    use.setAttribute('href', '#shape-' + state.body);
    outlineLayer.appendChild(use);

    faceLayer.style.display = SHAPES[state.body].face ? '' : 'none';

    var rows = SHAPES[state.body].rows;
    var fringes = Math.round(rows * FRINGES_PER_ROW * SIZE[state.size].factor / 10) * 10;
    var sheets = Math.max(3, Math.round(fringes / 150));
    rowsOut.textContent = String(rows);
    fringesOut.textContent = fringes.toLocaleString('en-US');
    paperOut.textContent = sheets + ' sheets';
    dryingOut.textContent = SIZE[state.size].drying + ' days';
    pinata.setAttribute('aria-label', shapeLabel(state.body) + ' piñata, ' + SIZE[state.size].label + ', in ' + state.paper + ' paper');
    if (stageNote && !state.broken) {
      stageNote.textContent = rows + ' rows of fringe, ' + SIZE[state.size].label + ' across. Hold the rope, not the head.';
    }
  }

  ['body', 'paper', 'size'].forEach(function (name) {
    var inputs = document.querySelectorAll('input[name="' + name + '"]');
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].addEventListener('change', function () {
        state[name] = this.value;
        state.broken = false;
        stopParticles();
        if (pinata) pinata.style.transform = '';
        render();
        if (loot) loot.textContent = 'Fresh off the rack. Nothing broken yet.';
      });
    }
  });

  /* ---------- candy avalanche ---------- */

  var ctx = null;
  var particles = [];
  var raf = 0;
  var dpr = 1;

  function sizeCanvas() {
    if (!candyCanvas) return;
    var rect = candyCanvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    candyCanvas.width = Math.max(1, Math.round(rect.width * dpr));
    candyCanvas.height = Math.max(1, Math.round(rect.height * dpr));
  }

  function burst() {
    if (!candyCanvas) return;
    sizeCanvas();
    ctx = candyCanvas.getContext('2d');
    var palette = PALETTES[state.paper].concat(['#f7ead2', '#f2c14e']);
    var w = candyCanvas.width;
    var h = candyCanvas.height;
    particles = [];
    var count = 110;
    for (var i = 0; i < count; i++) {
      var angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      var speed = (0.5 + Math.random() * 1.8) * (w / 620);
      particles.push({
        x: w * 0.5 + (Math.random() - 0.5) * w * 0.18,
        y: h * 0.45 + (Math.random() - 0.5) * h * 0.1,
        vx: Math.cos(angle) * speed * 3.2,
        vy: Math.sin(angle) * speed * 2.4 - h * 0.006,
        size: (3 + Math.random() * 6) * dpr,
        colour: palette[Math.floor(Math.random() * palette.length)],
        spin: (Math.random() - 0.5) * 0.3,
        rot: Math.random() * Math.PI,
        life: 1,
      });
    }

    var gravity = h * 0.0016;
    var start = performance.now();

    function frame(now) {
      var dt = Math.min(3, (now - start) / 16);
      start = now;
      ctx.clearRect(0, 0, w, h);
      var alive = false;
      for (var p = 0; p < particles.length; p++) {
        var particle = particles[p];
        if (particle.life <= 0) continue;
        particle.vy += gravity * dt;
        particle.vx *= 0.995;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.rot += particle.spin * dt;
        if (particle.y > h + 30) { particle.life = 0; continue; }
        alive = true;
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rot);
        ctx.globalAlpha = 0.95 * particle.life;
        ctx.fillStyle = particle.colour;
        if (p % 3 === 0) {
          ctx.beginPath();
          ctx.arc(0, 0, particle.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-particle.size / 2, -particle.size / 3, particle.size, particle.size * 0.66);
        }
        ctx.restore();
      }
      if (alive) {
        raf = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, w, h);
        raf = 0;
      }
    }
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function stopParticles() {
    cancelAnimationFrame(raf);
    raf = 0;
    if (ctx && candyCanvas) ctx.clearRect(0, 0, candyCanvas.width, candyCanvas.height);
  }

  function swing() {
    if (!pinata || state.broken) return;
    state.broken = true;
    sizeCanvas();
    pinata.style.transition = 'transform 0.45s cubic-bezier(.3,.7,.4,1)';
    pinata.style.transformOrigin = '50% 88%';
    pinata.style.transform = 'rotate(-5deg) translateY(4px)';
    burst();
    var rows = SHAPES[state.body].rows;
    var fringes = Math.round(rows * FRINGES_PER_ROW * SIZE[state.size].factor / 10) * 10;
    var candy = SHAPES[state.body].candy.join(', ');
    loot.textContent = 'One swing, ' + fringes.toLocaleString('en-US') + ' fringes gone. On the ground: ' + candy + '.';
    if (stageNote) stageNote.textContent = 'Broken, as intended. Repair it if you want a second party.';
  }

  function repair() {
    if (!pinata) return;
    state.broken = false;
    pinata.style.transform = '';
    stopParticles();
    render();
    if (loot) loot.textContent = 'Repaired with paste and a new flap. Ready for another swing.';
  }

  if (swingBtn) swingBtn.addEventListener('click', swing);
  if (repairBtn) repairBtn.addEventListener('click', repair);
  if (pinata) {
    pinata.addEventListener('click', function () { if (!state.broken) swing(); });
  }
  window.addEventListener('resize', function () {
    if (!state.broken) { sizeCanvas(); }
  });

  if (pinata) { render(); sizeCanvas(); }

  /* ---------- commission form ---------- */
  var form = document.getElementById('order-form');
  if (form) {
    var status = document.getElementById('form-status');
    var date = form.querySelector('#date');
    if (date) {
      var today = new Date();
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      date.min = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
    }
    form.addEventListener('submit', function (evt) {
      evt.preventDefault();
      var name = form.querySelector('#name');
      var email = form.querySelector('#email');
      var kind = form.querySelector('#kind');
      var when = form.querySelector('#date');
      var qty = form.querySelector('#qty');
      var note = form.querySelector('#note');
      var missing = [];
      if (!name.value.trim()) missing.push('a name');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) missing.push('an email');
      if (!kind.value) missing.push('the occasion');
      if (!when.value) missing.push('a date');
      if (!qty.value || Number(qty.value) < 1) missing.push('how many piñatas');
      if (note.value.trim().length < 8) missing.push('the shape and colours');
      status.hidden = false;
      if (missing.length) {
        status.textContent = 'Still needed: ' + missing.join(', ') + '.';
        status.style.color = '#b8431f';
        return;
      }
      status.style.color = '';
      status.textContent = 'Order noted: ' + qty.value + ' piñata' + (Number(qty.value) > 1 ? 's' : '') + ' for ' + when.value + '. I confirm the rack space within two days.';
      form.reset();
    });
  }
})();
