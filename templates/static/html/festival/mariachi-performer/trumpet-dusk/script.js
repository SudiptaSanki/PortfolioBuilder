/* Trumpet Dusk — Mariachi Solano
   Songbook explorer + serenata programme builder, mobile menu,
   reveal-on-scroll, enquiry form. No audio anywhere: a mariachi's
   sound is voices and strings in a room, and this page will not
   fake it with a synthesiser. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* View-transition aborts surface as unhandled rejections in Chrome;
     swallow only that exact artefact, nothing else. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- mobile menu ---------- */
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('menuPanel');
  if (btn && panel) {
    var open = false;
    function setMenu(state, focus) {
      open = state;
      panel.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && focus !== false) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            var first = panel.querySelector('a');
            if (first) first.focus();
          });
        });
      }
      if (!open && focus) btn.focus();
    }
    btn.addEventListener('click', function () { setMenu(!open); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) setMenu(false, true);
    });
    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false, false); });
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 820 && open) setMenu(false, false);
    });
  }

  /* ---------- reveal on scroll ---------- */
  var rvEls = document.querySelectorAll('.rv');
  if (rvEls.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      rvEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      rvEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- songbook explorer + serenata builder ---------- */
  var TUNES = {
    mananitas:   { title: 'Las Mañanitas', style: 'Vals', meter: '3/4', key: 'G major', bpm: 96, beats: 3, bars: 96,
                   form: 'Verses and chorus, sung by the whole group',
                   hired: 'Birthday and Mother\u2019s Day serenatas \u2014 the 6 a.m. call',
                   note: 'The serenata opener. It is played as the honoree comes to the door, so the arrangement front-loads the chorus everyone knows and holds the last verse until they are standing in front of the band.' },
    cielito:     { title: 'Cielito Lindo', style: 'Son', meter: '3/4', key: 'C major', bpm: 126, beats: 3, bars: 96,
                   form: 'Verse \u2013 chorus, chorus sung twice',
                   hired: 'Wedding receptions \u2014 the song the whole room sings',
                   note: 'Ninety years of weddings have made this the safest second song in the book: guests who know no Spanish at all still know the \u201Cay, ay, ay, ay\u201D. We keep the tempo brisk so it lifts rather than settles.' },
    elrey:       { title: 'El Rey', style: 'Ranchera', meter: '3/4', key: 'A major', bpm: 100, beats: 3, bars: 80,
                   form: 'Two verses, grito break before the final chorus',
                   hired: 'The father\u2019s or groom\u2019s request \u2014 and the closing number',
                   note: 'Jos\u00E9 Alfredo Jim\u00E9nez\u2019s defiant standard. It needs a singer who can hold the room without shouting; our arrangement leaves a full bar of silence before the last chorus, which is where the grito lands.' },
    besame:      { title: 'B\u00E9same Mucho', style: 'Bolero', meter: '4/4', key: 'D minor', bpm: 76, beats: 4, bars: 64,
                   form: 'Bolero AABA with a rubato introduction',
                   hired: 'Anniversary serenatas and dinner sets',
                   note: 'The slow one. Played at 76 beats a minute with the trumpets muted, it is the song couples ask for by name on anniversaries \u2014 and the one we never rush, whatever the schedule says.' },
    negra:       { title: 'El Son de la Negra', style: 'Son jalisciense', meter: '6/8', key: 'G major', bpm: 152, beats: 2, bars: 192,
                   form: 'Four strains, each repeated, violins in unison',
                   hired: 'Festival stages \u2014 the full-ensemble opener',
                   note: 'The test piece of the son repertoire: four strains at full tilt, trumpets and violins trading the lead. It only works with the full nine-piece group, and it is how we open every festival set.' },
    volver:      { title: 'Volver, Volver', style: 'Ranchera', meter: '3/4', key: 'G major', bpm: 104, beats: 3, bars: 72,
                   form: 'Verse \u2013 chorus, tempo held back a breath',
                   hired: 'Late-night requests and cantina sets',
                   note: 'Fernando Z. Maldonado\u2019s song of return. Requests for it arrive after midnight, usually from one table, and the rest of the room goes quiet by the second verse. We play it a touch under tempo on purpose.' },
    guadalajara: { title: 'Guadalajara', style: 'Son', meter: '6/8', key: 'D major', bpm: 144, beats: 2, bars: 160,
                   form: 'Son strains with unison violin breaks',
                   hired: 'Quincea\u00F1era entrances and hometown crowds',
                   note: 'Pepe Gu\u00EDzar\u2019s hymn to the city mariachi comes from. For quincea\u00F1era entrances we time the first strain to the walk down the stairs \u2014 it is rehearsed with the choreographer, not improvised on the night.' },
    labamba:     { title: 'La Bamba', style: 'Son jarocho', meter: '4/4', key: 'C major', bpm: 156, beats: 4, bars: 96,
                   form: 'Call-and-response verses over the son groove',
                   hired: 'Dance-floor closer, school and community events',
                   note: 'From Veracruz, not Jalisco \u2014 we say so when we introduce it. At 156 a minute it is the closer that gets non-dancers up, and the verses are traded between the two lead singers.' }
  };

  function tuneSeconds(t) { return Math.round(t.bars * t.beats * 60 / t.bpm); }
  function fmt(sec) { return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }

  var rows = document.querySelectorAll('.tune-row');
  var sheet = document.getElementById('tuneSheet');
  if (rows.length && sheet) {
    var current = 'mananitas';
    var programme = [];

    function renderSheet(id) {
      var t = TUNES[id];
      current = id;
      rows.forEach(function (r) { r.setAttribute('aria-pressed', r.dataset.tune === id ? 'true' : 'false'); });
      sheet.querySelector('.sheet-title').textContent = t.title;
      sheet.querySelector('.sheet-style').textContent = t.style + ' \u00B7 in the group\u2019s book since 2011';
      sheet.querySelector('.d-key').textContent = t.key;
      sheet.querySelector('.d-meter').textContent = t.meter;
      sheet.querySelector('.d-tempo').textContent = t.bpm + (t.meter === '6/8' ? ' dotted-quarter beats/min' : ' beats/min');
      sheet.querySelector('.d-form').textContent = t.form;
      sheet.querySelector('.d-arr').textContent = t.bars + ' bars, as arranged for the group';
      sheet.querySelector('.d-dur').textContent = fmt(tuneSeconds(t)) + ' (' + tuneSeconds(t) + ' sec)';
      sheet.querySelector('.d-hired').textContent = t.hired;
      sheet.querySelector('.sheet-note').textContent = t.note;
      var addBtn = sheet.querySelector('.add-btn');
      addBtn.textContent = 'Add \u201C' + t.title + '\u201D to the serenata';
    }

    var serList = document.getElementById('serList');
    var serEmpty = document.getElementById('serEmpty');
    var serTotal = document.getElementById('serTotal');
    var serCount = document.getElementById('serCount');
    var serTime = document.getElementById('serTime');

    function renderProgramme() {
      serList.innerHTML = '';
      var total = 0;
      programme.forEach(function (id, idx) {
        var t = TUNES[id];
        var sec = tuneSeconds(t);
        total += sec;
        var li = document.createElement('li');
        var title = document.createElement('span');
        title.className = 's-title'; title.textContent = t.title;
        var dur = document.createElement('span');
        dur.className = 's-dur'; dur.textContent = fmt(sec);
        var rm = document.createElement('button');
        rm.className = 's-rm'; rm.type = 'button';
        rm.setAttribute('aria-label', 'Remove ' + t.title + ' from the serenata');
        rm.textContent = '\u00D7';
        rm.addEventListener('click', function () {
          programme.splice(idx, 1);
          renderProgramme();
        });
        li.appendChild(title); li.appendChild(dur); li.appendChild(rm);
        serList.appendChild(li);
      });
      serEmpty.hidden = programme.length > 0;
      serTotal.hidden = programme.length === 0;
      serCount.textContent = programme.length + (programme.length === 1 ? ' song' : ' songs');
      serTime.textContent = fmt(total);
    }

    rows.forEach(function (r) {
      r.addEventListener('click', function () { renderSheet(r.dataset.tune); });
    });
    sheet.querySelector('.add-btn').addEventListener('click', function () {
      programme.push(current);
      renderProgramme();
    });
    var clearBtn = document.getElementById('serClear');
    if (clearBtn) clearBtn.addEventListener('click', function () { programme = []; renderProgramme(); });

    window.Songbook = {
      seconds: function (id) { return tuneSeconds(TUNES[id]); },
      total: function () { return programme.reduce(function (a, id) { return a + tuneSeconds(TUNES[id]); }, 0); },
      count: function () { return programme.length; },
      current: function () { return current; }
    };
    renderSheet('mananitas');
    renderProgramme();
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirm = document.getElementById('formConfirm');
    function validateField(field) {
      var input = field.querySelector('input,select,textarea');
      var bad = false;
      if (input.hasAttribute('required') && !input.value.trim()) bad = true;
      if (!bad && input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) bad = true;
      field.classList.toggle('invalid', bad);
      return !bad;
    }
    form.querySelectorAll('.field').forEach(function (field) {
      var input = field.querySelector('input,select,textarea');
      input.addEventListener('input', function () { if (field.classList.contains('invalid')) validateField(field); });
      input.addEventListener('change', function () { if (field.classList.contains('invalid')) validateField(field); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var allOk = true, firstBad = null;
      form.querySelectorAll('.field').forEach(function (field) {
        if (!validateField(field)) { allOk = false; if (!firstBad) firstBad = field; }
      });
      if (!allOk) {
        var inp = firstBad.querySelector('input,select,textarea');
        if (inp) inp.focus();
        return;
      }
      var name = form.querySelector('#fName').value.trim();
      var date = form.querySelector('#fDate').value;
      var seed = (name + date).split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
      var ref = 'MS-2026-' + String(100 + (seed % 900));
      document.getElementById('confirmRef').textContent = ref;
      document.getElementById('confirmName').textContent = name.split(' ')[0];
      form.hidden = true;
      if (confirm) { confirm.hidden = false; confirm.setAttribute('tabindex', '-1'); confirm.focus(); }
    });
    var again = document.getElementById('sendAnother');
    if (again) again.addEventListener('click', function () {
      form.reset();
      form.querySelectorAll('.field').forEach(function (f) { f.classList.remove('invalid'); });
      if (confirm) confirm.hidden = true;
      form.hidden = false;
      var first = form.querySelector('#fName');
      if (first) first.focus();
    });
  }
})();
