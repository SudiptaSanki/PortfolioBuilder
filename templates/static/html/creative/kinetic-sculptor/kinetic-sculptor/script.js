/* Brandt Kinetic — interactions.
   No audio anywhere: sculpture is not a sound profession, and the
   stub's ambient canvas synth failed the owner's sound need-test.
   Motion on this site has exactly two jobs: the page fade, and the
   balance explorer — which stays still until a visitor starts it. */
document.documentElement.classList.add('js');

/* Cross-document view transitions abort legitimately (slow first
   paint, viewport change, rotation). Chrome reports that abort as an
   unhandled rejection; swallow only that exact reason so the console
   stays truthful about everything else. */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* ---------- mobile nav: the panel drops from the beam ---------- */
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var panel = document.getElementById('mobile-panel');
  if (!toggle || !panel) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var open = false, closeTimer = null;

  function show() {
    panel.hidden = false;
    panel.classList.remove('closing');
    panel.classList.add('open');
  }
  function hide() {
    panel.classList.remove('open');
    panel.hidden = true;
    document.body.classList.remove('nav-locked');
  }
  function setNav(state, moveFocus) {
    open = state;
    toggle.setAttribute('aria-expanded', String(open));
    window.clearTimeout(closeTimer);
    if (open) {
      show();
      document.body.classList.add('nav-locked');
      if (moveFocus !== false) {
        var first = panel.querySelector('a');
        if (first) first.focus();
      }
    } else if (reduce) {
      hide();
    } else {
      panel.classList.add('closing');
      document.body.classList.remove('nav-locked');
      closeTimer = window.setTimeout(hide, 210);
    }
    if (!open && moveFocus) toggle.focus();
  }
  toggle.addEventListener('click', function () { setNav(!open); });
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) setNav(false, false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) setNav(false, true);
  });
  window.addEventListener('resize', function () {
    if (open && window.innerWidth > 820) setNav(false, false);
  });
})();

/* ---------- the balance explorer ----------
   A diagram of Counterpoise No. 4's main arm, drawn at 1:10.
   Torque = weight x arm. Tilt is the net torque drawn at
   40 kg·cm per degree, clamped at the arm's real 14° of travel. */
(function () {
  var root = document.getElementById('explorer');
  if (!root) return;

  var TOTAL = 240;               /* beam length, cm */
  var S = 1.25;                  /* svg px per cm */
  var CX = 360, BEAM_Y = 118;    /* fulcrum point in the viewBox */
  var state = { wL: 3.0, wR: 2.0, armL: 96 };
  var tilt = 0, sway = 0, swaying = false, raf = null;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var dyn = document.getElementById('dyn');
  var el = {
    wL: document.getElementById('val-wl'),
    wR: document.getElementById('val-wr'),
    armL: document.getElementById('val-arml'),
    armR: document.getElementById('val-armr'),
    torqueL: document.getElementById('ro-torque-l'),
    torqueR: document.getElementById('ro-torque-r'),
    net: document.getElementById('ro-net'),
    tilt: document.getElementById('ro-tilt'),
    state: document.getElementById('ro-state'),
    balance: document.getElementById('ro-balance'),
    note: document.getElementById('ro-note'),
    slider: document.getElementById('fulcrum'),
    swayBtn: document.getElementById('sway-btn'),
    swayNote: document.getElementById('sway-note')
  };

  function fmt(n, d) { return n.toFixed(d === undefined ? 0 : d); }

  function petal(x, y, rot, len) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + len + '" ry="9" ' +
      'transform="rotate(' + rot + ' ' + x + ' ' + y + ')" ' +
      'fill="none" stroke="#a35a1e" stroke-width="2.5"/>';
  }

  function build() {
    var armR = TOTAL - state.armL;
    var xL = CX - state.armL * S;
    var xR = CX + armR * S;
    var rL = 9 + state.wL * 2.4;         /* counterweight disc, left */
    var rR1 = 8 + state.wR * 1.5;        /* sub-beam discs split the right weight */
    var rR2 = 8 + state.wR * 0.9;
    var html = '';

    /* beam + hangers, one rotating group around the fulcrum */
    html += '<g id="beamGroup">';
    html += '<line x1="' + xL + '" y1="' + BEAM_Y + '" x2="' + xR + '" y2="' + BEAM_Y + '" stroke="#20242a" stroke-width="5"/>';
    html += '<line x1="' + xL + '" y1="' + (BEAM_Y - 9) + '" x2="' + xL + '" y2="' + (BEAM_Y + 9) + '" stroke="#20242a" stroke-width="3"/>';
    html += '<line x1="' + xR + '" y1="' + (BEAM_Y - 9) + '" x2="' + xR + '" y2="' + (BEAM_Y + 9) + '" stroke="#20242a" stroke-width="3"/>';

    /* left hanger: wire, vane cluster, counterweight disc */
    html += '<g id="hangerL">';
    html += '<line x1="' + xL + '" y1="' + BEAM_Y + '" x2="' + xL + '" y2="196" stroke="#454a52" stroke-width="1.6"/>';
    html += petal(xL, 214, -28, 30) + petal(xL, 214, 28, 30) + petal(xL, 206, 90, 24);
    html += '<line x1="' + xL + '" y1="228" x2="' + xL + '" y2="' + (252 - rL) + '" stroke="#454a52" stroke-width="1.6"/>';
    html += '<circle cx="' + xL + '" cy="252" r="' + rL + '" fill="#20242a"/>';
    html += '<text x="' + xL + '" y="' + (252 + rL + 20) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" fill="#454a52">LEFT CLUSTER ' + fmt(state.wL, 1) + ' KG</text>';
    html += '</g>';

    /* right hanger: wire, sub-beam, two discs */
    var subY = 168;
    html += '<g id="hangerR">';
    html += '<line x1="' + xR + '" y1="' + BEAM_Y + '" x2="' + xR + '" y2="' + subY + '" stroke="#454a52" stroke-width="1.6"/>';
    html += '<line x1="' + (xR - 58) + '" y1="' + subY + '" x2="' + (xR + 58) + '" y2="' + subY + '" stroke="#20242a" stroke-width="3.5"/>';
    html += '<line x1="' + (xR - 58) + '" y1="' + subY + '" x2="' + (xR - 58) + '" y2="' + (206 - rR1) + '" stroke="#454a52" stroke-width="1.4"/>';
    html += '<line x1="' + (xR + 58) + '" y1="' + subY + '" x2="' + (xR + 58) + '" y2="' + (206 - rR2) + '" stroke="#454a52" stroke-width="1.4"/>';
    html += '<circle cx="' + (xR - 58) + '" cy="206" r="' + rR1 + '" fill="#a35a1e"/>';
    html += '<circle cx="' + (xR + 58) + '" cy="206" r="' + rR2 + '" fill="#20242a"/>';
    html += '<text x="' + xR + '" y="' + (206 + Math.max(rR1, rR2) + 20) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" fill="#454a52">RIGHT CLUSTER ' + fmt(state.wR, 1) + ' KG</text>';
    html += '</g>';
    html += '</g>';

    /* dimension line under the drawing */
    var dy = 336;
    html += '<line x1="' + xL + '" y1="' + (dy - 6) + '" x2="' + xL + '" y2="' + (dy + 14) + '" stroke="#8a8271" stroke-width="1"/>';
    html += '<line x1="' + CX + '" y1="' + (dy - 6) + '" x2="' + CX + '" y2="' + (dy + 14) + '" stroke="#8a8271" stroke-width="1"/>';
    html += '<line x1="' + xR + '" y1="' + (dy - 6) + '" x2="' + xR + '" y2="' + (dy + 14) + '" stroke="#8a8271" stroke-width="1"/>';
    html += '<line x1="' + xL + '" y1="' + dy + '" x2="' + xR + '" y2="' + dy + '" stroke="#8a8271" stroke-width="1"/>';
    html += '<text x="' + ((xL + CX) / 2) + '" y="' + (dy - 8) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" fill="#7e4212">' + state.armL + ' CM</text>';
    html += '<text x="' + ((CX + xR) / 2) + '" y="' + (dy - 8) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" fill="#7e4212">' + armR + ' CM</text>';
    html += '<text x="' + CX + '" y="' + (dy + 36) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="12" fill="#6a675c">SPAN 240 CM · FULCRUM MARKED ▲ · DRAWN 1:10, SIMPLIFIED</text>';

    dyn.innerHTML = html;
    applyTilt();
  }

  function applyTilt() {
    var g = document.getElementById('beamGroup');
    if (!g) return;
    var a = tilt + sway;
    var armR = TOTAL - state.armL;
    var xL = CX - state.armL * S;
    var xR = CX + armR * S;
    g.setAttribute('transform', 'rotate(' + a + ' ' + CX + ' ' + BEAM_Y + ')');
    /* hangers counter-rotate about their own attach points so the
       clusters stay vertical, as they would on the real arm */
    var hL = document.getElementById('hangerL');
    var hR = document.getElementById('hangerR');
    if (hL) hL.setAttribute('transform', 'rotate(' + (-a) + ' ' + xL + ' ' + BEAM_Y + ')');
    if (hR) hR.setAttribute('transform', 'rotate(' + (-a) + ' ' + xR + ' ' + BEAM_Y + ')');
  }

  function noteFor(net, t) {
    if (Math.abs(net) <= 6) {
      return 'In balance. The arm floats level and a 0.4 m/s air current — a door opening two rooms away — is enough to turn it. This is the state the piece is installed in, and the state its bearings are rated for.';
    }
    if (Math.abs(t) >= 13.5) {
      return 'Hard over. Tilt is clamped at 14°, the arm\u2019s full travel: the piece would sit on its stop permanently, the vanes would stall, and the bearing would flat-spot within a season. Nobody installs a mobile like this twice.';
    }
    var side = net < 0 ? 'left' : 'right';
    return (side === 'left' ? 'Left' : 'Right') + '-heavy. The ' + side + ' cluster wins by ' + fmt(Math.abs(net)) +
      ' kg·cm and the arm settles ' + fmt(Math.abs(t), 1) + '° down on that side. On the real piece it would rest against its lower stop and barely turn — balance is not a nicety on a mobile, it is the mechanism.';
  }

  function update() {
    var armR = TOTAL - state.armL;
    var tL = state.wL * state.armL;
    var tR = state.wR * armR;
    var net = tR - tL;
    tilt = Math.max(-14, Math.min(14, net / 40));
    var balanceAt = Math.round(TOTAL * state.wR / (state.wL + state.wR));

    el.wL.firstChild.textContent = fmt(state.wL, 1);
    el.wR.firstChild.textContent = fmt(state.wR, 1);
    el.armL.textContent = state.armL + ' cm';
    el.armR.textContent = armR + ' cm';
    el.torqueL.textContent = fmt(tL) + ' kg·cm';
    el.torqueR.textContent = fmt(tR) + ' kg·cm';
    el.net.textContent = (net > 0 ? '+' : '') + fmt(net) + ' kg·cm';
    el.tilt.textContent = fmt(tilt, 1) + '°';
    el.state.textContent = Math.abs(net) <= 6 ? 'IN BALANCE' : (net < 0 ? 'LEFT-HEAVY' : 'RIGHT-HEAVY');
    el.balance.textContent = balanceAt + ' cm from left';
    el.note.textContent = noteFor(net, tilt);
    build();
    syncControls();
  }

  function syncControls() {
    root.querySelectorAll('[data-step]').forEach(function (b) {
      var target = b.getAttribute('data-step');
      var dir = Number(b.getAttribute('data-dir'));
      var v = target === 'wl' ? state.wL : state.wR;
      b.disabled = dir < 0 ? v <= 1.0 : v >= 6.0;
    });
    el.slider.value = state.armL;
  }

  root.querySelectorAll('[data-step]').forEach(function (b) {
    b.addEventListener('click', function () {
      var target = b.getAttribute('data-step');
      var dir = Number(b.getAttribute('data-dir'));
      if (target === 'wl') state.wL = Math.round((state.wL + dir * 0.5) * 10) / 10;
      else state.wR = Math.round((state.wR + dir * 0.5) * 10) / 10;
      state.wL = Math.min(6, Math.max(1, state.wL));
      state.wR = Math.min(6, Math.max(1, state.wR));
      update();
    });
  });
  el.slider.addEventListener('input', function () {
    state.armL = Number(el.slider.value);
    update();
  });

  /* the sway: visitor-started only, off under reduced motion */
  function tick(ts) {
    if (!swaying) return;
    sway = Math.sin(ts / 1500) * 1.2;
    applyTilt();
    raf = window.requestAnimationFrame(tick);
  }
  if (reduce) {
    el.swayBtn.disabled = true;
    el.swayBtn.textContent = 'Sway unavailable';
    el.swayNote.textContent = 'Your system is set to reduced motion, so the piece stays still — the diagram and the numbers are the whole instrument.';
  } else {
    el.swayBtn.addEventListener('click', function () {
      swaying = !swaying;
      el.swayBtn.setAttribute('aria-pressed', String(swaying));
      el.swayBtn.textContent = swaying ? 'Still the piece' : 'Start the sway';
      if (swaying) {
        raf = window.requestAnimationFrame(tick);
      } else {
        window.cancelAnimationFrame(raf);
        sway = 0;
        applyTilt();
      }
    });
  }

  update();
})();

/* ---------- enquiry form: validation + honest in-page confirmation ---------- */
(function () {
  var form = document.getElementById('enquiry-form');
  if (!form) return;
  var done = document.getElementById('confirmation');
  function field(name) { return form.querySelector('[name="' + name + '"]'); }
  function setInvalid(input, bad) {
    var wrap = input.closest('.field');
    if (wrap) {
      wrap.classList.toggle('invalid', bad);
      var err = wrap.querySelector('.err');
      if (err) err.classList.toggle('show', bad);
    }
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    return !bad;
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  function validate() {
    var ok = true, firstBad = null;
    var name = field('name'), email = field('email'),
        site = field('sitetype'), message = field('message');
    [[name, name.value.trim().length >= 2],
     [email, validEmail(email.value.trim())],
     [site, site.value !== ''],
     [message, message.value.trim().length >= 10]
    ].forEach(function (pair) {
      var good = setInvalid(pair[0], !pair[1]);
      if (!good) { ok = false; if (!firstBad) firstBad = pair[0]; }
    });
    if (firstBad) firstBad.focus();
    return ok;
  }
  ['name', 'email', 'sitetype', 'message'].forEach(function (n) {
    var input = field(n);
    if (input) {
      input.addEventListener('input', function () { setInvalid(input, false); });
      input.addEventListener('change', function () { setInvalid(input, false); });
    }
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;
    var ref = 'EB-2026-' + Math.floor(100 + Math.random() * 900);
    done.querySelector('.ref').textContent = 'Reference ' + ref;
    done.querySelector('.sum').textContent =
      'Thank you, ' + field('name').value.trim().split(' ')[0] + '. Your enquiry about a ' +
      field('sitetype').value + ' piece has been noted on this page. ' +
      'This demonstration form sends and stores nothing — to reach the studio for real, ' +
      'email studio@brandtkinetic.example and quote the reference above.';
    form.style.display = 'none';
    done.classList.add('show');
    done.setAttribute('tabindex', '-1');
    done.focus();
  });
  var again = document.getElementById('send-another');
  if (again) again.addEventListener('click', function () {
    form.reset();
    form.style.display = '';
    done.classList.remove('show');
    field('name').focus();
  });
})();
