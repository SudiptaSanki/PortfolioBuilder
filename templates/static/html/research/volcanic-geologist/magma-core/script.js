/* Magma Core — volcanology & hazard consultancy.
   Vanilla JS: mobile menu, reveal, the Alert-Level Explorer,
   the VEI reference, and the enquiry form.
   Sound ruling: none. This trade's product is measured judgement,
   not audio — eruption sound on a portfolio would be spectacle,
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

  /* ---------- reveal ---------- */
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

  /* ---------- the Alert-Level Explorer ----------
     The scheme, stated once. It is the USGS volcano alert-level
     logic reduced to its working rule, and it is printed in full
     in the scheme table on the home page:
       1. Score each unrest parameter by band: 0 background,
          1 above background, 2 high / escalating, 3 extreme.
       2. The unrest score is the HIGHEST single band — unrest is
          set by the loudest instrument, not by an average.
       3. Eruption status can only raise the level: an eruption
          under way with limited hazards is at least WATCH; an
          eruption producing hazards beyond the exclusion zone
          is WARNING by definition.
     The explorer applies exactly this rule and nothing else. */
  var LEVELS = [
    {
      name: 'NORMAL',
      meaning: 'The volcano is in its typical background, non-eruptive state. Nothing in the data departs from the long-term baseline for this volcano.',
      actions: 'Routine monitoring continues. Bulletin issued monthly, or as data arrives. No public action is required, and none should be improvised.'
    },
    {
      name: 'ADVISORY',
      meaning: 'The volcano is showing signs of elevated unrest above its known background level. Most unrest episodes stop here — but it is watched closely for any renewed increase.',
      actions: 'Monitoring stepped up and instrument gaps filled. Civil protection informed. Bulletin weekly, moving to daily if the unrest quickens.'
    },
    {
      name: 'WATCH',
      meaning: 'Unrest is heightened or escalating, with increased potential for an eruption — timeframe uncertain. WATCH also covers an eruption already under way that poses limited hazards, largely inside the existing exclusion zone.',
      actions: 'Bulletin daily. Civil protection on standby and access restrictions likely. Evacuation routes and zones reviewed against the current hazard map, in public.'
    },
    {
      name: 'WARNING',
      meaning: 'A hazardous eruption is imminent, under way, or suspected. Hazards may extend well beyond the exclusion zone: pyroclastic flows, lahars, heavy ashfall.',
      actions: 'Continuous updates. Evacuations are ordered by civil protection, never by scientists — the scientist\u2019s job is to keep the information current, plain and honest about what is not known.'
    }
  ];
  var PARAM_LABEL = { seis: 'Seismicity', gas: 'Gas flux (SO\u2082)', def: 'Deformation', erup: 'Eruption status' };
  var state = { seis: 0, gas: 0, def: 0, erup: 0 };

  var board = document.getElementById('alertBoard');
  var readout = document.getElementById('alertReadout');
  if (board && readout) {
    var roChip = document.getElementById('roChip');
    var roMeaning = document.getElementById('roMeaning');
    var roDriver = document.getElementById('roDriver');
    var roActions = document.getElementById('roActions');
    var roBasis = document.getElementById('roBasis');
    var roNote = document.getElementById('roNote');

    var renderAlert = function () {
      var unrest = Math.max(state.seis, state.gas, state.def);
      var level = unrest;
      var floorNote = '';
      if (state.erup === 1 && level < 2) {
        level = 2;
        floorNote = 'Floor applied: an eruption under way with limited hazards is WATCH by definition, whatever the unrest score says.';
      }
      if (state.erup === 2 && level < 3) {
        level = 3;
        floorNote = 'Floor applied: an eruption producing hazards beyond the exclusion zone is WARNING by definition.';
      }
      var L = LEVELS[level];
      readout.className = 'readout lv' + level;
      readout.setAttribute('data-level', String(level));
      roChip.className = 'chip lv' + level;
      roChip.textContent = 'Alert level · ' + L.name;
      roMeaning.textContent = L.meaning;
      roActions.textContent = L.actions;
      var drivers = [];
      if (unrest === 0 && state.erup === 0) {
        roDriver.textContent = 'No parameter is above background.';
      } else {
        ['seis', 'gas', 'def'].forEach(function (k) {
          if (state[k] === unrest && unrest > 0) drivers.push(PARAM_LABEL[k]);
        });
        if (state.erup > 0) drivers.push(PARAM_LABEL.erup);
        roDriver.textContent = drivers.length ? drivers.join(' · ') : 'Eruption status';
      }
      var basis = [];
      ['seis', 'gas', 'def', 'erup'].forEach(function (k) {
        var b = board.querySelector('[data-param="' + k + '"] [aria-pressed="true"] .o-t');
        basis.push(PARAM_LABEL[k] + ': ' + (b ? b.textContent : '—'));
      });
      roBasis.textContent = basis.join(' · ');
      roNote.textContent = floorNote;
      roNote.style.display = floorNote ? '' : 'none';
    };

    board.querySelectorAll('[data-param]').forEach(function (group) {
      var key = group.getAttribute('data-param');
      group.querySelectorAll('.opt').forEach(function (b) {
        b.addEventListener('click', function () {
          state[key] = parseInt(b.getAttribute('data-val'), 10);
          group.querySelectorAll('.opt').forEach(function (o) {
            o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
          });
          renderAlert();
        });
      });
    });
    renderAlert();
  }

  /* ---------- VEI reference ----------
     Bulk volumes are the standard VEI bands (Newhall & Self,
     1982). The scale is logarithmic: each step is roughly ten
     times the volume of the one below. Examples are the
     eruptions textbooks reach for — including one, Ruiz 1985,
     kept here as a warning that VEI measures volume, not danger. */
  var VEI = {
    '0': { vol: '< 0.00001 km\u00B3', ex: 'K\u012Blauea, Hawai\u02BBi — typical effusive activity', freq: 'Dozens under way in any year', note: 'Lava flows with negligible explosive volume. Most eruptions on Earth in any given year are VEI 0\u20132 — frequent, local, and still capable of destroying homes, roads and livelihoods.' },
    '1': { vol: '0.00001 \u2013 0.001 km\u00B3', ex: 'Stromboli, Italy — typical Strombolian bursts', freq: 'Several a year', note: 'Small explosions, minutes apart, for centuries at a time. Stromboli\u2019s ordinary activity is a VEI 1; its rare larger paroxysms are a different problem and are planned for separately.' },
    '2': { vol: '0.001 \u2013 0.01 km\u00B3', ex: 'Sakurajima, Japan — frequent Vulcanian explosions', freq: 'Around twenty a year', note: 'Ash plumes a few kilometres high, ashfall on downwind towns as a routine fact of life. Kagoshima sweeps its streets the way other cities sweep leaves.' },
    '3': { vol: '0.01 \u2013 0.1 km\u00B3', ex: 'Nevado del Ruiz, Colombia — 1985', freq: 'A few a year', note: 'A modest volume of magma melted summit snow and ice; the lahars that followed killed some 23,000 people, most of them in Armero. VEI measures the size of an eruption. It does not measure the size of the disaster.' },
    '4': { vol: '0.1 \u2013 1 km\u00B3', ex: 'Eyjafjallaj\u00F6kull, Iceland — 2010', freq: 'Roughly one a year', note: 'No deaths, and European airspace closed for days: fine ash, a high plume and the wrong winds. The lesson insurers took from 2010 is that a mid-size eruption in the wrong place out-costs a large one in the right place.' },
    '5': { vol: '1 \u2013 10 km\u00B3', ex: 'Mount St. Helens, USA — 1980', freq: 'One or two a decade', note: 'A lateral blast, a debris avalanche and a Plinian column. The monitoring before it — and the exclusion zone that mostly held — is why the death toll was 57 and not thousands.' },
    '6': { vol: '10 \u2013 100 km\u00B3', ex: 'Pinatubo, Philippines — 1991', freq: 'One or two a century', note: 'The largest eruption of the satellite era. Sulphate aerosols cooled the planet by roughly half a degree for two years. The evacuation of some 60,000 people beforehand remains the standard proof that forecasting, believed, saves lives at scale.' },
    '7': { vol: '100 \u2013 1,000 km\u00B3', ex: 'Tambora, Indonesia — 1815', freq: 'Once or twice a millennium', note: 'The largest eruption in recorded history. Global temperatures fell, harvests failed, and 1816 became the Year Without a Summer. Events of this size are why hazard work is done in centuries, not news cycles.' },
    '8': { vol: '> 1,000 km\u00B3', ex: 'Toba, Indonesia — about 74,000 years ago', freq: 'Tens of thousands of years apart', note: 'No VEI 8 eruption has happened in recorded history, and none is forecast. It is on this chart because a scale that hides its top end invites people to mistake VEI 5 for the worst a volcano can do.' }
  };
  var veiPanel = document.getElementById('veiPanel');
  if (veiPanel) {
    var veiVol = document.getElementById('veiVol');
    var veiEx = document.getElementById('veiExample');
    var veiFreq = document.getElementById('veiFreq');
    var veiNote = document.getElementById('veiNote');
    var renderVei = function (key) {
      var d = VEI[key];
      veiPanel.querySelectorAll('.vei-btn').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-vei') === key ? 'true' : 'false');
      });
      veiVol.textContent = d.vol;
      veiEx.textContent = d.ex;
      if (veiFreq) veiFreq.textContent = d.freq;
      veiNote.textContent = d.note;
      veiPanel.setAttribute('data-active', key);
    };
    veiPanel.querySelectorAll('.vei-btn').forEach(function (b) {
      b.addEventListener('click', function () { renderVei(b.getAttribute('data-vei')); });
    });
    renderVei('4');
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirmBox = document.getElementById('confirmBox');
    var confirmRef = document.getElementById('confirmRef');
    var fields = {
      fName: { el: document.getElementById('fName'), test: function (v) { return v.trim().length >= 2; } },
      fEmail: { el: document.getElementById('fEmail'), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } },
      fOrg: { el: document.getElementById('fOrg'), test: function (v) { return v !== ''; } },
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
        if (fields[key].el.closest('.field').classList.contains('invalid')) mark(key);
      });
      fields[key].el.addEventListener('change', function () {
        if (fields[key].el.closest('.field').classList.contains('invalid')) mark(key);
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var keys = Object.keys(fields);
      var results = keys.map(mark);
      if (results.indexOf(false) !== -1) {
        fields[keys[results.indexOf(false)]].el.focus();
        return;
      }
      /* Deterministic reference from the sender's own details, so the
         same enquiry always quotes the same file number. */
      var seed = (fields.fName.el.value.trim() + '|' + fields.fEmail.el.value.trim()).toLowerCase();
      var sum = 0;
      for (var i = 0; i < seed.length; i++) sum += seed.charCodeAt(i) * (i + 3);
      var ref = 'MC-2026-' + (100 + (sum % 900));
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
    /* Register links can preselect the organisation type: contact.html?type=insurer */
    var typeSel = document.getElementById('fOrg');
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
