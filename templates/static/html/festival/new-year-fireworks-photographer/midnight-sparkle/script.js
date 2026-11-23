/* ============================================================
   MIDNIGHT SPARKLE — Tomas Riedel (fictional)
   Sound ruling: NONE. This script contains no audio code and
   never creates an AudioContext — a photographer's site is
   silent, and the ruling is printed in the footer.
   The planner and estimator parse their figures from the
   printed tables in the DOM, so tool and page cannot disagree.
   ============================================================ */
(function () {
  'use strict';

  /* View-transition abort guard: when Chrome aborts a cross-document
     transition it surfaces as an unhandled InvalidStateError rejection.
     The navigation itself always completes; swallow only that case. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Shot-log mobile panel ---------- */
  var toggle = document.getElementById('logToggle');
  var panel = document.getElementById('logPanel');
  if (toggle && panel) {
    var closePanel = function (refocus) {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      if (refocus) toggle.focus();
    };
    toggle.addEventListener('click', function () {
      var open = panel.hidden;
      if (open) {
        panel.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(function () {
          var first = panel.querySelector('a');
          if (first) first.focus();
        });
      } else {
        closePanel(false);
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) closePanel(true);
    });
  }

  var eur = function (n) { return '€' + n.toLocaleString('en-GB'); };
  var mmss = function (s) {
    var m = Math.floor(s / 60), r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  };

  /* ---------- Exposure & show planner (index) ---------- */
  var showTable = document.getElementById('showTable');
  if (showTable) {
    var segRows = Array.prototype.slice.call(showTable.querySelectorAll('tbody tr[data-dur]'));
    var segments = segRows.map(function (tr) {
      return {
        dur: parseInt(tr.getAttribute('data-dur'), 10),
        cls: tr.getAttribute('data-class'),
        start: tr.getAttribute('data-start'),
        end: tr.getAttribute('data-end'),
        name: tr.children[1].textContent.trim()
      };
    });
    var settings = {};
    document.querySelectorAll('#settingsTable tbody tr[data-class]').forEach(function (tr) {
      settings[tr.getAttribute('data-class')] = {
        ap: tr.getAttribute('data-ap'),
        bulb: tr.getAttribute('data-bulb'),
        iso: tr.getAttribute('data-iso'),
        note: tr.getAttribute('data-note'),
        name: tr.querySelector('th').textContent.trim()
      };
    });
    var cadence = {};
    document.querySelectorAll('#cadenceTable tbody tr[data-class]').forEach(function (tr) {
      cadence[tr.getAttribute('data-class')] = parseInt(tr.getAttribute('data-cadence'), 10);
    });

    var segState = 5;
    var segVal = document.getElementById('segVal');
    var segMinus = document.getElementById('segMinus');
    var segPlus = document.getElementById('segPlus');
    var workings = document.getElementById('planWorkings');
    var verdict = document.getElementById('planVerdict');

    function renderPlan() {
      segVal.textContent = segState + ' / ' + segments.length;
      segMinus.disabled = segState <= 1;
      segPlus.disabled = segState >= segments.length;
      var html = '', parts = [], totalFrames = 0, totalDur = 0;
      for (var i = 0; i < segState; i++) {
        var s = segments[i], st = settings[s.cls], cad = cadence[s.cls];
        var frames = s.dur / cad;
        totalFrames += frames; totalDur += s.dur; parts.push(frames);
        html += '<div class="w-row"><span class="w-what">Seg ' + (i + 1) + ' — ' + s.name +
          ' · Class ' + s.cls + ' · ' + st.ap + ' · ' + st.bulb + ' · ISO ' + st.iso +
          '<small>Clock ' + s.start + ' – ' + s.end + ' · cadence 1 frame / ' + cad + ' s</small></span>' +
          '<span class="w-fig">' + s.dur + ' s ÷ ' + cad + ' s = ' + frames + ' frames</span></div>';
      }
      html += '<div class="w-total"><span>' + parts.join(' + ') + ' frames</span><span>' +
        totalFrames + ' frames · ' + mmss(totalDur) + ' of show</span></div>';
      workings.innerHTML = html;
      if (segState >= segments.length) {
        verdict.className = 'verdict';
        verdict.innerHTML = '<strong>Finale note.</strong> Segment 5 is planned at the dropped cadence — one frame per 20 s, not 10. At barrage density the misfire rate is the highest of the night and a faster cadence stacks three bursts into one blown core. The plan takes <strong>6 clean frames</strong> there instead of 12 stacked ones, and says so before the show, not after it.';
      } else {
        verdict.className = 'verdict';
        verdict.innerHTML = 'This plan covers the first ' + segState + ' of ' + segments.length +
          ' segments (' + mmss(totalDur) + ' of the 17:00 show). The rest of the show is outside the plan — on the night, that is what a second manned position or a remote array is for.';
      }
    }
    segMinus.addEventListener('click', function () { if (segState > 1) { segState--; renderPlan(); } });
    segPlus.addEventListener('click', function () { if (segState < segments.length) { segState++; renderPlan(); } });

    var classSel = document.getElementById('classSel');
    function renderPlate() {
      var st = settings[classSel.value];
      document.getElementById('prAp').textContent = st.ap;
      document.getElementById('prBulb').textContent = st.bulb;
      document.getElementById('prIso').textContent = st.iso;
      document.getElementById('prNote').textContent = st.name + ' — ' + st.note;
    }
    classSel.addEventListener('change', renderPlate);
    renderPlan();
    renderPlate();
  }

  /* ---------- Booking estimator (index) ---------- */
  var feeTable = document.getElementById('feeTable');
  if (feeTable) {
    var rates = {};
    feeTable.querySelectorAll('tbody tr[data-key]').forEach(function (tr) {
      rates[tr.getAttribute('data-key')] = parseInt(tr.getAttribute('data-rate'), 10);
    });
    var est = { nights: 1, remotes: 2, survey: 1, second: 0 };
    var estWorkings = document.getElementById('estWorkings');

    function line(what, small, fig) {
      return '<div class="w-row"><span class="w-what">' + what + '<small>' + small + '</small></span>' +
        '<span class="w-fig">' + fig + '</span></div>';
    }
    function renderEst() {
      document.getElementById('nightVal').textContent = est.nights;
      document.getElementById('remoteVal').textContent = est.remotes;
      document.getElementById('surveyVal').textContent = est.survey ? 'In' : 'Out';
      document.getElementById('secondVal').textContent = est.second ? 'Yes' : 'No';
      document.getElementById('nightMinus').disabled = est.nights <= 1;
      document.getElementById('nightPlus').disabled = est.nights >= 3;
      document.getElementById('remoteMinus').disabled = est.remotes <= 0;
      document.getElementById('remotePlus').disabled = est.remotes >= 4;
      document.getElementById('surveyMinus').disabled = est.survey <= 0;
      document.getElementById('surveyPlus').disabled = est.survey >= 1;
      document.getElementById('secondMinus').disabled = est.second <= 0;
      document.getElementById('secondPlus').disabled = est.second >= 1;

      var nightFee = rates.night * est.nights;
      var remoteFee = rates.remote * est.remotes * est.nights;
      var surveyFee = rates.survey * est.survey;
      var secondFee = rates.second * est.second * est.nights;
      var total = nightFee + remoteFee + surveyFee + secondFee;

      var html = '';
      html += line('Display-night coverage', eur(rates.night) + ' × ' + est.nights + (est.nights === 1 ? ' night' : ' nights'), eur(nightFee));
      html += line('Remote cameras', est.remotes ? eur(rates.remote) + ' × ' + est.remotes + ' cameras × ' + est.nights + (est.nights === 1 ? ' night' : ' nights') : 'None booked', eur(remoteFee));
      html += line('Position survey &amp; schedule read', est.survey ? eur(rates.survey) + ' × 1 display' : 'Not included — no booking is confirmed without one', eur(surveyFee));
      html += line('Second manned position', est.second ? eur(rates.second) + ' × ' + est.nights + (est.nights === 1 ? ' night' : ' nights') : 'Not included', eur(secondFee));
      html += '<div class="w-total"><span>Estimator total</span><span>' + eur(total) + ' ex-VAT</span></div>';
      estWorkings.innerHTML = html;
    }
    function wire(id, fn) { document.getElementById(id).addEventListener('click', fn); }
    wire('nightMinus', function () { if (est.nights > 1) { est.nights--; renderEst(); } });
    wire('nightPlus', function () { if (est.nights < 3) { est.nights++; renderEst(); } });
    wire('remoteMinus', function () { if (est.remotes > 0) { est.remotes--; renderEst(); } });
    wire('remotePlus', function () { if (est.remotes < 4) { est.remotes++; renderEst(); } });
    wire('surveyMinus', function () { if (est.survey > 0) { est.survey--; renderEst(); } });
    wire('surveyPlus', function () { if (est.survey < 1) { est.survey++; renderEst(); } });
    wire('secondMinus', function () { if (est.second > 0) { est.second--; renderEst(); } });
    wire('secondPlus', function () { if (est.second < 1) { est.second++; renderEst(); } });
    renderEst();
  }

  /* ---------- Enquiry form (contact) ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var conf = document.getElementById('confirmation');
    function rowOf(input) { return input.closest('.f-row'); }
    function setValid(input, ok) {
      var row = rowOf(input);
      if (row) row.classList.toggle('invalid', !ok);
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok;
    }
    function check(input) {
      var v = input.value.trim();
      if (input.id === 'fEmail') return setValid(input, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
      if (input.required) return setValid(input, v.length > 1);
      return setValid(input, true);
    }
    ['fName', 'fEmail', 'fDate', 'fMsg'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('blur', function () { check(el); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ['fName', 'fEmail', 'fDate', 'fMsg'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el && !check(el)) ok = false;
      });
      if (!ok) {
        var firstBad = form.querySelector('.f-row.invalid .field');
        if (firstBad) firstBad.focus();
        return;
      }
      var ref = 'TR-2026-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('confRef').textContent = ref;
      document.getElementById('confLine').textContent =
        'Thank you, ' + document.getElementById('fName').value.trim() +
        '. Your display date — ' + document.getElementById('fDate').value.trim() +
        ' — is noted. The first reply asks for one thing: the firing schedule, or the display company\'s name so it can be requested. No schedule, no confirmed booking — that rule is printed on the index page too.';
      form.hidden = true;
      conf.hidden = false;
      conf.setAttribute('tabindex', '-1');
      conf.focus();
    });
  }
})();
