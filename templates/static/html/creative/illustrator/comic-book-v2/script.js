/* Lena Moreau — comic book illustrator.
   Shared: page-turn guard, contents menu, panel-by-panel reveal.
   Index: Page-Rate Planner + commission estimator (both read the
   tables printed on the page — the tool and the page cannot disagree).
   Contact: demonstration form validation. No audio anywhere. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* Cross-document view transitions abort as unhandled rejections in
     some browsers; the navigation itself completes. Swallow only that. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Contents menu ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var menuPage = document.getElementById('menu-page');
  if (menuBtn && menuPage) {
    var closeBtn = menuPage.querySelector('.menu-close');
    var firstLink = menuPage.querySelector('.menu-grid a');
    function openMenu() {
      menuPage.hidden = false;
      menuBtn.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(function () {
        menuPage.classList.add('open');
        if (firstLink) firstLink.focus();
      });
    }
    function closeMenu() {
      menuPage.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuPage.hidden = true;
      menuBtn.focus();
    }
    menuBtn.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menuPage.hidden) closeMenu();
    });
  }

  /* ---------- Panel-by-panel reveal (reading order) ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if (revealEls.length) {
    if (reduced.matches || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      /* Stagger by reading order among siblings. */
      var counters = new Map();
      revealEls.forEach(function (el) {
        var parent = el.parentElement;
        var n = counters.get(parent) || 0;
        counters.set(parent, n + 1);
        el.style.setProperty('--d', Math.min(n * 0.09, 0.36) + 's');
      });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  function gbp(n) { return '£' + n.toLocaleString('en-GB'); }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  /* ================================================================
     PAGE-RATE PLANNER — reads Table P1 printed on index.html.
     Pace (pages/week, one artist): thumbnails 15 · pencils 10 ·
     inks 20 · colour 30. Weeks per stage = ceil(pages / pace).
     Rates per page: pencils only £90 · pencils+inks £150 ·
     full art £230.
     ================================================================ */
  var planner = document.getElementById('planner');
  if (planner) {
    var PACE = [
      { key: 'thumb', label: 'Thumbnails & breakdown', pace: 15 },
      { key: 'pencil', label: 'Pencils', pace: 10 },
      { key: 'ink', label: 'Inks, over own pencils', pace: 20 },
      { key: 'colour', label: 'Colour, flat + render', pace: 30 }
    ];
    var SCOPES = {
      pencils: { label: 'Pencils only', rate: 90, stages: ['thumb', 'pencil'] },
      pencilsinks: { label: 'Pencils + inks', rate: 150, stages: ['thumb', 'pencil', 'ink'] },
      fullart: { label: 'Full art', rate: 230, stages: ['thumb', 'pencil', 'ink', 'colour'] }
    };
    var pagesInput = document.getElementById('pl-pages');
    var deadlineInput = document.getElementById('pl-deadline');
    var workingsEl = document.getElementById('pl-workings');
    var totalEl = document.getElementById('pl-total');
    var feeEl = document.getElementById('pl-fee');
    var verdictEl = document.getElementById('pl-verdict');
    var scopeBtns = Array.prototype.slice.call(planner.querySelectorAll('.scope-btn'));
    var state = { scope: 'fullart' };

    function schedule(pages, scopeKey) {
      var sc = SCOPES[scopeKey];
      var lines = PACE.filter(function (s) { return sc.stages.indexOf(s.key) !== -1; })
        .map(function (s) {
          return { label: s.label, pace: s.pace, weeks: Math.ceil(pages / s.pace) };
        });
      var total = lines.reduce(function (a, l) { return a + l.weeks; }, 0);
      return { lines: lines, total: total, fee: pages * sc.rate, scope: sc };
    }
    function pagesFit(weeks, scopeKey) {
      var p = 0;
      while (schedule(p + 1, scopeKey).total <= weeks) p++;
      return p;
    }

    function renderPlanner() {
      var pages = clamp(parseInt(pagesInput.value, 10) || 1, 1, 400);
      var sch = schedule(pages, state.scope);
      workingsEl.innerHTML = '';
      sch.lines.forEach(function (l) {
        var li = document.createElement('li');
        li.innerHTML = '<span>' + l.label + ' — ' + pages + ' pages ÷ ' + l.pace + ' pages/week</span>' +
          '<span class="w-num">= ' + l.weeks + (l.weeks === 1 ? ' week' : ' weeks') + '</span>';
        workingsEl.appendChild(li);
      });
      totalEl.innerHTML = '<span>Schedule</span><span id="pl-total-weeks">' + sch.total + ' weeks</span>';
      feeEl.innerHTML = '<span>' + pages + ' pages × ' + gbp(sch.scope.rate) + ' per page (' + sch.scope.label.toLowerCase() + ')</span>' +
        '<span class="w-num"><strong id="pl-fee-total">' + gbp(sch.fee) + '</strong></span>';

      var dlRaw = deadlineInput.value.trim();
      var dl = dlRaw === '' ? null : clamp(parseInt(dlRaw, 10) || 0, 1, 200);
      verdictEl.innerHTML = '';
      verdictEl.className = 'verdict';
      if (dl === null) {
        var ok = document.createElement('div');
        ok.className = 'verdict-ok';
        ok.textContent = 'No deadline set. Add one above and the planner will tell you plainly whether one pair of hands can meet it.';
        verdictEl.appendChild(ok);
      } else if (dl >= sch.total) {
        var ok2 = document.createElement('div');
        ok2.className = 'verdict-ok';
        ok2.innerHTML = '<strong>It fits.</strong> ' + sch.total + ' weeks of drawing inside a ' + dl +
          '-week window leaves ' + (dl - sch.total) + (dl - sch.total === 1 ? ' week' : ' weeks') +
          ' of slack for approvals and the unexpected.';
        verdictEl.appendChild(ok2);
      } else {
        var fit = pagesFit(dl, state.scope);
        var pencilsOnly = schedule(pages, 'pencils');
        var bad = document.createElement('div');
        bad.className = 'verdict-bad';
        bad.id = 'pl-impossible';
        bad.innerHTML =
          '<p class="v-title">It cannot be drawn in time — by one pair of hands.</p>' +
          '<p>A ' + pages + '-page book at ' + sch.scope.label.toLowerCase() + ' cannot be drawn in ' + dl +
          ' weeks. The schedule above says <strong>' + sch.total + ' weeks</strong>, and the pace table is not negotiable — it is what the hand does. The honest options:</p>' +
          '<ul>' +
          '<li><strong>Fewer pages:</strong> at ' + sch.scope.label.toLowerCase() + ', <strong>' + fit + ' pages</strong> fit inside ' + dl + ' weeks.</li>' +
          '<li><strong>Split the labour:</strong> pencils only from this studio = <strong>' + pencilsOnly.total + ' weeks</strong> for ' + pages +
          ' pages, with a second inker and a colourist working the pipeline behind the pencils — credited by name on the book, as all hands here are.</li>' +
          '<li><strong>A later date:</strong> keep the book whole and it lands in <strong>week ' + sch.total + '</strong>.</li>' +
          '</ul>';
        verdictEl.appendChild(bad);
      }
    }

    /* Steppers */
    planner.querySelectorAll('[data-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = document.getElementById(btn.getAttribute('data-step'));
        if (!target) return;
        var d = parseInt(btn.getAttribute('data-delta'), 10) || 0;
        var v = (parseInt(target.value, 10) || 0) + d;
        target.value = clamp(v, parseInt(target.min, 10) || 0, parseInt(target.max, 10) || 9999);
        target.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
    scopeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.scope = btn.getAttribute('data-scope');
        scopeBtns.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        renderPlanner();
      });
    });
    pagesInput.addEventListener('input', renderPlanner);
    deadlineInput.addEventListener('input', renderPlanner);
    var clearDl = document.getElementById('pl-clear-deadline');
    if (clearDl) clearDl.addEventListener('click', function () { deadlineInput.value = ''; renderPlanner(); });
    renderPlanner();
  }

  /* ================================================================
     COMMISSION ESTIMATOR — reads the printed commission lines.
     Cover (full art) £650 · Interior page (full art) £230 ·
     Character design sheet £180.
     ================================================================ */
  var estimator = document.getElementById('estimator');
  if (estimator) {
    var LINES = [
      { key: 'cover', label: 'Cover, full art', price: 650 },
      { key: 'page', label: 'Interior page, full art', price: 230 },
      { key: 'sheet', label: 'Character design sheet', price: 180 }
    ];
    var estWorkings = document.getElementById('est-workings');
    var estTotal = document.getElementById('est-total');
    function renderEstimator() {
      estWorkings.innerHTML = '';
      var total = 0;
      LINES.forEach(function (l) {
        var input = document.getElementById('est-' + l.key);
        var qty = clamp(parseInt(input.value, 10) || 0, 0, 200);
        var sum = qty * l.price;
        total += sum;
        var li = document.createElement('li');
        li.innerHTML = '<span>' + qty + ' × ' + l.label.toLowerCase() + ' at ' + gbp(l.price) + '</span>' +
          '<span class="w-num">= ' + gbp(sum) + '</span>';
        estWorkings.appendChild(li);
      });
      estTotal.innerHTML = '<span>Estimate</span><span id="est-total-value">' + gbp(total) + '</span>';
    }
    estimator.querySelectorAll('[data-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = document.getElementById(btn.getAttribute('data-step'));
        if (!target) return;
        var d = parseInt(btn.getAttribute('data-delta'), 10) || 0;
        target.value = clamp((parseInt(target.value, 10) || 0) + d,
          parseInt(target.min, 10) || 0, parseInt(target.max, 10) || 9999);
        target.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
    LINES.forEach(function (l) {
      document.getElementById('est-' + l.key).addEventListener('input', renderEstimator);
    });
    renderEstimator();
  }

  /* ================================================================
     CONTACT FORM — demonstration only; nothing is transmitted.
     ================================================================ */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var conf = document.getElementById('confirmation');
    function setError(id, msg) {
      var field = document.getElementById(id);
      var err = document.getElementById(id + '-error');
      if (err) err.textContent = msg || '';
      if (field) field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('cf-name');
      var email = document.getElementById('cf-email');
      var msg = document.getElementById('cf-message');
      var ok = true;
      if (!name.value.trim()) { setError('cf-name', 'Your name, please — the reply needs a name on it.'); ok = false; } else setError('cf-name', '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { setError('cf-email', 'That email does not parse — check it and try again.'); ok = false; } else setError('cf-email', '');
      if (msg.value.trim().length < 20) { setError('cf-message', 'A little more, please — what is the book, how many pages, and when is it needed? (20 characters at least.)'); ok = false; } else setError('cf-message', '');
      if (!ok) return;
      var h = 0, s = name.value + '|' + email.value;
      for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      var ref = 'LM-' + new Date().getFullYear() + '-' + String(1000 + (h % 9000));
      document.getElementById('confirmation-ref').textContent = ref;
      form.hidden = true;
      conf.hidden = false;
      conf.setAttribute('tabindex', '-1');
      conf.focus();
    });
  }
})();
