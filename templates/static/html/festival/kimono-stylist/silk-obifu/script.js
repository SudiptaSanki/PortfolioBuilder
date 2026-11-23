/* ==========================================================================
   Silk Obifu — interaction
   The coordination board changes the flat-lay and writes the reasoning.
   Silent: this site has no audio at all.
   ========================================================================== */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------------ nav */
  var toggle = document.querySelector('.navtoggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* --------------------------------------------------------------- reveal */
  var rvs = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  if (rvs.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
      rvs.forEach(function (el) { io.observe(el); });
    } else {
      rvs.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* --------------------------------------------------- coordination board */
  var OCCASIONS = {
    wedding: {
      label: 'Wedding', kanji: '婚礼', formality: 5,
      kimonoColour: '#2b2b33', collar: '#f3ede1', obiColour: '#c8a24c', cord: '#b3402f', sleeve: 'long',
      kimono: 'Black silk tomesode with a single crest at the back and a pattern that stays below the waist. Lined.',
      access: 'Gold obijime with a pearl obidome, white tabi, zōri with a gold cord. A folding fan in the left hand, never the right.',
      caution: 'Do not wear a furisode to another woman’s wedding. The long sleeve is a young unmarried woman’s signal, and at a wedding it reads as a claim on the occasion.'
    },
    tea: {
      label: 'Tea ceremony', kanji: '茶会', formality: 4,
      kimonoColour: '#66715c', collar: '#efe8d8', obiColour: '#cdbfa2', cord: '#2b3a4a', sleeve: 'long',
      kimono: 'Iromuji or a fine Edo komon in a colour that belongs to the season. Lined, with the pattern kept small enough to disappear at a metre.',
      access: 'A subdued obijime, no obidome that catches the light, white tabi, and a kaishi paper tucked where it can be reached without fuss.',
      caution: 'No jewellery at the wrist. It scratches the bowl, and the host will notice before you do.'
    },
    graduation: {
      label: 'Graduation', kanji: '卒業', formality: 4,
      kimonoColour: '#3a4a63', collar: '#f3ede1', obiColour: '#c9b27a', cord: '#b3402f', sleeve: 'long',
      kimono: 'A furisode for the graduate, hakama over it, tied high so the hem clears the shoes. The sleeves are the photograph; everything else supports them.',
      access: 'Hakama cords in a contrasting colour, white tabi, zōri with a low heel. A small bag that can be held in one hand for the certificate.',
      caution: 'Practise walking in the hakama before the morning. The hem is longer than it looks, and the stairs at the hall are steep.'
    },
    summer: {
      label: 'Summer festival', kanji: '夏祭', formality: 2,
      kimonoColour: '#e6dfd0', collar: '#f9f5ec', obiColour: '#b3402f', cord: '#e8d9b6', sleeve: 'short',
      kimono: 'Yukata in cotton, unlined, in a colour that will look better after the first wash. The pattern can be bold because the fabric is honest.',
      access: 'No tabi with geta, a small kinchaku for the phone, and a fan. Hair up, because the evening will be warmer than the forecast.',
      caution: 'Cotton creases and that is not a fault. Do not iron it flat the way you would iron a shirt.'
    },
    newyear: {
      label: 'New Year', kanji: '正月', formality: 4,
      kimonoColour: '#7b3040', collar: '#f3ede1', obiColour: '#c8a24c', cord: '#2b3a4a', sleeve: 'short',
      kimono: 'A formal komono in an auspicious colour, with a motif that means something: plum, crane, or a woven ground of cloud. Lined.',
      access: 'A gold obijime, white tabi, zōri, and a fukusa tucked in the obi for the shrine visit.',
      caution: 'Sleeves long enough to look festive will end up in the soup. Short sleeves at the family table are a kindness to everyone.'
    }
  };

  var OBIS = {
    maru: { label: 'Maru', kanji: '丸帯', adj: 0, note: 'Double-width, the most formal obi there is. It is heavy, it takes two people, and it does not forgive a careless fold.' },
    fukuro: { label: 'Fukuro', kanji: '袋帯', adj: 0, note: 'Half the weight of a maru and nearly as formal. The usual choice when the obi has to survive a full afternoon.' },
    nagoya: { label: 'Nagoya', kanji: '名古屋帯', adj: -1, note: 'The everyday formal obi, easy to tie and easy to retie. It lowers the whole outfit one step, which is often exactly what you want.' },
    hanhaba: { label: 'Hanhaba', kanji: '半幅帯', adj: -2, note: 'Half-width, casual, and the only obi most people should own first. It can be tied without help and worn with a yukata.' }
  };

  var SEASONS = {
    spring: { label: 'Spring', kanji: '春', fabric: 'Lined silk, light enough for a heated room', note: 'Spring allows the blossom motif, but only early. By late April the sakura has fallen, and wearing it is a small mistake people notice.' },
    summer: { label: 'Summer', kanji: '夏', fabric: 'Unlined silk, or cotton for casual dress', note: 'Summer is unlined, cool, and washed more often than the other seasons. The motif should be water, wind, or nothing at all.' },
    autumn: { label: 'Autumn', kanji: '秋', fabric: 'Lined silk, a little heavier than spring', note: 'Autumn is the season for colour. Maple, chrysanthemum, and a ground that has begun to darken.' },
    winter: { label: 'Winter', kanji: '冬', fabric: 'Lined silk, with a heavier lining', note: 'Winter calls for lined silk and a motif that can carry the dark: pine, plum, or a woven ground with no figure at all.' }
  };

  var MOTIFS = {
    sakura: { label: 'Sakura', group: 'motif-sakura' },
    pine: { label: 'Pine', group: 'motif-pine' },
    wave: { label: 'Wave', group: 'motif-wave' },
    maple: { label: 'Maple', group: 'motif-maple' }
  };

  var board = document.getElementById('coord-svg');
  if (board) {
    var state = { occasion: 'wedding', obi: 'maru', season: 'winter', motif: 'pine' };

    var out = {
      stage: document.getElementById('stage-title'),
      title: document.getElementById('coord-title-text'),
      sub: document.getElementById('coord-sub'),
      kimono: document.getElementById('coord-kimono'),
      obi: document.getElementById('coord-obi'),
      access: document.getElementById('coord-access'),
      season: document.getElementById('coord-season'),
      caution: document.getElementById('coord-caution'),
      formality: document.getElementById('coord-formality')
    };

    function setGroupPressed(attr, value) {
      Array.prototype.forEach.call(document.querySelectorAll('[data-' + attr + ']'), function (btn) {
        btn.setAttribute('aria-pressed', btn.getAttribute('data-' + attr) === value ? 'true' : 'false');
      });
    }

    function setSleeves(kind) {
      var long = kind === 'long';
      var h = long ? 292 : 214;
      var l = document.getElementById('kg-sleeve-l');
      var r = document.getElementById('kg-sleeve-r');
      if (l) l.setAttribute('d', 'M140 82 H58 V' + (h - 10) + ' Q58 ' + h + ' 68 ' + h + ' H140 Z');
      if (r) r.setAttribute('d', 'M240 82 H322 V' + (h - 10) + ' Q322 ' + h + ' 312 ' + h + ' H240 Z');
    }

    function paint() {
      var occ = OCCASIONS[state.occasion];
      var obi = OBIS[state.obi];
      var season = SEASONS[state.season];
      var motif = MOTIFS[state.motif];

      // flat-lay
      ['kg-body', 'kg-sleeve-l', 'kg-sleeve-r'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.setAttribute('fill', occ.kimonoColour);
      });
      var obiEl = document.getElementById('kg-obi');
      if (obiEl) obiEl.setAttribute('fill', occ.obiColour);
      var cord = document.getElementById('kg-cord');
      if (cord) cord.setAttribute('stroke', occ.cord);
      var knot = document.getElementById('kg-knot');
      if (knot) knot.setAttribute('fill', occ.cord);
      var collar = document.getElementById('kg-collar');
      if (collar) collar.setAttribute('fill', occ.collar);
      var collar2 = document.getElementById('kg-collar2');
      if (collar2) collar2.setAttribute('fill', occ.collar === '#f3ede1' ? '#e2d9c6' : '#f3ede1');
      Object.keys(MOTIFS).forEach(function (k) {
        var g = document.getElementById(MOTIFS[k].group);
        if (g) g.style.display = k === state.motif ? '' : 'none';
      });
      setSleeves(occ.sleeve);

      // text
      var formality = Math.max(1, Math.min(5, occ.formality + obi.adj));
      out.title.textContent = occ.label + ', ' + season.label.toLowerCase();
      out.sub.textContent = occ.kanji + ' · ' + obi.label + ' obi · ' + motif.label + ' motif';
      if (out.stage) out.stage.textContent = occ.label + ' · ' + season.label.toLowerCase();

      out.kimono.textContent = occ.kimono + ' ' + season.fabric + '.';

      while (out.obi.firstChild) out.obi.removeChild(out.obi.firstChild);
      var strong = document.createElement('strong');
      strong.textContent = obi.label + ' obi. ';
      out.obi.appendChild(strong);
      out.obi.appendChild(document.createTextNode(obi.note));

      out.access.textContent = occ.access;
      out.season.textContent = season.note;

      var caution = occ.caution;
      if (occ.formality >= 4 && formality <= 3) {
        caution += ' With a ' + obi.label.toLowerCase() + ' the outfit drops to ' + formality + ' of 5: right for the after-party, not for the ceremony.';
      }
      if (state.season === 'summer' && state.occasion === 'wedding') {
        caution = 'A summer wedding still wants lined silk if it is indoors. Save the unlined fabric for a ceremony that is actually outside, and check the forecast twice.';
      }
      out.caution.textContent = caution;

      Array.prototype.forEach.call(out.formality.querySelectorAll('i'), function (dot, idx) {
        dot.classList.toggle('on', idx < formality);
      });
      out.formality.setAttribute('aria-label', 'Formality ' + formality + ' of 5');
    }

    ['occasion', 'obi', 'season', 'motif'].forEach(function (key) {
      Array.prototype.forEach.call(document.querySelectorAll('[data-' + key + ']'), function (btn) {
        btn.addEventListener('click', function () {
          state[key] = btn.getAttribute('data-' + key);
          setGroupPressed(key, state[key]);
          paint();
        });
      });
    });

    paint();
  }

  /* --------------------------------------------------------- contact form */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var success = document.getElementById('sent');
    var detail = document.getElementById('sent-detail');
    var ref = document.getElementById('sent-ref');
    var live = document.getElementById('form-status');

    var checks = [
      { id: 'k-name', test: function (v) { return v.trim().length >= 2; }, msg: 'Please give me a name to answer.' },
      { id: 'k-email', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'That email address looks incomplete.' },
      { id: 'k-type', test: function (v) { return Boolean(v); }, msg: 'Choose the kind of appointment.' },
      { id: 'k-date', test: function (v) { return Boolean(v); }, msg: 'A date, even approximate, lets me answer honestly.' },
      { id: 'k-message', test: function (v) { return v.trim().length >= 12; }, msg: 'A sentence about the occasion and the room.' }
    ];

    function wrapOf(el) { return el.closest('.field') || el.closest('.check'); }
    function setErr(el, msg) {
      var w = wrapOf(el);
      if (!w) return;
      w.classList.toggle('has-error', Boolean(msg));
      var e = w.querySelector('.err');
      if (e) e.textContent = msg || '';
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }

    checks.forEach(function (c) {
      var el = document.getElementById(c.id);
      if (!el) return;
      el.addEventListener('input', function () { if (wrapOf(el) && wrapOf(el).classList.contains('has-error')) setErr(el, ''); });
      el.addEventListener('change', function () { setErr(el, ''); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      var vals = {};
      checks.forEach(function (c) {
        var el = document.getElementById(c.id);
        if (!el) return;
        vals[c.id] = el.value;
        var ok = c.test(el.value);
        setErr(el, ok ? '' : c.msg);
        if (!ok && !bad) bad = el;
      });
      var agree = document.getElementById('k-agree');
      var agreeOk = agree && agree.checked;
      if (agree) {
        var w = agree.closest('.check');
        if (w) w.classList.toggle('has-error', !agreeOk);
        if (!agreeOk && !bad) bad = agree;
      }
      if (bad) {
        bad.focus();
        if (live) live.textContent = 'The enquiry was not sent. Check the marked fields.';
        return;
      }
      var sel = document.getElementById('k-type');
      var type = sel && sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : 'appointment';
      var when = vals['k-date'] ? new Date(vals['k-date'] + 'T12:00:00') : null;
      var whenText = when && !isNaN(when) ? when.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'the date you gave';
      if (detail) {
        detail.textContent = 'Thank you, ' + vals['k-name'].trim().split(' ')[0] + '. I have your note about ' + type.toLowerCase() + ' on ' + whenText + '. I answer enquiries on Tuesdays and Thursdays; if the date is inside a month, say so and I will look at it first.';
      }
      if (ref) ref.textContent = 'Reference SO-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
      form.hidden = true;
      if (success) { success.hidden = false; success.focus(); }
      if (live) live.textContent = 'Enquiry recorded on this page. No message has left the browser.';
    });
  }
})();
