/* ============================================================
   CRANE ARCADE SYSTEMS — retro-arcade-gamedev
   Sound ruling: ONE exception, tightly fenced. The Input Test
   toy may play a single short blip on a hit — only after the
   visitor switches SOUND on (that switch is the prompt), only
   on a hit, synthesised, fixed low gain (0.12), self-stopping
   in 0.13 s. That is the frequency-room pattern, and it is the
   only AudioContext this site ever creates. Everything else is
   silent by design; the stub's bouncing-canvas fake game and
   its invented "SCORE: 999900" were removed, not rebuilt.
   ============================================================ */
(function () {
  'use strict';

  /* Cross-document view transitions abort harmlessly when a second
     navigation interrupts the first; Chrome surfaces that abort as
     an unhandled rejection. Swallow only that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gbp = function (n) { return '£' + n.toLocaleString('en-GB'); };
  var ms2 = function (n) { return n.toFixed(2); };

  /* ---------- test-mode mobile panel ---------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('testPanel');
  var scrim = document.getElementById('scrim');
  if (btn && panel && scrim) {
    var closePanel = function () {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-expanded', 'false');
      scrim.classList.remove('on');
      window.setTimeout(function () { scrim.hidden = true; }, reduced ? 0 : 260);
      btn.focus({ preventScroll: true });
    };
    btn.addEventListener('click', function () {
      var willOpen = !panel.classList.contains('open');
      if (willOpen) {
        scrim.hidden = false;
        /* focus inside rAF, after .open lands — focusing while the
           panel is still off-canvas is a silent no-op */
        panel.classList.add('open');
        panel.setAttribute('aria-hidden', 'false');
        btn.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(function () {
          void scrim.offsetWidth;
          scrim.classList.add('on');
          var first = panel.querySelector('nav a');
          if (first) first.focus({ preventScroll: true });
        });
      } else {
        closePanel();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });
    scrim.addEventListener('click', closePanel);
    panel.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) closePanel();
    });
  }

  /* ---------- reveal (opacity only, JS-gated) ---------- */
  var revs = document.querySelectorAll('.rev');
  if (revs.length && !reduced && 'IntersectionObserver' in window) {
    revs.forEach(function (el) { el.classList.add('rev-pre'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.remove('rev-pre');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    revs.forEach(function (el) { io.observe(el); });
  }

  /* ==========================================================
     TEST 01 — THE FRAME BUDGET TOOL
     Reads every cost from Table S1's DOM rows (data-ms), so the
     tool and the printed sheet cannot disagree.
     ========================================================== */
  var sysTable = document.getElementById('sysTable');
  if (sysTable) {
    var rows = Array.prototype.slice.call(sysTable.querySelectorAll('tbody tr'));
    var systems = rows.map(function (tr) {
      return {
        tr: tr,
        name: tr.getAttribute('data-name'),
        ms: parseFloat(tr.getAttribute('data-ms')),
        dip: tr.querySelector('.dip')
      };
    });
    var line = 16.67;
    var work = document.getElementById('frameWork');
    var verdict = document.getElementById('frameVerdict');
    var stamp = document.getElementById('frameStamp');
    var vtext = document.getElementById('frameVerdictText');
    var fill = document.getElementById('frameFill');
    var barEl = document.getElementById('frameBar');
    var lineEl = document.getElementById('frameLine');
    var lineLab = document.getElementById('frameLineLab');
    var scaleLab = document.getElementById('frameScaleLab');

    var renderFrame = function () {
      var total = 0, run = 0, lines = [], biggest = null;
      systems.forEach(function (s) {
        var on = s.dip.getAttribute('aria-pressed') === 'true';
        s.tr.classList.toggle('sel', on);
        if (on) {
          run += s.ms; total = run;
          lines.push(s.name + '  ' + ms2(s.ms) + ' ms   = ' + ms2(run));
          if (!biggest || s.ms > biggest.ms) biggest = s;
        } else {
          lines.push('<span class="dim">' + s.name + '  OFF</span>');
        }
      });
      var scale = line === 16.67 ? 20 : 40;
      var diff = line - total;
      lines.push('----------------------------------------');
      lines.push('TOTAL  ' + ms2(total) + ' ms   ·   LINE (' + (line === 16.67 ? '60' : '30') + ' FPS)  ' + ms2(line) + ' ms');
      lines.push(diff >= 0 ? 'HEADROOM  ' + ms2(diff) + ' ms' : 'OVER THE LINE BY  ' + ms2(-diff) + ' ms');
      work.innerHTML = lines.join('\n');
      fill.style.width = Math.min(100, total / scale * 100) + '%';
      lineEl.style.left = (line / scale * 100) + '%';
      lineLab.textContent = 'frame line ' + ms2(line) + ' ms';
      scaleLab.textContent = 'scale ' + scale + ' ms';
      barEl.classList.toggle('bad', diff < 0);
      if (diff >= 0) {
        verdict.classList.remove('bad');
        stamp.textContent = 'Fits';
        vtext.textContent = 'Total ' + ms2(total) + ' ms against the ' + ms2(line) + ' ms line — ' + ms2(diff) + ' ms of headroom. ' +
          (line === 16.67
            ? 'This is the configuration Bullet Garden shipped in. Headroom is not waste; it is where the worst wave lives.'
            : 'It fits at 30 fps — at half the frame rate and half the responsiveness. This budget was written for 60, and the sheet declines to pretend otherwise.');
      } else {
        verdict.classList.add('bad');
        stamp.textContent = 'Blown';
        vtext.textContent = 'Total ' + ms2(total) + ' ms against the ' + ms2(line) + ' ms line — over by ' + ms2(-diff) + ' ms, every frame, forever. ' +
          'First optimisation candidate: ' + (biggest ? biggest.name + ' at ' + ms2(biggest.ms) + ' ms' : '—') + ', the most expensive system switched on. ' +
          'This is exactly the state the Switch build was in before the CRT pass was cut.';
      }
    };
    systems.forEach(function (s) {
      s.dip.addEventListener('click', function () {
        var on = s.dip.getAttribute('aria-pressed') === 'true';
        s.dip.setAttribute('aria-pressed', on ? 'false' : 'true');
        s.dip.lastChild.textContent = on ? 'OFF' : 'ON';
        renderFrame();
      });
    });
    var f60 = document.getElementById('fps60'), f30 = document.getElementById('fps30');
    var setFps = function (toSixty) {
      line = toSixty ? 16.67 : 33.33;
      f60.setAttribute('aria-pressed', toSixty ? 'true' : 'false');
      f30.setAttribute('aria-pressed', toSixty ? 'false' : 'true');
      renderFrame();
    };
    f60.addEventListener('click', function () { setFps(true); });
    f30.addEventListener('click', function () { setFps(false); });
    renderFrame();
  }

  /* ==========================================================
     TEST 02 — THE INPUT TEST TOY
     A marker sweeps the track (1,600 ms one-way). Stop it in the
     zone (63–73%). Readouts are in ms of sweep, the honest unit.
     Sound: created lazily, only when the visitor switches it on.
     ========================================================== */
  var marker = document.getElementById('toyMarker');
  if (marker) {
    var ZC = 68, ZLO = 63, ZHI = 73, SWEEP = 1600;
    var zone = document.getElementById('toyZone');
    zone.style.left = ZLO + '%';
    zone.style.width = (ZHI - ZLO) + '%';
    var resultEl = document.getElementById('toyResult');
    var offEl = document.getElementById('toyOff');
    var attEl = document.getElementById('toyAttempts');
    var hitEl = document.getElementById('toyHits');
    var pos = 0, dir = 1, running = true, attempts = 0, hits = 0;
    var lastTs = null, accum = 0, raf = null;
    var audioCtx = null, soundOn = false;

    var draw = function () {
      marker.style.left = 'calc(' + pos.toFixed(2) + '% - 4px)';
    };
    var tick = function (ts) {
      if (!running) return;
      if (lastTs === null) lastTs = ts;
      var dt = ts - lastTs;
      lastTs = ts;
      if (reduced) {
        accum += dt;
        if (accum >= 150) {
          pos += dir * (100 / (SWEEP / 150));
          accum = 0;
        }
      } else {
        pos += dir * (dt / SWEEP * 100);
      }
      if (pos >= 100) { pos = 100; dir = -1; }
      if (pos <= 0) { pos = 0; dir = 1; }
      draw();
      raf = requestAnimationFrame(tick);
    };
    var start = function () {
      if (running) return;
      running = true;
      lastTs = null;
      raf = requestAnimationFrame(tick);
    };
    var blip = function () {
      if (!soundOn || !audioCtx) return;
      var t = audioCtx.currentTime;
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(920, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    };
    document.getElementById('toyStop').addEventListener('click', function () {
      if (!running) return;
      running = false;
      if (raf) cancelAnimationFrame(raf);
      attempts += 1;
      var offMs = Math.round(Math.abs(pos - ZC) / 100 * SWEEP);
      var hit = pos >= ZLO && pos <= ZHI;
      if (hit) { hits += 1; blip(); }
      resultEl.textContent = hit ? 'IN THE ZONE' : 'MISS';
      offEl.textContent = offMs + ' ms';
      attEl.textContent = attempts;
      hitEl.textContent = hits;
    });
    document.getElementById('toyRestart').addEventListener('click', function () {
      resultEl.textContent = 'RUNNING';
      offEl.textContent = '—';
      start();
    });
    var sndBtn = document.getElementById('toySound');
    sndBtn.addEventListener('click', function () {
      soundOn = !(sndBtn.getAttribute('aria-pressed') === 'true');
      sndBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
      sndBtn.textContent = soundOn ? 'Sound: On' : 'Sound: Off';
      if (soundOn && !audioCtx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) audioCtx = new AC();
      }
      if (soundOn && audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    });
    draw();
    raf = requestAnimationFrame(tick);
  }

  /* ==========================================================
     BOOKKEEPING — THE ESTIMATOR
     Rates are parsed from the printed Table F1 in the DOM
     (data-key rows), so estimator and rate card cannot disagree.
     ========================================================== */
  var feeTable = document.getElementById('feeTable');
  if (feeTable) {
    var rates = {};
    feeTable.querySelectorAll('tbody tr[data-key]').forEach(function (tr) {
      var txt = tr.querySelector('.num').textContent.replace(/[^0-9]/g, '');
      rates[tr.getAttribute('data-key')] = parseInt(txt, 10);
    });
    var scope = 'port';
    var counts = { platform: 1, unit: 0, week: 2 };
    var limits = { platform: [0, 4], unit: [0, 6], week: [0, 8] };
    var scopeNames = { port: 'Port — base scope', original: 'Original title — base scope', cabinet: 'Cabinet build — game + first unit' };
    var workEl = document.getElementById('estWork');
    var totalEl = document.getElementById('estTotal');
    var valEls = { platform: document.getElementById('platVal'), unit: document.getElementById('unitVal'), week: document.getElementById('weekVal') };
    var btns = {
      platform: [document.getElementById('platMinus'), document.getElementById('platPlus')],
      unit: [document.getElementById('unitMinus'), document.getElementById('unitPlus')],
      week: [document.getElementById('weekMinus'), document.getElementById('weekPlus')]
    };
    var renderEst = function () {
      var lines = [];
      var total = rates[scope];
      lines.push(scopeNames[scope] + '  ' + gbp(rates[scope]));
      ['platform', 'unit', 'week'].forEach(function (k) {
        var c = counts[k];
        if (c > 0) {
          lines.push('+ ' + c + ' × ' + gbp(rates[k]) + '  (' + k + ')  = ' + gbp(c * rates[k]));
          total += c * rates[k];
        }
        valEls[k].textContent = c;
        btns[k][0].disabled = c <= limits[k][0];
        btns[k][1].disabled = c >= limits[k][1];
      });
      lines.push('----------------------------------------');
      lines.push('TOTAL  ' + gbp(total));
      workEl.textContent = lines.join('\n');
      totalEl.textContent = gbp(total);
    };
    document.querySelectorAll('#scopeChips .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('#scopeChips .chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        scope = chip.getAttribute('data-scope');
        renderEst();
      });
    });
    Object.keys(counts).forEach(function (k) {
      btns[k][0].addEventListener('click', function () { counts[k] = Math.max(limits[k][0], counts[k] - 1); renderEst(); });
      btns[k][1].addEventListener('click', function () { counts[k] = Math.min(limits[k][1], counts[k] + 1); renderEst(); });
    });
    renderEst();
  }

  /* ==========================================================
     §4 — THE SERVICE CALL FORM
     Demonstration form: validates, confirms in-page with a
     generated reference, transmits nothing (and says so).
     ========================================================== */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var fields = {
      name: [document.getElementById('fName'), document.getElementById('eName')],
      org: [document.getElementById('fOrg'), document.getElementById('eOrg')],
      email: [document.getElementById('fEmail'), document.getElementById('eEmail')],
      msg: [document.getElementById('fMsg'), document.getElementById('eMsg')]
    };
    var scopeSel = document.getElementById('fScope');
    var confirmBox = document.getElementById('confirmBox');
    var confirmRef = document.getElementById('confirmRef');
    var confirmText = document.getElementById('confirmText');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      Object.keys(fields).forEach(function (k) {
        var input = fields[k][0], err = fields[k][1];
        var bad = !input.value.trim();
        if (k === 'email' && !bad && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) bad = true;
        err.hidden = !bad;
        input.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad) ok = false;
      });
      if (!ok) {
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus({ preventScroll: false });
        return;
      }
      var ref = 'CAS-2026-' + Math.floor(1000 + Math.random() * 9000);
      confirmRef.textContent = ref;
      var scopeLabel = scopeSel.options[scopeSel.selectedIndex].textContent;
      confirmText.textContent = 'Thank you, ' + fields.name[0].value.trim() + ' — the call is logged for ' +
        fields.org[0].value.trim() + ' under ' + scopeLabel + '. Reference ' + ref + ' opens the file.';
      form.hidden = true;
      confirmBox.hidden = false;
      confirmBox.setAttribute('tabindex', '-1');
      confirmBox.focus({ preventScroll: false });
    });
  }
})();
