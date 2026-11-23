/* Fossil Stratum — the stratigraphic column.
   Vanilla JS: mobile column-index menu, the Strata Explorer, the
   preparation estimator, enquiry form.
   Sound ruling: NO audio anywhere on this site. The trade is stone;
   nothing here would teach through audio, so the need-test fails and
   the site stays silent — no autoplay, no hover sound, no synth. */
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

  /* ---------- mobile menu: the column index ---------- */
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

  /* ---------- reveal on scroll (opacity + slight rise, reduced-motion safe) ---------- */
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
     THE STRATA EXPLORER
     One data object per period, printed verbatim into the sheet.
     Ages: International Chronostratigraphic Chart (ICS, 2023),
     millions of years before present. Column order is the standard
     timescale, youngest first — the probe asserts both.
     ================================================================ */
  var PERIODS = {
    quaternary: {
      name: 'Quaternary', era: 'Cenozoic Era · the current period',
      age: '2.58 million years ago — present (2.58 million years, and counting)',
      index: 'Mammoth and woolly rhinoceros remains in cave and river deposits; pollen sequences in lake beds do the fine dating. The youngest fossils on the bench, and often the most fragile.',
      rock: 'Cave earths, river gravels, loess and peat — sediments, barely rock at all.',
      prep: 'Mostly consolidation, not removal: bone from cave earth is cleaned, dried slowly and consolidated before it can be handled. Freeze-drying for waterlogged material; nothing here wants an air scribe.',
      note: ''
    },
    neogene: {
      name: 'Neogene', era: 'Cenozoic Era · mammals diversify',
      age: '23.03 — 2.58 million years ago (20.45 million years)',
      index: 'Marine bivalves and gastropods; on land, the teeth of three-toed horses and other grazing mammals track the spread of grasslands.',
      rock: 'Sands, clays and shelly crags — soft, often barely consolidated.',
      prep: 'Gentle work: brushes, screen-washing of sediment for microfossils, consolidant early and often. Specimens can be ruined by enthusiasm faster than by the rock.',
      note: ''
    },
    paleogene: {
      name: 'Paleogene', era: 'Cenozoic Era · the recovery after the K–Pg extinction',
      age: '66.0 — 23.03 million years ago (42.97 million years)',
      index: 'Nummulites — coin-sized foraminifera so abundant they build limestones — and early mammal teeth in the clay faunas.',
      rock: 'Clays (London Clay and its kin), sands and freshwater limestones.',
      prep: 'London Clay fossils are pyritised and exquisite — and pyrite decay is their lifelong threat. Prep is quick; the humidity-controlled aftercare plan is half the job.',
      note: ''
    },
    cretaceous: {
      name: 'Cretaceous', era: 'Mesozoic Era · the last of the dinosaur periods',
      age: '145.0 — 66.0 million years ago (79.0 million years)',
      index: 'Ammonites to the very top of the period, inoceramid bivalves, belemnites — and in the chalk, foraminifera fine enough to date a single bed.',
      rock: 'Chalk above all; also greensands, gault clay and hard flint nodules.',
      prep: 'Chalk is soft and kind: needles and gentle air abrasion. Flint is the opposite — a nodule can be harder than the fossil inside it, and those jobs are quoted slowly and honestly.',
      note: 'THE BOUNDARY AT ITS TOP: the Cretaceous ends at 66.0 Ma with the K–Pg extinction — the iridium layer, the end of the ammonites and of every dinosaur lineage except the birds. A Cretaceous specimen sits below that line in time; a Paleogene one above it.'
    },
    jurassic: {
      name: 'Jurassic', era: 'Mesozoic Era · “Age of Reptiles”',
      age: '201.4 — 145.0 million years ago (56.4 million years)',
      index: 'Ammonites — a new fauna every few hundred thousand years, which is what makes them the finest clock in the column. Belemnite guards and the oyster Gryphaea support them in marine beds.',
      rock: 'Blue Lias limestone and shale on this coast; mudstones, sandstones and oolitic limestones inland.',
      prep: 'Hard limestone nodules: air scribe for bulk, needle under the microscope for the last millimetre. Pyritised specimens from the shale need humidity control for life — pyrite decay is the slow enemy, not the scribe.',
      note: ''
    },
    triassic: {
      name: 'Triassic', era: 'Mesozoic Era · the recovery after the Great Dying',
      age: '251.9 — 201.4 million years ago (50.5 million years)',
      index: 'Ceratite ammonoids in marine beds; conodont elements — microscopic tooth-like fossils — do the fine dating almost everywhere.',
      rock: 'Red sandstones and mudstones on land; bonebeds at formation bases.',
      prep: 'Bonebeds are prepped backwards: the slab is consolidated face-down and worked from behind. Red sandstone is honest, medium-hard scribe work; microvertebrates come out by acid and sieve.',
      note: 'THE BOUNDARY AT ITS BASE: the Triassic begins at 251.9 Ma, immediately after the Permian–Triassic extinction — the largest in the record, when the great majority of marine species vanished. Triassic fossils are the recovery, written in stone.'
    },
    permian: {
      name: 'Permian', era: 'Paleozoic Era · the last period before the Great Dying',
      age: '298.9 — 251.9 million years ago (47.0 million years)',
      index: 'Fusulinid foraminifera — rice-grain fossils that build whole limestones — and, on land, the sail-backed Dimetrodon fauna.',
      rock: 'Red beds, desert sandstones and reef limestones.',
      prep: 'Hard, dry rock: slow scribe work with heavy consolidation of bone that has spent 270 million years in a desert. Specimens often arrive as fragments and leave as a jigsaw, honestly labelled as such.',
      note: ''
    },
    carboniferous: {
      name: 'Carboniferous', era: 'Paleozoic Era · the coal forests',
      age: '358.9 — 298.9 million years ago (60.0 million years)',
      index: 'Crinoids and productid brachiopods in the limestones; in the coal measures, the giant clubmoss Lepidodendron and its root, Stigmaria.',
      rock: 'Two worlds: pale crinoidal limestone, and black coal-measure shale.',
      prep: 'Coal-shale plant fossils are compressions — there is nothing to prepare, only to split cleanly and conserve; a scribe would destroy them. The limestones, by contrast, are among the hardest rocks on this bench.',
      note: ''
    },
    devonian: {
      name: 'Devonian', era: 'Paleozoic Era · “Age of Fishes”',
      age: '419.2 — 358.9 million years ago (60.3 million years)',
      index: 'Goniatite ammonoids, spiriferid brachiopods, and the placoderms — armoured fish — that give the period its name.',
      rock: 'Old Red Sandstone on land; grey marine limestones and shales at sea.',
      prep: 'Old Red Sandstone fish plates are hard, patient scribe work, and the fish are often preserved as natural moulds — the skill is knowing when the fossil is the hole, not the bone.',
      note: ''
    },
    silurian: {
      name: 'Silurian', era: 'Paleozoic Era · life steadies after the Ordovician extinction',
      age: '443.8 — 419.2 million years ago (24.6 million years)',
      index: 'Graptolites — Monograptus and its kin, saw-blade fossils that evolve fast and date Wenlock and Ludlow shales bed by bed.',
      rock: 'Grey shales and mudstones, with reef limestones.',
      prep: 'Graptolite shales split along the bedding and ask for nothing but a steady hand and a good light. Preparation here is mostly conservation: the shale delaminates, and stopping that is the job.',
      note: ''
    },
    ordovician: {
      name: 'Ordovician', era: 'Paleozoic Era · the great diversification of marine life',
      age: '485.4 — 443.8 million years ago (41.6 million years)',
      index: 'Graptolites in the shales, trilobites everywhere, and brachiopods in bewildering variety.',
      rock: 'Dark mudstones and shales; volcanic ash beds that date them precisely.',
      prep: 'Trilobites in limestone nodules are fine scribe-and-needle work, often with the animal enrolled — rolled up like a woodlouse — so the prep spirals as the animal does.',
      note: ''
    },
    cambrian: {
      name: 'Cambrian', era: 'Paleozoic Era · the first period of the Phanerozoic',
      age: '538.8 — 485.4 million years ago (53.4 million years)',
      index: 'Trilobites — Paradoxides in the mid-Cambrian, Olenellus earlier — the first index fossils of the column, and still among the best.',
      rock: 'Shales and mudstones, including the Burgess Shale type of exceptional preservation.',
      prep: 'The oldest work on the bench, and the most delicate: soft-bodied preservation in shale is a film of carbon, prepared by splitting, photography and restraint. The correct tool is often no tool.',
      note: ''
    }
  };
  var ORDER = ['quaternary', 'neogene', 'paleogene', 'cretaceous', 'jurassic', 'triassic', 'permian', 'carboniferous', 'devonian', 'silurian', 'ordovician', 'cambrian'];

  var periodBtns = document.querySelectorAll('.period-btn');
  if (periodBtns.length) {
    var shName = document.getElementById('shName');
    var shEra = document.getElementById('shEra');
    var shAge = document.getElementById('shAge');
    var shIndex = document.getElementById('shIndex');
    var shRock = document.getElementById('shRock');
    var shPrep = document.getElementById('shPrep');
    var shNote = document.getElementById('shNote');
    function selectPeriod(key) {
      var p = PERIODS[key];
      if (!p) return;
      shName.textContent = p.name;
      shEra.textContent = p.era;
      shAge.textContent = p.age;
      shIndex.textContent = p.index;
      shRock.textContent = p.rock;
      shPrep.textContent = p.prep;
      if (p.note) { shNote.textContent = p.note; shNote.hidden = false; }
      else { shNote.textContent = ''; shNote.hidden = true; }
      periodBtns.forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-period') === key ? 'true' : 'false');
      });
    }
    periodBtns.forEach(function (b) {
      b.addEventListener('click', function () { selectPeriod(b.getAttribute('data-period')); });
    });
    selectPeriod('jurassic');
  }

  /* ================================================================
     THE PREPARATION ESTIMATOR
     The model, exactly as printed on the page:
     hours = 2 + length / rate, rate in cm per bench hour —
     soft 15, limestone 8, hard 4.5. Band = 0.85x to 1.25x, rounded.
     Price = band hours x £45, rounded to the nearest £5.
     ================================================================ */
  var RATES = { soft: 15, limestone: 8, hard: 4.5 };
  var slider = document.getElementById('sizeSlider');
  if (slider) {
    var sizeOut = document.getElementById('sizeOut');
    var estHours = document.getElementById('estHours');
    var estPrice = document.getElementById('estPrice');
    var hardBtns = document.querySelectorAll('.hard-btn');
    var hard = 'limestone';
    function round5(n) { return Math.round(n / 5) * 5; }
    function fmtGBP(n) { return '£' + n.toLocaleString('en-GB'); }
    function updateEst() {
      var cm = parseFloat(slider.value);
      sizeOut.textContent = cm;
      var central = 2 + cm / RATES[hard];
      var lo = Math.round(central * 0.85);
      var hi = Math.round(central * 1.25);
      estHours.textContent = lo + '–' + hi + ' hours';
      estPrice.textContent = fmtGBP(round5(lo * 45)) + ' – ' + fmtGBP(round5(hi * 45));
    }
    slider.addEventListener('input', updateEst);
    hardBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        hard = b.getAttribute('data-hard');
        hardBtns.forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        updateEst();
      });
    });
    updateEst();
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
      var ref = 'FS-2026-' + (100 + (h % 900));
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
