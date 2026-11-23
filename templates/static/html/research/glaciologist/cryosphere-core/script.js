/* Cryosphere Core — the core log.
   Vanilla JS: mobile log-index menu, the Depth–Age Explorer, enquiry form.
   Sound ruling: NO audio anywhere on this site. The trade is ice, not
   sound; nothing here would teach through audio, so the need-test fails
   and the site stays silent — no autoplay, no hover sound, no synth. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* View-transition aborts surface as unhandled rejections in Chrome;
     the navigation itself always completes. Swallow only that case. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- mobile menu: the log index ---------- */
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('mobilePanel');
  if (btn && panel) {
    var firstLink = panel.querySelector('nav a');
    function openMenu() {
      panel.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
      requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
    }
    function closeMenu(returnFocus) {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
      if (returnFocus) btn.focus();
    }
    btn.addEventListener('click', function () {
      if (panel.classList.contains('open')) closeMenu(false); else openMenu();
    });
    var closeBtn = document.getElementById('menuClose');
    if (closeBtn) closeBtn.addEventListener('click', function () { closeMenu(true); });
    panel.addEventListener('click', function (e) { if (e.target === panel) closeMenu(true); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closeMenu(true);
    });
    panel.querySelectorAll('nav a').forEach(function (a) {
      a.addEventListener('click', function () { closeMenu(false); });
    });
  }

  /* ---------- reveal on scroll (opacity only, reduced-motion safe) ---------- */
  var rvEls = document.querySelectorAll('.rv');
  if (rvEls.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.06 });
    rvEls.forEach(function (el) { io.observe(el); });
  } else {
    rvEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ================================================================
     THE DEPTH–AGE EXPLORER
     The model, exactly as printed on the page: a composite teaching
     model shaped like a real polar depth–age curve. Piecewise-linear
     between anchor points. Ages in years before present (BP).
     ================================================================ */
  var ANCHORS = [
    [0, 0], [100, 450], [400, 2600], [800, 11700], [1100, 20500],
    [1700, 58000], [2200, 129000], [2600, 245000], [2900, 420000],
    [3100, 640000], [3200, 800000]
  ];
  var ERUPTIONS = [
    { name: 'Pinatubo', year: 1991 },
    { name: 'Agung', year: 1963 },
    { name: 'Krakatau', year: 1883 },
    { name: 'Tambora', year: 1815 },
    { name: 'Unknown eruption', year: 1809 },
    { name: 'Samalas', year: 1257 }
  ];
  var PRESENT = 2026;

  function ageAt(d) {
    if (d <= 0) return 0;
    for (var i = 1; i < ANCHORS.length; i++) {
      if (d <= ANCHORS[i][0]) {
        var d0 = ANCHORS[i - 1][0], a0 = ANCHORS[i - 1][1];
        var d1 = ANCHORS[i][0], a1 = ANCHORS[i][1];
        return a0 + (a1 - a0) * (d - d0) / (d1 - d0);
      }
    }
    return 800000;
  }
  function depthForAge(a) {
    if (a <= 0) return 0;
    for (var i = 1; i < ANCHORS.length; i++) {
      if (a <= ANCHORS[i][1]) {
        var d0 = ANCHORS[i - 1][0], a0 = ANCHORS[i - 1][1];
        var d1 = ANCHORS[i][0], a1 = ANCHORS[i][1];
        return d0 + (d1 - d0) * (a - a0) / (a1 - a0);
      }
    }
    return 3200;
  }
  function yearsPerMetre(d) {
    for (var i = 1; i < ANCHORS.length; i++) {
      if (d < ANCHORS[i][0] || i === ANCHORS.length - 1) {
        return (ANCHORS[i][1] - ANCHORS[i - 1][1]) / (ANCHORS[i][0] - ANCHORS[i - 1][0]);
      }
    }
    return 1600;
  }
  function fmt(n) { return Math.round(n).toLocaleString('en-GB'); }
  function fmtAge(age) {
    var r = age < 1000 ? Math.round(age) : (age < 10000 ? Math.round(age / 10) * 10 : Math.round(age / 100) * 100);
    return fmt(r);
  }
  function eraAt(age) {
    if (age < 11700) return ['Holocene — the current interglacial',
      'Every layer in this band fell as snow in a climate broadly like today\u2019s. The youngest firn at the very top holds air from the last few decades.'];
    if (age < 27000) return ['Last glacial — the late stage',
      'The ice sheets were near their greatest extent: around 20,000 years ago (the Last Glacial Maximum, in this band) global sea level stood roughly 120 m lower than today.'];
    if (age < 57000) return ['Last glacial — the long cold middle',
      'Tens of thousands of years of cold, dry, windy climate. Snowfall was lower and dust far higher; the core here is visibly greyer.'];
    if (age < 123000) return ['Last glacial — the early stage',
      'The long slide into the ice age, layer by layer. Isotope ratios in the ice itself carry the temperature signal through this whole band.'];
    if (age < 130000) return ['Last interglacial — the Eemian',
      'A warm interval slightly warmer than the Holocene: sea level stood roughly 6\u20139 m higher than today. This is the band planners ask about most \u2014 it is the nearest thing the record has to a rehearsal.'];
    if (age < 430000) return ['Earlier glacial cycles',
      'Three more full ice-age cycles are stacked through this ice, each with its cold, dusty glacial and its brief warm interglacial.'];
    return ['The oldest ice in the core',
      'Eight glacial cycles in total. Down here a year of snowfall has been squeezed thinner than a fingernail, so this ice is dated by gas records and flow modelling, not by counting layers.'];
  }
  function co2At(age) {
    if (age < 11700) return '<strong>\u2248260\u2013285 ppm</strong> across the preindustrial Holocene. For scale, the air outside today measures \u2248425 ppm \u2014 the bubbles are how we know the difference is us.';
    if (age < 123000) return '<strong>\u2248180\u2013210 ppm</strong> \u2014 about 190 ppm at the glacial maximum. Glacial air was thin in CO\u2082; the bubbles prove it directly, no proxy needed.';
    if (age < 130000) return '<strong>\u2248275\u2013290 ppm</strong> \u2014 interglacial air, much like the preindustrial Holocene\u2019s.';
    return '<strong>\u2248170\u2013300 ppm</strong>, swinging with the cycles: low in every glacial, high in every interglacial, for the full 800,000 years of this core.';
  }
  function dustAt(age) {
    if (age < 11700) return 'Low. Clean interglacial snow \u2014 a few particles per millilitre of meltwater.';
    if (age < 123000) return 'High. Glacial ice carries many times the Holocene dust load \u2014 wind-blown mineral dust from dry, exposed landscapes. In the core it shows as visible grey bands.';
    if (age < 130000) return 'Low again. Interglacials run clean; the dust switch is one of the sharpest signals in the whole log.';
    return 'Swinging with the cycles. Each glacial\u2019s dust peak is a rhythm the dating team uses as a cross-check.';
  }
  function sulfateAt(depth) {
    for (var i = 0; i < ERUPTIONS.length; i++) {
      var e = ERUPTIONS[i];
      var hd = depthForAge(PRESENT - e.year);
      if (Math.abs(depth - hd) <= 5) {
        if (e.name === 'Samalas') return '<span class="spike">Sulfate spike \u2014 Samalas, 1257.</span> The largest sulfate signal of the last two thousand years, from an eruption in Indonesia identified only in 2013. Horizons like this are the mileposts the whole timescale hangs from.';
        if (e.name === 'Unknown eruption') return '<span class="spike">Sulfate spike \u2014 the unknown eruption of 1809.</span> A major eruption nobody has yet matched to a volcano. It sits just below Tambora in the ice, and the pair of them pin this part of the timescale.';
        if (e.name === 'Tambora') return '<span class="spike">Sulfate spike \u2014 Tambora, 1815.</span> The eruption that caused the \u201cYear Without a Summer\u201d in 1816. Its sulfate, spread over several years of snow, is the most-used dating horizon in shallow cores \u2014 and the unknown 1809 spike sits just beneath it.';
        return '<span class="spike">Sulfate spike \u2014 ' + e.name + ', ' + e.year + '.</span> Volcanic sulfate from this eruption fell with the snow and stayed. Spikes like this are the mileposts the timescale hangs from.';
      }
    }
    return 'Background levels \u2014 no major eruption is recorded in this layer. Most of the core reads like this; the spikes are the exception, which is exactly why they work as mileposts.';
  }
  function layerAt(depth) {
    var cm = 100 / yearsPerMetre(depth);
    if (cm >= 0.95) return '\u2248 <strong>' + cm.toFixed(1) + ' cm of ice</strong> per year of snowfall at this depth, after compression.';
    var mm = cm * 10;
    return '\u2248 <strong>' + mm.toFixed(1) + ' mm of ice</strong> per year \u2014 the annual layers have been squeezed this thin by the weight above. They are no longer counted; this ice is dated by gas and flow modelling.';
  }

  var slider = document.getElementById('depthSlider');
  if (slider) {
    var outDepth = document.getElementById('depthOut');
    var roDepth = document.getElementById('roDepth');
    var roAge = document.getElementById('roAge');
    var roEra = document.getElementById('roEra');
    var roNote = document.getElementById('roNote');
    var roCO2 = document.getElementById('roCO2');
    var roSulfate = document.getElementById('roSulfate');
    var roDust = document.getElementById('roDust');
    var roLayer = document.getElementById('roLayer');
    var marker = document.getElementById('coreMarker');
    var markerLabel = document.getElementById('coreMarkerLabel');
    var presetBtns = document.querySelectorAll('.preset-btn');
    var PLOT_TOP = 18, PLOT_H = 540;
    function yFor(d) { return PLOT_TOP + d * PLOT_H / 3200; }

    function update() {
      var d = parseFloat(slider.value);
      var age = ageAt(d);
      outDepth.textContent = 'Depth ' + fmt(d) + ' m';
      roDepth.innerHTML = fmt(d) + ' <small>m below the surface</small>';
      var ageTxt = fmtAge(age) + ' <small>years before present</small>';
      if (age > 0 && age < 2000) ageTxt += '<br><small>snow that fell around ' + Math.round(PRESENT - age) + ' CE</small>';
      roAge.innerHTML = ageTxt;
      var era = eraAt(age);
      roEra.textContent = era[0];
      roNote.textContent = era[1];
      roCO2.innerHTML = co2At(age);
      roSulfate.innerHTML = sulfateAt(d);
      roDust.innerHTML = dustAt(age);
      roLayer.innerHTML = layerAt(d);
      if (marker) {
        var y = yFor(d).toFixed(1);
        marker.setAttribute('transform', 'translate(0,' + y + ')');
        if (markerLabel) markerLabel.textContent = fmt(d) + ' m';
      }
      presetBtns.forEach(function (b) {
        b.setAttribute('aria-pressed', Math.abs(parseFloat(b.getAttribute('data-depth')) - d) < 0.51 ? 'true' : 'false');
      });
    }
    slider.addEventListener('input', update);
    presetBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        slider.value = b.getAttribute('data-depth');
        update();
        slider.focus({ preventScroll: true });
      });
    });
    update();
  }

  /* ---------- enquiry form (contact page) ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var conf = document.getElementById('confirmation');
    function setInvalid(input, bad) {
      var field = input.closest('.field');
      if (field) field.classList.toggle('invalid', bad);
      input.setAttribute('aria-invalid', bad ? 'true' : 'false');
      return !bad;
    }
    function validate(input) {
      var v = (input.value || '').trim();
      if (input.id === 'f-email') return setInvalid(input, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v));
      if (input.id === 'f-msg') return setInvalid(input, v.length < 10);
      return setInvalid(input, v.length === 0);
    }
    ['f-name', 'f-email', 'f-type', 'f-msg'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('blur', function () { validate(el); });
        el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') validate(el); });
        el.addEventListener('change', function () { if (el.getAttribute('aria-invalid') === 'true') validate(el); });
      }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ids = ['f-name', 'f-email', 'f-type', 'f-msg'];
      var firstBad = null;
      ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && !validate(el) && !firstBad) firstBad = el;
      });
      if (firstBad) { firstBad.focus(); return; }
      var name = document.getElementById('f-name').value.trim();
      var email = document.getElementById('f-email').value.trim();
      var typeSel = document.getElementById('f-type');
      var typeTxt = typeSel.options[typeSel.selectedIndex].text;
      var seed = name + '|' + email, h = 0;
      for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 9973;
      var ref = 'NP-2026-' + (100 + (h % 900));
      document.getElementById('confRef').textContent = ref;
      document.getElementById('confWhat').textContent = typeTxt;
      form.hidden = true;
      conf.hidden = false;
      conf.setAttribute('tabindex', '-1');
      conf.focus({ preventScroll: false });
    });
    var again = document.getElementById('sendAnother');
    if (again) again.addEventListener('click', function () {
      form.reset();
      form.hidden = false;
      conf.hidden = true;
      document.getElementById('f-name').focus();
    });
  }
})();
