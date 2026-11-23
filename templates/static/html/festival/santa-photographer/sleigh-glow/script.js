/* ==========================================================================
   Sleigh Glow — interaction
   The light room draws a portrait on a canvas from four settings. No audio,
   no network: the drawing happens in the browser and stays there.
   ========================================================================== */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------------ nav */
  var toggle = document.querySelector('.top__toggle');
  var nav = document.getElementById('top-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus();
      }
    });
  }

  /* --------------------------------------------------------------- reveal */
  var rvs = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  if (rvs.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
      rvs.forEach(function (el) { io.observe(el); });
    } else {
      rvs.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* ------------------------------------------------------------ light room */
  var canvas = document.getElementById('portrait');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var W = canvas.width;
    var H = canvas.height;

    var state = {
      angle: 45, power: 70, fill: 30, temp: 4300, backdrop: 'cedar', preset: 'classic'
    };

    var BACKDROPS = {
      cedar: { label: 'CEDAR', top: '#2f3d30', bottom: '#16211a' },
      cream: { label: 'CREAM', top: '#d9c9a6', bottom: '#a08f6f' },
      berry: { label: 'CRANBERRY', top: '#5e2329', bottom: '#2c1215' }
    };

    var PRESETS = {
      classic: { angle: 45, power: 70, fill: 30, temp: 4300, backdrop: 'cedar', note: 'Studio classic: the key at forty-five degrees, a little fill from the right, and a cedar backdrop. It is the safest light in the room and the one most parents choose.' },
      candle: { angle: 340, power: 52, fill: 10, temp: 2900, backdrop: 'berry', note: 'Candlelight: one warm source, low and close, with almost no fill. The shadows go soft and brown and the beard turns the colour of cream. It flatters everyone and hides a tired parent.' },
      blue: { angle: 95, power: 42, fill: 58, temp: 6400, backdrop: 'cream', note: 'Blue hour: cool light from the window side, heavy fill, and a pale backdrop. Santa looks like he has just come in from outside, which is exactly the story.' },
      fire: { angle: 15, power: 92, fill: 18, temp: 3100, backdrop: 'cedar', note: 'Fireplace: a hard warm key from low and to the left, a deep shadow on the right, and a backdrop dark enough to lose the chair. Dramatic, and best for one adult or one very calm child.' }
    };

    var els = {
      angle: document.getElementById('key-angle'),
      power: document.getElementById('key-power'),
      fill: document.getElementById('fill'),
      temp: document.getElementById('warmth'),
      outAngle: document.getElementById('out-angle'),
      outPower: document.getElementById('out-power'),
      outFill: document.getElementById('out-fill'),
      outTemp: document.getElementById('out-temp'),
      outBd: document.getElementById('out-bd'),
      exposure: document.getElementById('ex-exposure'),
      exKey: document.getElementById('ex-key'),
      exFill: document.getElementById('ex-fill'),
      exWb: document.getElementById('ex-wb'),
      capSetup: document.getElementById('cap-setup'),
      capTemp: document.getElementById('cap-temp'),
      note: document.getElementById('room-note')
    };

    function tempColour(k) {
      // coarse black-body approximation, good enough for a lighting sketch
      var t = k / 100;
      var r, g, b;
      if (t <= 66) {
        r = 255;
        g = 99.47 * Math.log(t) - 161.12;
        b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04;
      } else {
        r = 329.7 * Math.pow(t - 60, -0.1332);
        g = 288.12 * Math.pow(t - 60, -0.0755);
        b = 255;
      }
      return [Math.max(0, Math.min(255, r)), Math.max(0, Math.min(255, g)), Math.max(0, Math.min(255, b))];
    }

    function roundAperture(power) {
      var stops = ['f/2', 'f/2.2', 'f/2.8', 'f/3.2', 'f/4', 'f/4.5', 'f/5.6', 'f/6.3', 'f/8'];
      var idx = Math.round((100 - power) / 100 * (stops.length - 1));
      return stops[Math.max(0, Math.min(stops.length - 1, idx))];
    }

    function roundShutter(power, fill) {
      var v = 60 + Math.round(power * 1.7 + fill * 0.3);
      var base = [60, 80, 100, 125, 160, 200, 250];
      var nearest = base.reduce(function (a, b) { return Math.abs(b - v) < Math.abs(a - v) ? b : a; });
      return '1/' + nearest;
    }

    function draw() {
      var bd = BACKDROPS[state.backdrop];
      var warm = tempColour(state.temp);

      // backdrop
      var bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, bd.top);
      bg.addColorStop(1, bd.bottom);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // backdrop falloff, an ellipse of light behind the chair
      var glow = ctx.createRadialGradient(320, 190, 30, 320, 210, 340);
      glow.addColorStop(0, 'rgba(255,238,205,0.16)');
      glow.addColorStop(1, 'rgba(255,238,205,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // floor
      ctx.fillStyle = 'rgba(8,12,10,0.35)';
      ctx.fillRect(0, 350, W, H - 350);
      var floorLight = ctx.createRadialGradient(320, 380, 10, 320, 390, 260);
      floorLight.addColorStop(0, 'rgba(255,225,180,0.10)');
      floorLight.addColorStop(1, 'rgba(255,225,180,0)');
      ctx.fillStyle = floorLight;
      ctx.fillRect(0, 340, W, H - 340);

      // chair
      ctx.fillStyle = '#3a2a1d';
      ctx.beginPath();
      ctx.moveTo(178, 430);
      ctx.lineTo(178, 168);
      ctx.quadraticCurveTo(320, 96, 462, 168);
      ctx.lineTo(462, 430);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // coat
      ctx.fillStyle = '#8e2f30';
      ctx.beginPath();
      ctx.moveTo(232, 236);
      ctx.quadraticCurveTo(320, 208, 408, 236);
      ctx.lineTo(446, 430);
      ctx.lineTo(194, 430);
      ctx.closePath();
      ctx.fill();

      // coat shading
      var coatShade = ctx.createLinearGradient(194, 0, 446, 0);
      coatShade.addColorStop(0, 'rgba(0,0,0,0.35)');
      coatShade.addColorStop(0.45, 'rgba(0,0,0,0)');
      coatShade.addColorStop(1, 'rgba(0,0,0,0.32)');
      ctx.fillStyle = coatShade;
      ctx.beginPath();
      ctx.moveTo(232, 236);
      ctx.quadraticCurveTo(320, 208, 408, 236);
      ctx.lineTo(446, 430);
      ctx.lineTo(194, 430);
      ctx.closePath();
      ctx.fill();

      // fur front
      ctx.fillStyle = '#f0ead9';
      ctx.beginPath();
      ctx.moveTo(300, 216);
      ctx.quadraticCurveTo(292, 300, 286, 430);
      ctx.lineTo(318, 430);
      ctx.quadraticCurveTo(322, 300, 330, 214);
      ctx.closePath();
      ctx.fill();

      // belt
      ctx.fillStyle = '#2b2018';
      ctx.fillRect(196, 330, 250, 30);
      ctx.fillStyle = '#c9a24c';
      ctx.fillRect(304, 330, 34, 30);
      ctx.fillStyle = '#2b2018';
      ctx.fillRect(312, 338, 18, 14);

      // head
      ctx.fillStyle = '#e3b28b';
      ctx.beginPath();
      ctx.ellipse(320, 172, 54, 62, 0, 0, Math.PI * 2);
      ctx.fill();

      // ears
      ctx.beginPath();
      ctx.ellipse(266, 178, 10, 14, 0, 0, Math.PI * 2);
      ctx.ellipse(374, 178, 10, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // hair at the sides
      ctx.fillStyle = '#efe9dc';
      ctx.beginPath();
      ctx.ellipse(270, 158, 16, 26, -0.2, 0, Math.PI * 2);
      ctx.ellipse(370, 158, 16, 26, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // beard
      ctx.fillStyle = '#f4efe4';
      ctx.beginPath();
      ctx.moveTo(268, 186);
      ctx.quadraticCurveTo(268, 250, 300, 296);
      ctx.quadraticCurveTo(320, 312, 340, 296);
      ctx.quadraticCurveTo(372, 250, 372, 186);
      ctx.quadraticCurveTo(350, 208, 320, 208);
      ctx.quadraticCurveTo(290, 208, 268, 186);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(180,170,150,0.5)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // moustache
      ctx.fillStyle = '#fbf7ec';
      ctx.beginPath();
      ctx.ellipse(300, 207, 20, 9, -0.16, 0, Math.PI * 2);
      ctx.ellipse(340, 207, 20, 9, 0.16, 0, Math.PI * 2);
      ctx.fill();

      // nose
      ctx.fillStyle = '#d79f79';
      ctx.beginPath();
      ctx.ellipse(320, 194, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // eyes and brows
      ctx.fillStyle = '#2c1e15';
      ctx.beginPath();
      ctx.ellipse(301, 168, 3.6, 4.2, 0, 0, Math.PI * 2);
      ctx.ellipse(339, 168, 3.6, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#efe9dc';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(291, 158); ctx.quadraticCurveTo(301, 152, 311, 157);
      ctx.moveTo(329, 157); ctx.quadraticCurveTo(339, 152, 349, 158);
      ctx.stroke();

      // cheeks
      ctx.fillStyle = 'rgba(186,96,80,0.22)';
      ctx.beginPath();
      ctx.ellipse(292, 190, 12, 8, 0, 0, Math.PI * 2);
      ctx.ellipse(348, 190, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // hat
      ctx.fillStyle = '#efe9dc';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(256, 112, 128, 26, 10) : ctx.rect(256, 112, 128, 26);
      ctx.fill();
      ctx.fillStyle = '#a8323a';
      ctx.beginPath();
      ctx.moveTo(274, 116);
      ctx.bezierCurveTo(282, 66, 330, 46, 368, 74);
      ctx.bezierCurveTo(346, 84, 336, 104, 366, 116);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#efe9dc';
      ctx.beginPath();
      ctx.arc(372, 76, 13, 0, Math.PI * 2);
      ctx.fill();

      // key light
      var rad = state.angle * Math.PI / 180;
      var kx = 320 + Math.cos(rad) * 190;
      var ky = 180 + Math.sin(rad) * 120;
      var power = state.power / 100;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      var key = ctx.createRadialGradient(kx, ky, 8, kx, ky, 300);
      key.addColorStop(0, 'rgba(255,229,186,' + (0.75 * power).toFixed(3) + ')');
      key.addColorStop(0.45, 'rgba(255,210,150,' + (0.28 * power).toFixed(3) + ')');
      key.addColorStop(1, 'rgba(255,190,120,0)');
      ctx.fillStyle = key;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // fill light, opposite side, cooler
      var fx = 320 - Math.cos(rad) * 150;
      var fy = 180 - Math.sin(rad) * 90;
      var fillAmt = state.fill / 100;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      var fill = ctx.createRadialGradient(fx, fy, 10, fx, fy, 280);
      fill.addColorStop(0, 'rgba(205,220,235,' + (0.30 * fillAmt).toFixed(3) + ')');
      fill.addColorStop(1, 'rgba(205,220,235,0)');
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // shadow side
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      var sx = 320 - Math.cos(rad) * 150;
      var sy = 180 - Math.sin(rad) * 100;
      var shadow = ctx.createRadialGradient(320, 190, 60, sx, sy, 320);
      shadow.addColorStop(0, 'rgba(255,255,255,0)');
      shadow.addColorStop(1, 'rgba(40,26,18,' + (0.5 * power).toFixed(3) + ')');
      ctx.fillStyle = shadow;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // colour temperature wash
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = 'rgba(' + Math.round(warm[0]) + ',' + Math.round(warm[1]) + ',' + Math.round(warm[2]) + ',0.20)';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // rim light along the key side of the head and shoulder
      ctx.save();
      ctx.strokeStyle = 'rgba(255,236,204,' + (0.55 * power).toFixed(2) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(320, 172, 58, rad - 1.1, rad + 1.1);
      ctx.stroke();
      ctx.restore();

      // vignette
      var vig = ctx.createRadialGradient(320, 200, 120, 320, 210, 400);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      // film grain, fixed seed so the grain does not flicker between settings
      var seed = 41;
      function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
      ctx.save();
      ctx.globalAlpha = 0.05;
      for (var i = 0; i < 1400; i++) {
        var gx = rnd() * W;
        var gy = rnd() * H;
        ctx.fillStyle = rnd() > 0.5 ? '#fff6e2' : '#0a0a08';
        ctx.fillRect(gx, gy, 1.4, 1.4);
      }
      ctx.restore();

      // readouts
      var angleText = angleLabel(state.angle);
      var aperture = roundAperture(state.power);
      var shutter = roundShutter(state.power, state.fill);
      els.outAngle.textContent = angleText;
      els.outPower.textContent = state.power + '%';
      els.outFill.textContent = state.fill + '%';
      els.outTemp.textContent = state.temp + ' K';
      els.outBd.textContent = bd.label;
      els.exposure.textContent = aperture + ' · ' + shutter + ' · ISO 400';
      els.exKey.textContent = angleText + ', ' + state.power + '%';
      els.exFill.textContent = state.fill + '% from camera ' + (state.angle > 180 ? 'left' : 'right');
      els.exWb.textContent = state.temp + ' K';
      els.capTemp.textContent = state.temp + ' K';

      var presetName = state.preset ? state.preset.toUpperCase() : 'CUSTOM';
      els.capSetup.textContent = presetName === 'CLASSIC' ? 'STUDIO CLASSIC' : presetName === 'BLUE' ? 'BLUE HOUR' : presetName;
      if (state.preset && PRESETS[state.preset]) els.note.textContent = PRESETS[state.preset].note;

      canvas.setAttribute('aria-label', 'A drawn portrait of Santa with the key light ' + angleText.toLowerCase() + ' at ' + state.power + ' percent, fill ' + state.fill + ' percent, ' + state.temp + ' kelvin, on a ' + bd.label.toLowerCase() + ' backdrop.');

      window.__lightState = { draws: (window.__lightState ? window.__lightState.draws : 0) + 1, settings: { angle: state.angle, power: state.power, fill: state.fill, temp: state.temp, backdrop: state.backdrop, preset: state.preset } };
    }

    function angleLabel(a) {
      if (a === 0) return '0° (front)';
      if (a === 180) return '180° (behind)';
      return a < 180 ? a + '° left' : (360 - a) + '° right';
    }

    var frame = null;
    function schedule() {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(function () { frame = null; draw(); });
    }

    function setPressed(attr, value) {
      Array.prototype.forEach.call(document.querySelectorAll('[' + attr + ']'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute(attr) === value ? 'true' : 'false');
      });
    }

    function applyPreset(key) {
      var p = PRESETS[key];
      if (!p) return;
      state.angle = p.angle; state.power = p.power; state.fill = p.fill; state.temp = p.temp; state.backdrop = p.backdrop; state.preset = key;
      els.angle.value = p.angle; els.power.value = p.power; els.fill.value = p.fill; els.temp.value = p.temp;
      setPressed('data-preset', key);
      setPressed('data-bd', p.backdrop);
      draw();
    }

    els.angle.addEventListener('input', function () { state.angle = Number(els.angle.value); state.preset = null; setPressed('data-preset', ''); schedule(); });
    els.power.addEventListener('input', function () { state.power = Number(els.power.value); state.preset = null; setPressed('data-preset', ''); schedule(); });
    els.fill.addEventListener('input', function () { state.fill = Number(els.fill.value); state.preset = null; setPressed('data-preset', ''); schedule(); });
    els.temp.addEventListener('input', function () { state.temp = Number(els.temp.value); state.preset = null; setPressed('data-preset', ''); schedule(); });

    Array.prototype.forEach.call(document.querySelectorAll('[data-preset]'), function (b) {
      b.addEventListener('click', function () { applyPreset(b.getAttribute('data-preset')); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-bd]'), function (b) {
      b.addEventListener('click', function () {
        state.backdrop = b.getAttribute('data-bd');
        state.preset = null;
        setPressed('data-bd', state.backdrop);
        setPressed('data-preset', '');
        draw();
      });
    });

    draw();
  }

  /* --------------------------------------------------------- contact form */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var success = document.getElementById('sent');
    var detail = document.getElementById('sent-detail');
    var ref = document.getElementById('sent-ref');
    var live = document.getElementById('form-status');

    var checks = [
      { id: 'n-name', test: function (v) { return v.trim().length >= 2; }, msg: 'Please give a name to answer.' },
      { id: 'n-email', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'That email address looks incomplete.' },
      { id: 'n-type', test: function (v) { return Boolean(v); }, msg: 'Choose a session.' },
      { id: 'n-date', test: function (v) { return Boolean(v); }, msg: 'Pick a date you would like, even if it changes.' },
      { id: 'n-message', test: function (v) { return v.trim().length >= 12; }, msg: 'Tell me who is coming and anything I should know.' }
    ];

    function wrapOf(el) { return el.closest('.field') || el.closest('.check'); }
    function setErr(el, msg) {
      var w = wrapOf(el);
      if (!w) return;
      w.classList.toggle('has-error', Boolean(msg));
      var e = w.querySelector('.err');
      if (e) e.textContent = msg || '';
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }

    checks.forEach(function (c) {
      var el = document.getElementById(c.id);
      if (!el) return;
      el.addEventListener('input', function () { if (wrapOf(el) && wrapOf(el).classList.contains('has-error')) setErr(el, ''); });
      el.addEventListener('change', function () { setErr(el, ''); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      var vals = {};
      checks.forEach(function (c) {
        var el = document.getElementById(c.id);
        if (!el) return;
        vals[c.id] = el.value;
        var ok = c.test(el.value);
        setErr(el, ok ? '' : c.msg);
        if (!ok && !bad) bad = el;
      });
      var agree = document.getElementById('n-agree');
      var agreeOk = agree && agree.checked;
      if (agree) {
        var w = agree.closest('.check');
        if (w) w.classList.toggle('has-error', !agreeOk);
        if (!agreeOk && !bad) bad = agree;
      }
      if (bad) {
        bad.focus();
        if (live) live.textContent = 'The request was not sent. Check the marked fields.';
        return;
      }
      var sel = document.getElementById('n-type');
      var type = sel && sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : 'session';
      var when = vals['n-date'] ? new Date(vals['n-date'] + 'T12:00:00') : null;
      var whenText = when && !isNaN(when) ? when.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'the date you gave';
      if (detail) {
        detail.textContent = 'Thank you, ' + vals['n-name'].trim().split(' ')[0] + '. I have your request for ' + type.toLowerCase() + ' on ' + whenText + '. I answer on Tuesdays and Thursdays, and I will tell you honestly if the date is already taken.';
      }
      if (ref) ref.textContent = 'Reference SG-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
      form.hidden = true;
      if (success) { success.hidden = false; success.focus(); }
      if (live) live.textContent = 'Request recorded on this page. No message has left the browser.';
    });
  }
})();
