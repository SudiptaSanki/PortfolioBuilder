/* Solberg Habitats — interactions.
   No audio: habitat design is not a sound trade, and the stub's
   hover synth failed the program's sound need-test. Deleted. */
(function () {
  'use strict';

  /* ---------- §2 systems explorer ---------- */
  var SYSTEMS = {
    berm: {
      title: 'Regolith berm — radiation shielding',
      spec: 'DEPTH <b>2.5 m</b> over crown · MASS <b>≈ 1,900 t</b>, moved by 2 rovers in 90 sols · TARGET <b>&lt; 50 mSv/yr</b> at the berth',
      body: 'Unshielded, the Martian surface delivers roughly 0.67 mSv a day of galactic cosmic radiation — about 240 mSv a year, a career-limit problem inside a single long stay. Two and a half metres of regolith over the hull cuts that to a fraction, and it is the one building material that does not have to be landed. The berm is not landscaping; it is the radiation design, and the hull underneath is sized assuming it.',
      basis: 'BASIS — Dose: MSL RAD surface measurements (Hassler et al., Science 2014). Shielding performance: published regolith-shielding studies at ~1.5 g/cm³ in-situ density.'
    },
    shell: {
      title: 'Pressure shell',
      spec: 'INTERNAL <b>101 kPa</b> · AMBIENT <b>≈ 0.6 kPa</b> · DIFFERENTIAL <b>≈ 100 kPa</b> · VESSEL <b>Ø 6.4 m × 14 m</b>',
      body: 'The shell is a pressure vessel that happens to contain furniture. It is sized by the hundred-kilopascal difference across it, not by Mars gravity — 0.38 g is a gift the structure barely notices. Every penetration is a leak path and a line in the failure analysis, which is why the study allows exactly two 400 mm viewports and argues, in writing, against the glazed cupola in the client\u2019s first sketch.',
      basis: 'BASIS — Ambient pressure: lander meteorology, Viking through Perseverance (≈ 600 Pa mean). Internal pressure: sea-level-equivalent, chosen over a low-pressure oxygen-rich mix to keep fire behaviour and physiology Earth-normal.'
    },
    eclss: {
      title: 'ECLSS & water loop',
      spec: 'WATER BUDGET <b>24 L / crew / sol</b> · RECOVERY TARGET <b>≥ 95%</b> · O\u2082 <b>electrolysis + CO\u2082 reduction</b>',
      body: 'The loop is closed at 95% on paper, with the water store wrapped around the storm shelter so the same tonnes shield the crew twice. Hygiene water is the swing item in every budget this studio has closed — crews do not mutiny over drinking water arithmetic, they mutiny over showers — so it is budgeted honestly at the top of the range rather than wished down to make the total prettier.',
      basis: 'BASIS — Recovery: ISS water recovery demonstrated up to ≈ 98% (NASA ECLSS reporting). Studies here close at 95% and carry the gap as stored reserve, not as hope.'
    },
    airlock: {
      title: 'Airlock & dust control',
      spec: 'SUITPORT LOCK <b>+</b> CYCLING LOCK · DUST <b>perchlorate-bearing, electrostatic</b> · CYCLE <b>≈ 12 min</b>',
      body: 'Martian dust is toxic, abrasive and electrostatically clingy — it is a chemical exposure problem wearing a housekeeping costume. Suits live outside the pressure envelope on suitports wherever the mission allows; the cycling lock handles cargo and contingency, with brush-down and an electrostatic curtain on the way in. That curtain is recorded in the study as its least mature system, with a degraded mode that assumes it never works.',
      basis: 'BASIS — Soil chemistry: Phoenix and Curiosity (perchlorates ≈ 0.5 wt%). Suitport architecture: NASA concept studies. Dust behaviour in locks: analogue campaign experience, Utah.'
    },
    power: {
      title: 'Power — fission + solar',
      spec: 'BACKBONE <b>2 × 10 kWe fission (N+1)</b> · ARRAY <b>120 m², dust-derated −40%</b> · STORM MODE <b>keep-alive load defined</b>',
      body: 'Sunlight at Mars is 590 W/m² before the atmosphere, the dust and the season take their shares — and a global storm can hold output down for weeks. So life support never rides on the array: two Kilopower-class fission units carry the critical load with one spare, solar handles the day shift, and the study defines in advance which loads die first when the sky goes dark. That list is a design document, not an improvisation.',
      basis: 'BASIS — Solar constant at 1.52 AU. Fission reference: Kilopower / KRUSTY ground test (NASA, 2018). Storm derating: 2018 global dust storm opacity records.'
    }
  };

  var title = document.getElementById('sysTitle');
  if (title) {
    var spec = document.getElementById('sysSpec');
    var body = document.getElementById('sysBody');
    var basis = document.getElementById('sysBasis');
    var buttons = Array.prototype.slice.call(document.querySelectorAll('.sys-btn'));
    var spots = Array.prototype.slice.call(document.querySelectorAll('.hotspot'));

    function selectSys(key, focusBtn) {
      var s = SYSTEMS[key];
      if (!s) return;
      title.textContent = s.title;
      spec.innerHTML = s.spec;
      body.textContent = s.body;
      basis.textContent = s.basis;
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-sys') === key ? 'true' : 'false');
      });
      spots.forEach(function (g) {
        var c = g.querySelector('circle');
        if (c) c.setAttribute('fill', g.getAttribute('data-sys') === key ? '#e08a54' : '#171310');
      });
      if (focusBtn) {
        var btn = buttons.filter(function (b) { return b.getAttribute('data-sys') === key; })[0];
        if (btn) btn.focus();
      }
    }
    buttons.forEach(function (b) {
      b.addEventListener('click', function () { selectSys(b.getAttribute('data-sys'), false); });
    });
    spots.forEach(function (g) {
      g.addEventListener('click', function () { selectSys(g.getAttribute('data-sys'), false); });
    });
    selectSys('berm', false);
  }

  /* ---------- reveal on scroll (motion-safe) ---------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('.reveal');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- lightbox (projects page) ---------- */
  var lb = document.getElementById('lightbox');
  if (lb) {
    var lbImg = document.getElementById('lbImg');
    var lbCap = document.getElementById('lbCap');
    var photoBtns = Array.prototype.slice.call(document.querySelectorAll('.photo-btn'));
    var current = 0;
    var lastFocus = null;

    function show(i) {
      current = (i + photoBtns.length) % photoBtns.length;
      var img = photoBtns[current].querySelector('img');
      lbImg.src = img.getAttribute('src');
      lbImg.alt = img.getAttribute('alt');
      lbCap.textContent = photoBtns[current].getAttribute('data-cap') || img.getAttribute('alt');
    }
    function openLb(i, btn) {
      lastFocus = btn;
      show(i);
      lb.classList.add('open');
      document.getElementById('lbClose').focus();
    }
    function closeLb() {
      lb.classList.remove('open');
      if (lastFocus) lastFocus.focus();
    }
    photoBtns.forEach(function (btn, i) {
      btn.addEventListener('click', function () { openLb(i, btn); });
    });
    document.getElementById('lbClose').addEventListener('click', closeLb);
    document.getElementById('lbPrev').addEventListener('click', function () { show(current - 1); });
    document.getElementById('lbNext').addEventListener('click', function () { show(current + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
  }

  /* ---------- enquiry form (contact page) ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirmBox = document.getElementById('confirmBox');
    var fields = {
      name: { wrap: document.getElementById('f-name'), input: document.getElementById('inName'),
              test: function (v) { return v.trim().length > 1; } },
      email: { wrap: document.getElementById('f-email'), input: document.getElementById('inEmail'),
               test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
      msg: { wrap: document.getElementById('f-msg'), input: document.getElementById('inMsg'),
             test: function (v) { return v.trim().length >= 20; } }
    };
    function validate(key, mark) {
      var f = fields[key];
      var ok = f.test(f.input.value);
      if (mark) f.wrap.classList.toggle('invalid', !ok);
      return ok;
    }
    Object.keys(fields).forEach(function (key) {
      fields[key].input.addEventListener('input', function () {
        if (fields[key].wrap.classList.contains('invalid')) validate(key, true);
      });
      fields[key].input.addEventListener('blur', function () {
        if (fields[key].input.value.length) validate(key, true);
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var okName = validate('name', true);
      var okEmail = validate('email', true);
      var okMsg = validate('msg', true);
      if (!okName || !okEmail || !okMsg) {
        var firstBad = !okName ? fields.name.input : (!okEmail ? fields.email.input : fields.msg.input);
        firstBad.focus();
        return;
      }
      var typeSel = document.getElementById('inType');
      var typeLabel = typeSel.options[typeSel.selectedIndex].textContent;
      var ref = 'SH-2026-' + String(Math.floor(100 + Math.random() * 900));
      document.getElementById('confirmRef').textContent = ref;
      document.getElementById('confirmSummary').textContent =
        'Filed by ' + fields.name.input.value.trim() + ' — commission type: ' + typeLabel + '.';
      form.style.display = 'none';
      confirmBox.classList.add('show');
      confirmBox.setAttribute('tabindex', '-1');
      confirmBox.focus();
    });
    document.getElementById('againBtn').addEventListener('click', function () {
      form.reset();
      Object.keys(fields).forEach(function (key) { fields[key].wrap.classList.remove('invalid'); });
      confirmBox.classList.remove('show');
      form.style.display = '';
      fields.name.input.focus();
    });
  }
})();
