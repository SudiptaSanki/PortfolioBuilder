/* ============================================================
   Calloway Deep Science — script.js
   Sound ruling: NONE. The stub's sonar-ping audio button was a
   gimmick and fails the program's sound need-test; it is gone.
   The science is in the numbers.
   ============================================================ */

/* --- View-transition abort guard ----------------------------------
   Cross-document view transitions that Chrome aborts surface as an
   unhandled InvalidStateError rejection. Swallow ONLY that case. */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* --- Mobile menu --------------------------------------------------- */
(function () {
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('mobilePanel');
  if (!btn || !panel) return;
  var lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    panel.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('locked');
    requestAnimationFrame(function () {
      var first = panel.querySelector('a');
      if (first) first.focus();
    });
  }
  function close(restore) {
    panel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('locked');
    if (restore && lastFocus) lastFocus.focus();
  }
  btn.addEventListener('click', function () {
    panel.classList.contains('open') ? close(true) : open();
  });
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) close(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) close(true);
  });
})();

/* --- Reveal on scroll (opacity only; CSS gates reduced motion) ----- */
(function () {
  var els = document.querySelectorAll('.rv');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.08 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ============================================================
   THE DESCENT EXPLORER
   One data source drives the readout AND the printed zone table,
   so the two can never disagree.
   Pressure model (printed on the page): P = 1 + depth/10 atm.
   ============================================================ */
var ZONES = [
  { min: 0,    max: 200,   name: 'Sunlight', epi: 'Epipelagic',
    temp: 'Warm at the surface, cooling with depth — 28 °C in the tropics to near freezing in polar water',
    light: 'Full sunlight — photosynthesis happens here',
    note: 'Fishing fleets, divers near the top, and every research vessel’s home water. Almost everything the surface world knows about the ocean comes from this skin of it.' },
  { min: 200,  max: 1000,  name: 'Twilight', epi: 'Mesopelagic',
    temp: 'Falls through the thermocline — about 10 °C at the top, 4 °C at the base',
    light: 'Faint blue light — eyes can use it, plants cannot',
    note: 'Lanternfish commute up from here every night to feed — the largest migration on Earth, done daily, in the dark. Measuring what sinks out of this zone is measuring the ocean’s carbon pump.' },
  { min: 1000, max: 4000,  name: 'Midnight', epi: 'Bathypelagic',
    temp: 'About 4 °C — everywhere, all year',
    light: 'No sunlight at all — bioluminescence only',
    note: 'Sperm whales hunt at the top of this zone; below that, the only light is made by animals. Vent fields, seamounts and most of my working dives live here.' },
  { min: 4000, max: 6000,  name: 'Abyssal', epi: 'Abyssopelagic',
    temp: '2–3 °C',
    light: 'None',
    note: 'The abyssal plains — half the planet’s solid surface, and the least visited. Work-class ROV territory: slow, cold, methodical work over mud that has been undisturbed for millennia.' },
  { min: 6000, max: 11000, name: 'Hadal', epi: 'Hadalpelagic',
    temp: '1–2.5 °C — cold, but never quite freezing',
    light: 'None',
    note: 'The trenches. Named for Hades and earned. Free-falling landers and a handful of full-ocean-depth vehicles work here; everything else stays above the gate at 6,000 m.' }
];

var LANDMARKS = {
  0:     'The working day starts here: a ship, a weather window, and a vehicle worth more than the building it launched from.',
  200:   'The continental shelf break, and the base of the sunlight zone. Scuba is far above its limits by now — from here down, it is vehicles only.',
  1000:  'Base of the twilight zone. Sperm whales hunt squid at this depth. A crewed submersible’s cabin at this pressure is a sphere of titanium or steel, and nobody aboard is thinking about the view.',
  3800:  'The wreck of the Titanic lies at about 3,800 m, in the dark since 1912 — the most useful yardstick there is for what “deep” actually means.',
  6000:  'The hadal gate. Below this line, only full-ocean-depth vehicles and free-falling landers can go — fewer machines than have flown in space.',
  10900: 'Challenger Deep territory. The seafloor here — about 10,935 m down in the Mariana Trench — is the deepest known point on Earth. Crewed visits can be counted on two hands.'
};

function fmtInt(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function pressureAtm(d) { return 1 + d / 10; }
function zoneFor(d) {
  for (var i = 0; i < ZONES.length; i++) {
    if (d >= ZONES[i].min && d < ZONES[i].max) return { zone: ZONES[i], index: i };
  }
  var last = ZONES[ZONES.length - 1];
  return { zone: last, index: ZONES.length - 1 };
}

(function initExplorer() {
  var range = document.getElementById('depthRange');
  if (!range) return; // not the Log page
  var column = document.getElementById('column');
  var marker = document.getElementById('marker');
  var roDepth = document.getElementById('roDepth');
  var roZone = document.getElementById('roZone');
  var roPressure = document.getElementById('roPressure');
  var roWork = document.getElementById('roWork');
  var roTemp = document.getElementById('roTemp');
  var roLight = document.getElementById('roLight');
  var roNote = document.getElementById('roNote');
  var stops = Array.prototype.slice.call(document.querySelectorAll('.stop-btn'));
  var bands = Array.prototype.slice.call(document.querySelectorAll('.band'));
  var current = 0;

  /* Render the printed zone table from the same ZONES data. */
  var tbody = document.querySelector('#zoneTable tbody');
  if (tbody) {
    ZONES.forEach(function (z, i) {
      var tr = document.createElement('tr');
      tr.setAttribute('data-zone-row', i);
      var base = Math.min(z.max, 10900);
      var atm = pressureAtm(base);
      tr.innerHTML =
        '<td class="d">' + fmtInt(z.min) + '–' + fmtInt(base) + ' m</td>' +
        '<td><span class="zname">' + z.name + '</span>' + z.epi + '</td>' +
        '<td class="p">' + fmtInt(atm) + ' atm</td>' +
        '<td>' + z.temp + '</td>' +
        '<td>' + z.light + '</td>';
      tbody.appendChild(tr);
    });
  }
  var rows = tbody ? Array.prototype.slice.call(tbody.querySelectorAll('tr')) : [];

  function fractionForDepth(d) {
    var zf = zoneFor(d), z = zf.zone;
    var within = (d - z.min) / (z.max - z.min);
    return (zf.index + Math.min(within, 1)) / ZONES.length;
  }

  function setDepth(d, fromSlider) {
    d = Math.max(0, Math.min(10900, Math.round(d)));
    current = d;
    var zf = zoneFor(d), z = zf.zone;
    var atm = pressureAtm(d);
    var atmTxt = d < 100 ? (Math.round(atm * 10) / 10).toString() : fmtInt(atm);
    var bar = Math.round(atm * 1.013);
    var mpa = (bar / 10).toFixed(1);

    roDepth.textContent = fmtInt(d) + ' m';
    roZone.textContent = z.name + ' · ' + z.epi;
    roPressure.textContent = atmTxt + ' atm ≈ ' + fmtInt(bar) + ' bar (' + mpa + ' MPa)';
    roWork.textContent = 'Working: 1 + (' + fmtInt(d) + ' ÷ 10) = ' + atmTxt + ' atm';
    roTemp.textContent = z.temp;
    roLight.textContent = z.light;
    roNote.textContent = LANDMARKS[d] || z.note;

    var frac = fractionForDepth(d);
    var horizontal = window.matchMedia('(max-width: 1020px)').matches;
    if (horizontal) {
      marker.style.left = (frac * 100) + '%';
      marker.style.top = '';
    } else {
      marker.style.top = (frac * 100) + '%';
      marker.style.left = '';
    }
    bands.forEach(function (b, i) { b.classList.toggle('active', i === zf.index); });
    rows.forEach(function (r, i) { r.classList.toggle('current', i === zf.index); });
    stops.forEach(function (b) {
      b.setAttribute('aria-pressed', parseInt(b.getAttribute('data-depth'), 10) === d ? 'true' : 'false');
    });
    if (!fromSlider) range.value = d;
    range.setAttribute('aria-valuetext', fmtInt(d) + ' metres, ' + z.name + ' zone, ' + atmTxt + ' atmospheres');
    var dv = document.getElementById('depthValText');
    if (dv) dv.textContent = 'Currently at ' + fmtInt(d) + ' m — the ' + z.name.toLowerCase() + ' zone, ' + atmTxt + ' atm. Arrow keys fine-tune; the stops below jump to logged depths.';
  }

  range.addEventListener('input', function () { setDepth(parseInt(range.value, 10), true); });

  stops.forEach(function (b) {
    b.addEventListener('click', function () { setDepth(parseInt(b.getAttribute('data-depth'), 10)); });
  });

  /* Pointer on the drawn column: tap sets depth; mouse-drag scrubs.
     Touch drags are left to page scroll (touch-action: pan-y) —
     touch users get the slider and the stops, both full-size. */
  function depthFromPointer(e) {
    var r = column.getBoundingClientRect();
    var horizontal = window.matchMedia('(max-width: 1020px)').matches;
    var f = horizontal ? (e.clientX - r.left) / r.width : (e.clientY - r.top) / r.height;
    f = Math.max(0, Math.min(0.99999, f));
    var bandIdx = Math.floor(f * ZONES.length);
    var within = f * ZONES.length - bandIdx;
    var z = ZONES[bandIdx];
    return z.min + within * (z.max - z.min);
  }
  var dragging = false;
  column.addEventListener('pointerdown', function (e) {
    dragging = true;
    setDepth(depthFromPointer(e));
    if (e.pointerType === 'mouse') {
      try { column.setPointerCapture(e.pointerId); } catch (err) {}
    }
  });
  column.addEventListener('pointermove', function (e) {
    if (dragging && e.pointerType === 'mouse') setDepth(depthFromPointer(e));
  });
  column.addEventListener('pointerup', function () { dragging = false; });
  column.addEventListener('pointercancel', function () { dragging = false; });

  window.addEventListener('resize', function () { setDepth(current); });
  setDepth(0);
})();

/* --- Enquiry form (contact page only) ------------------------------ */
(function initForm() {
  var form = document.getElementById('enquiryForm');
  if (!form) return;
  var confirmBox = document.getElementById('confirmBox');
  var confirmRef = document.getElementById('confirmRef');
  var confirmEcho = document.getElementById('confirmEcho');
  var againBtn = document.getElementById('againBtn');

  var fields = {
    name:  { el: document.getElementById('fName'), ok: function (v) { return v.trim().length >= 2; } },
    email: { el: document.getElementById('fEmail'), ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
    org:   { el: document.getElementById('fOrg'), ok: function (v) { return v.trim().length >= 2; } },
    type:  { el: document.getElementById('fType'), ok: function (v) { return v !== ''; } },
    message: { el: document.getElementById('fMsg'), ok: function (v) { return v.trim().length >= 20; } }
  };

  function validate(key) {
    var f = fields[key];
    var good = f.ok(f.el.value);
    f.el.closest('.field').classList.toggle('invalid', !good);
    f.el.setAttribute('aria-invalid', good ? 'false' : 'true');
    return good;
  }
  Object.keys(fields).forEach(function (key) {
    var el = fields[key].el;
    el.addEventListener('input', function () {
      if (el.closest('.field').classList.contains('invalid')) validate(key);
    });
    el.addEventListener('change', function () {
      if (el.closest('.field').classList.contains('invalid')) validate(key);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var keys = Object.keys(fields);
    var results = keys.map(validate);
    if (results.indexOf(false) !== -1) {
      var firstBad = fields[keys[results.indexOf(false)]].el;
      firstBad.focus();
      return;
    }
    /* Deterministic reference from the enquiry itself. */
    var seed = (fields.name.el.value + '|' + fields.email.el.value + '|' + fields.message.el.value).split('')
      .reduce(function (a, c) { return ((a * 31) + c.charCodeAt(0)) % 900; }, 7);
    var ref = 'CD-2026-' + (100 + seed);
    confirmRef.textContent = ref;
    var typeText = fields.type.el.options[fields.type.el.selectedIndex].text;
    confirmEcho.textContent = 'Logged for ' + fields.name.el.value.trim() + ' (' + fields.org.el.value.trim() + ') — ' + typeText + '.';
    form.style.display = 'none';
    confirmBox.classList.add('show');
    confirmBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  if (againBtn) {
    againBtn.addEventListener('click', function () {
      form.reset();
      Object.keys(fields).forEach(function (key) {
        fields[key].el.closest('.field').classList.remove('invalid');
        fields[key].el.setAttribute('aria-invalid', 'false');
      });
      confirmBox.classList.remove('show');
      form.style.display = '';
      fields.name.el.focus();
    });
  }
})();
