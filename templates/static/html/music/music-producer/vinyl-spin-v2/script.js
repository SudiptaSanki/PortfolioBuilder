/* ============================================================
   VERMEULEN CUTTING ROOM — vinyl-spin
   Sound ruling: NONE, deliberately. The honest demonstration of
   what vinyl does to music is a record on a turntable; a
   synthesised imitation of crackle would be theatre. The stub's
   hover plucks and click-to-play beat were removed, not rebuilt.
   This script creates no AudioContext and the site has no audio
   elements. The ruling is printed in the footer and CREDITS.md.
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
  var fmt = function (n) { return n.toLocaleString('en-GB'); };
  var gbp = function (n, dp) {
    return '£' + n.toLocaleString('en-GB', { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 });
  };
  var mmss = function (s) {
    var m = Math.floor(s / 60), r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  };

  /* ---------- mobile log-index panel ---------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('indexPanel');
  if (btn && panel) {
    var closePanel = function () {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    };
    btn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        requestAnimationFrame(function () {
          var first = panel.querySelector('.leaf a');
          if (first) first.focus({ preventScroll: true });
        });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePanel();
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]') || e.target.closest('a')) closePanel();
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
     THE SIDE SHEET
     Bands are parsed from the printed plate (#bandTable); track
     durations from the printed side sheet (#trackTable). The tool
     and the page cannot disagree.
     ========================================================== */
  var bandTable = document.getElementById('bandTable');
  var trackTable = document.getElementById('trackTable');
  if (bandTable && trackTable) {
    var bands = Array.prototype.slice.call(bandTable.querySelectorAll('tbody tr')).map(function (tr) {
      return {
        lo: parseInt(tr.getAttribute('data-lo'), 10),
        hi: parseInt(tr.getAttribute('data-hi'), 10),
        name: tr.getAttribute('data-band'),
        cons: tr.getAttribute('data-cons')
      };
    });
    var bandFor = function (secs) {
      for (var i = 0; i < bands.length; i++) {
        if (secs >= bands[i].lo && secs <= bands[i].hi) return { band: bands[i], idx: i };
      }
      return { band: bands[bands.length - 1], idx: bands.length - 1 };
    };

    var tracks = Array.prototype.slice.call(trackTable.querySelectorAll('tbody tr')).map(function (tr) {
      return {
        tr: tr,
        secs: parseInt(tr.getAttribute('data-secs'), 10),
        loud: tr.getAttribute('data-loud') === '1',
        home: tr.getAttribute('data-side'),
        side: tr.getAttribute('data-side'),
        title: tr.querySelector('.track-title').textContent
      };
    });

    var els = {};
    ['A', 'B'].forEach(function (s) {
      els[s] = {
        list: document.getElementById('list' + s),
        sum: document.getElementById('sum' + s),
        total: document.getElementById('total' + s),
        tag: document.getElementById('tag' + s),
        cons: document.getElementById('cons' + s),
        caution: document.getElementById('caution' + s)
      };
    });

    var renderSides = function () {
      ['A', 'B'].forEach(function (s) {
        var mine = tracks.filter(function (t) { return t.side === s; });
        var total = mine.reduce(function (a, t) { return a + t.secs; }, 0);
        var e = els[s];
        e.list.innerHTML = '';
        if (!mine.length) {
          var li0 = document.createElement('li');
          li0.className = 'empty';
          li0.textContent = '— no tracks on this side —';
          e.list.appendChild(li0);
        }
        mine.forEach(function (t) {
          var li = document.createElement('li');
          var a = document.createElement('span'); a.textContent = t.title;
          var b = document.createElement('span'); b.textContent = mmss(t.secs);
          li.appendChild(a); li.appendChild(b);
          e.list.appendChild(li);
        });
        e.sum.innerHTML = mine.length
          ? mine.map(function (t) { return mmss(t.secs); }).join(' + ') +
            ' <span class="eq">= ' + mmss(total) + '</span>'
          : '<span class="eq">= 0:00</span>';
        e.total.textContent = mmss(total);
        var res = bandFor(total);
        e.tag.textContent = res.band.name;
        e.tag.className = 'band-tag' + (res.idx === 1 ? ' b2' : res.idx === 2 ? ' b3' : '');
        e.cons.textContent = res.band.cons;
        var lastLoud = mine.length && mine[mine.length - 1].loud;
        e.caution.hidden = !lastLoud;
      });
      tracks.forEach(function (t) {
        t.tr.setAttribute('data-side', t.side);
        t.tr.querySelectorAll('.assign button').forEach(function (b) {
          b.setAttribute('aria-pressed', b.getAttribute('data-to') === t.side ? 'true' : 'false');
        });
      });
    };

    trackTable.addEventListener('click', function (e) {
      var b = e.target.closest('.assign button');
      if (!b) return;
      var tr = b.closest('tr');
      var t = tracks.filter(function (x) { return x.tr === tr; })[0];
      if (!t) return;
      t.side = b.getAttribute('data-to');
      renderSides();
    });

    var reset = document.getElementById('resetSides');
    if (reset) {
      reset.addEventListener('click', function () {
        tracks.forEach(function (t) { t.side = t.home; });
        renderSides();
      });
    }
    renderSides();
  }

  /* ==========================================================
     THE PRESSING CALCULATOR
     Fixed costs are summed from the printed fixed-cost table;
     run sizes and unit costs are parsed from the printed unit
     table. Break-even = ceil(total ÷ retail).
     ========================================================== */
  var fixedTable = document.getElementById('fixedTable');
  var unitTable = document.getElementById('unitTable');
  var chipBox = document.getElementById('runChips');
  if (fixedTable && unitTable && chipBox) {
    var fixedParts = Array.prototype.slice.call(fixedTable.querySelectorAll('tr[data-cost]')).map(function (tr) {
      return parseFloat(tr.getAttribute('data-cost'));
    });
    var fixedTotal = fixedParts.reduce(function (a, c) { return a + c; }, 0);
    var fixedEl = document.getElementById('fixedTotal');
    if (fixedEl) fixedEl.textContent = gbp(fixedTotal);

    var runs = Array.prototype.slice.call(unitTable.querySelectorAll('tbody tr')).map(function (tr) {
      return { run: parseInt(tr.getAttribute('data-run'), 10), unit: parseFloat(tr.getAttribute('data-unit')) };
    });
    var state = { runIdx: 1, retail: 24 }; /* the 500 row, as printed */
    if (runs.length < 2) state.runIdx = 0;

    runs.forEach(function (r, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = fmt(r.run) + ' · ' + gbp(r.unit, 2);
      b.setAttribute('aria-pressed', i === state.runIdx ? 'true' : 'false');
      b.setAttribute('aria-label', 'Run of ' + fmt(r.run) + ' records at ' + gbp(r.unit, 2) + ' per record');
      b.addEventListener('click', function () {
        state.runIdx = i;
        chipBox.querySelectorAll('button').forEach(function (x, j) {
          x.setAttribute('aria-pressed', j === i ? 'true' : 'false');
        });
        renderCalc();
      });
      chipBox.appendChild(b);
    });

    var retailVal = document.getElementById('retailVal');
    document.querySelectorAll('[data-rstep]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.retail += parseInt(b.getAttribute('data-rstep'), 10);
        if (state.retail < 10) state.retail = 10;
        if (state.retail > 60) state.retail = 60;
        renderCalc();
      });
    });

    var out = {
      fixedLine: document.getElementById('outFixedLine'),
      fixed: document.getElementById('outFixed'),
      pressLine: document.getElementById('outPressLine'),
      press: document.getElementById('outPress'),
      total: document.getElementById('outTotal'),
      allIn: document.getElementById('outAllIn'),
      brk: document.getElementById('outBreak'),
      verdict: document.getElementById('outVerdict')
    };

    var renderCalc = function () {
      var r = runs[state.runIdx];
      var press = Math.round(r.run * r.unit * 100) / 100;
      var total = fixedTotal + press;
      var allIn = total / r.run;
      var brk = Math.ceil(total / state.retail);
      retailVal.textContent = gbp(state.retail);
      out.fixedLine.textContent = fixedParts.map(function (c) { return gbp(c); }).join(' + ');
      out.fixed.textContent = gbp(fixedTotal);
      out.pressLine.textContent = fmt(r.run) + ' × ' + gbp(r.unit, 2);
      out.press.textContent = gbp(press);
      out.total.textContent = gbp(total);
      out.allIn.textContent = gbp(allIn, 2);
      out.brk.textContent = fmt(brk);
      out.verdict.innerHTML = 'Sell <b>' + fmt(brk) + ' of ' + fmt(r.run) +
        '</b> records at ' + gbp(state.retail) + ' and the pressing has paid for itself. ' +
        'The other ' + fmt(r.run - brk) + ' are the margin the run was sized for — if the honest audience count is under ' +
        fmt(brk) + ', the run is too big, whatever the plant offers.';
    };
    renderCalc();
  }

  /* ==========================================================
     THE ENQUIRY FORM — demonstration form, honestly labelled.
     Validates per field; the confirmation is generated in-page;
     nothing is transmitted anywhere.
     ========================================================== */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirmBox = document.getElementById('confirmBox');
    var fields = {
      name: { el: form.elements.name, err: 'err-name', test: function (v) { return v.trim().length >= 2; }, msg: 'Enter your name — the log needs a name to file the entry under.' },
      email: { el: form.elements.email, err: 'err-email', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'Enter an email that can be answered — one @, one dot, no spaces.' },
      service: { el: form.elements.service, err: 'err-service', test: function (v) { return v !== ''; }, msg: 'Choose the work — the register entry this enquiry belongs to.' },
      message: { el: form.elements.message, err: 'err-message', test: function (v) { return v.trim().length >= 20; }, msg: 'Tell the room about the record in a sentence or two (20 characters or more) — tracks, timings, where the masters stand.' }
    };
    var check = function (key) {
      var f = fields[key];
      var ok = f.test(f.el.value);
      var errEl = document.getElementById(f.err);
      if (errEl) { errEl.hidden = ok; if (!ok) errEl.textContent = f.msg; }
      f.el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok;
    };
    Object.keys(fields).forEach(function (key) {
      fields[key].el.addEventListener('blur', function () { check(key); });
      fields[key].el.addEventListener('input', function () {
        var errEl = document.getElementById(fields[key].err);
        if (errEl && !errEl.hidden) check(key);
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, firstBad = null;
      Object.keys(fields).forEach(function (key) {
        if (!check(key)) { ok = false; if (!firstBad) firstBad = fields[key].el; }
      });
      if (!ok) { if (firstBad) firstBad.focus(); return; }
      var initials = fields.name.el.value.trim().split(/\s+/).map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 3);
      var ref = 'ENQ-048-' + initials + '-' + (1000 + Math.floor(Math.random() * 9000));
      document.getElementById('confirmRef').textContent = ref;
      document.getElementById('confirmName').textContent = fields.name.el.value.trim();
      confirmBox.hidden = false;
      form.hidden = true;
      confirmBox.setAttribute('tabindex', '-1');
      confirmBox.focus({ preventScroll: false });
    });
    var again = document.getElementById('againBtn');
    if (again) {
      again.addEventListener('click', function () {
        confirmBox.hidden = true;
        form.hidden = false;
        form.reset();
      });
    }
  }
})();
