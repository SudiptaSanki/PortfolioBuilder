/* Reef Nursery — the nursery log.
   Vanilla JS: mobile menu, reveal, the Nursery Explorer (cohort log
   sheets with computed survival arithmetic) and the enquiry form.
   Sound ruling: none. This trade's product is measured in surviving
   colonies, not heard — underwater ambience would be decoration,
   so the site ships no audio at all. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* View-transition aborts surface as unhandled rejections in Chrome;
     swallow only that exact artefact. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) e.preventDefault();
  });

  /* ---------- mobile menu ---------- */
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('mobilePanel');
  if (btn && panel) {
    var openMenu = function () {
      panel.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var f = panel.querySelector('a');
          if (f) f.focus();
        });
      });
    };
    var closeMenu = function (ret) {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (ret) btn.focus();
    };
    btn.addEventListener('click', function () {
      if (panel.classList.contains('open')) closeMenu(false); else openMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closeMenu(true);
    });
    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { closeMenu(false); });
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900 && panel.classList.contains('open')) closeMenu(false);
    });
  }

  /* ---------- reveal (read down the log) ---------- */
  var rvEls = document.querySelectorAll('.rv');
  if (rvEls.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      rvEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.1 });
      rvEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- the Nursery Explorer ----------
     The log's arithmetic, stated once and computed live:
       nursery survival = grewToSize / fragmented
       alive at survey  = round(outplanted × survivalPct / 100)
       held in reserve  = grewToSize − outplanted
     Every figure on the sheet either comes from the entry below or is
     computed from it by these two rules — the sheet cannot disagree
     with itself. */
  var COHORTS = {
    'AC-24': {
      code: 'AC-24', tab: 'North Table', species: 'Acropora cervicornis', common: 'Staghorn coral',
      nursery: 'Key Largo nursery · North Table (coral trees)', fragDate: 'March 2024',
      fragmented: 1200, genotypes: 14, months: 11, grew: 1044,
      outplanted: 980, site: 'Molasses Reef, Key Largo', surveyMonths: 12, survival: 74,
      note: '<b>The widest genetic base we plant.</b> Fourteen genotypes of staghorn on one reef flat, spaced so the thickets can cross-fertilise at spawning. Fragments from this cohort now shelter juvenile grunts and damselfish at the site — the first year a restored thicket starts paying rent.'
    },
    'AC-25': {
      code: 'AC-25', tab: 'South Table', species: 'Acropora cervicornis', common: 'Staghorn coral',
      nursery: 'Key Largo nursery · South Table (coral trees)', fragDate: 'February 2025',
      fragmented: 900, genotypes: 11, months: 9, grew: 819,
      outplanted: 760, site: 'Carysfort Reef, Key Largo', surveyMonths: 6, survival: 81,
      note: '<b>The youngest cohort on the log.</b> Six months is too early to call a planting — staghorn losses usually arrive with the first hot summer. The 12-month survey, due August 2027, is the number this cohort will be judged by, and it will be printed here either way.'
    },
    'AP-24': {
      code: 'AP-24', tab: 'Casa Brisa', species: 'Acropora palmata', common: 'Elkhorn coral',
      nursery: 'Casa Brisa satellite nursery, Caye Caulker, Belize', fragDate: 'May 2024',
      fragmented: 400, genotypes: 9, months: 14, grew: 328,
      outplanted: 300, site: 'Casa Brisa house reef, Belize', surveyMonths: 12, survival: 68,
      note: '<b>Slow, heavy, worth it.</b> Elkhorn grows a fraction as fast as staghorn and shrugs off surge that flattens thinner corals — it is the breakwater species. Sixty-eight percent at twelve months is a fair elkhorn number; anyone quoting you ninety is selling something.'
    },
    'OF-25': {
      code: 'OF-25', tab: 'Raceways', species: 'Orbicella faveolata', common: 'Mountainous star coral',
      nursery: 'Key Largo land-based raceways (micro-fragments)', fragDate: 'January 2025',
      fragmented: 2400, genotypes: 6, months: 8, grew: 2160,
      outplanted: 2000, site: 'Looe Key, Florida Keys', surveyMonths: 6, survival: 77,
      note: '<b>Micro-fragmentation, the massive-coral shortcut.</b> Boulder corals grow millimetres a year as colonies, but a one-centimetre fragment races to cover its plug, and neighbouring fragments of the same genotype fuse into one colony. Two thousand plugs went out as six genotypes — the log tracks them as six colonies in the making, not two thousand.'
    },
    'DP-23': {
      code: 'DP-23', tab: 'Dry Tortugas', species: 'Diploria labyrinthiformis', common: 'Grooved brain coral',
      nursery: 'Key Largo land-based raceways (micro-fragments)', fragDate: 'September 2023',
      fragmented: 1600, genotypes: 8, months: 10, grew: 1392,
      outplanted: 1300, site: 'Dry Tortugas partner site', surveyMonths: 24, survival: 63,
      note: '<b>The cohort the heat found.</b> This planting lived through the August 2025 bleaching event under a monitoring contract — the survey photographs caught the paling early, outplanting paused, and losses stopped at nine percent. Sixty-three percent at twenty-four months is what surviving a marine heatwave looks like on paper.'
    }
  };

  var fmt = function (n) { return n.toLocaleString('en-US'); };

  var tabsWrap = document.getElementById('cohortTabs');
  var sheet = document.getElementById('cohortSheet');
  if (tabsWrap && sheet) {
    var render = function (key) {
      var c = COHORTS[key];
      var nurseryPct = Math.round(c.grew / c.fragmented * 100);
      var alive = Math.round(c.outplanted * c.survival / 100);
      var reserve = c.grew - c.outplanted;
      tabsWrap.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-cohort') === key ? 'true' : 'false');
      });
      sheet.innerHTML =
        '<div class="sheet-title"><span class="sp"><em>' + c.species + '</em> — ' + c.common + '</span>' +
        '<span class="code">COHORT ' + c.code + '</span></div>' +
        '<div class="sheet-rows">' +
        '<div class="sheet-row"><span class="rk">Nursery</span><span class="rv2">' + c.nursery + '</span><span class="rc"></span></div>' +
        '<div class="sheet-row"><span class="rk">Fragmented</span><span class="rv2"><b>' + fmt(c.fragmented) + '</b> fragments · ' + c.fragDate + '</span><span class="rc">' + c.genotypes + ' genotypes</span></div>' +
        '<div class="sheet-row"><span class="rk">Months in nursery</span><span class="rv2"><b>' + c.months + '</b> months on the table</span><span class="rc"></span></div>' +
        '<div class="sheet-row"><span class="rk">Grew to size</span><span class="rv2"><b>' + fmt(c.grew) + '</b> colonies ready to plant</span><span class="rc" id="nurseryPct">' + nurseryPct + '% of fragments</span></div>' +
        '<div class="sheet-row"><span class="rk">Outplanted</span><span class="rv2"><b>' + fmt(c.outplanted) + '</b> colonies · ' + c.site + '</span><span class="rc">' + fmt(reserve) + ' held in reserve</span></div>' +
        '<div class="sheet-row"><span class="rk">Last survey</span><span class="rv2"><b>' + c.surveyMonths + ' months</b> after outplanting</span><span class="rc" id="survivalPct">' + c.survival + '% survival</span></div>' +
        '<div class="sheet-row total"><span class="rk">Alive at survey</span><span class="rv2"><b id="aliveCount">' + fmt(alive) + '</b> colonies</span><span class="rc">counted, not estimated</span></div>' +
        '</div>' +
        '<p class="sheet-note">' + c.note + '</p>';
      sheet.setAttribute('data-active', key);
    };
    tabsWrap.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { render(b.getAttribute('data-cohort')); });
    });
    render('AC-24');
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirmBox = document.getElementById('confirmBox');
    var confirmRef = document.getElementById('confirmRef');
    var fields = {
      fName: { el: document.getElementById('fName'), test: function (v) { return v.trim().length >= 2; } },
      fEmail: { el: document.getElementById('fEmail'), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } },
      fSite: { el: document.getElementById('fSite'), test: function (v) { return v.trim().length >= 3; } },
      fMsg: { el: document.getElementById('fMsg'), test: function (v) { return v.trim().length >= 10; } }
    };
    var mark = function (key) {
      var f = fields[key];
      var wrap = f.el.closest('.field');
      var ok = f.test(f.el.value);
      wrap.classList.toggle('invalid', !ok);
      f.el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok;
    };
    Object.keys(fields).forEach(function (key) {
      fields[key].el.addEventListener('input', function () {
        var wrap = fields[key].el.closest('.field');
        if (wrap.classList.contains('invalid')) mark(key);
      });
      fields[key].el.addEventListener('change', function () {
        var wrap = fields[key].el.closest('.field');
        if (wrap.classList.contains('invalid')) mark(key);
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var keys = Object.keys(fields);
      var results = keys.map(mark);
      if (results.indexOf(false) !== -1) {
        var firstBad = fields[keys[results.indexOf(false)]].el;
        firstBad.focus();
        return;
      }
      /* Deterministic reference from the sender's own details, so the
         same enquiry always quotes the same log number. */
      var seed = (fields.fName.el.value.trim() + '|' + fields.fEmail.el.value.trim()).toLowerCase();
      var sum = 0;
      for (var i = 0; i < seed.length; i++) sum += seed.charCodeAt(i) * (i + 3);
      var ref = 'RN-2026-' + (100 + (sum % 900));
      confirmRef.textContent = ref;
      form.style.display = 'none';
      confirmBox.classList.add('show');
      confirmBox.setAttribute('tabindex', '-1');
      confirmBox.focus();
    });
    var again = document.getElementById('sendAnother');
    if (again) {
      again.addEventListener('click', function () {
        form.reset();
        Object.keys(fields).forEach(function (key) {
          fields[key].el.closest('.field').classList.remove('invalid');
        });
        confirmBox.classList.remove('show');
        form.style.display = '';
        document.getElementById('fName').focus();
      });
    }
    /* Contact links can preselect the programme type: contact.html?type=monitoring */
    var typeSel = document.getElementById('fType');
    if (typeSel) {
      var t = new URLSearchParams(window.location.search).get('type');
      if (t) {
        for (var j = 0; j < typeSel.options.length; j++) {
          if (typeSel.options[j].value === t) { typeSel.selectedIndex = j; break; }
        }
      }
    }
  }
})();
