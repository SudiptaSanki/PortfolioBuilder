/* Shining Shield — navigation, entrance, and the eight-night lamp. */
(function () {
  'use strict';
  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yr = doc.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* navigation */
  var toggle = doc.querySelector('.nav-toggle');
  var nav = doc.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* entrance */
  var targets = doc.querySelectorAll('.hero > *, .facts, .craft-copy p, .spec-card, .ritual-head, .nights, .lamp, .blessing, .object, .objects-head, .night-copy > *, .night-list, .closing > *, .page-head > *, .piece, .story-copy > *, .story-side, .team-grid > *, .contact-grid > *');
  if (!reduce && targets.length) {
    targets.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (Math.min(i, 6) * 60) + 'ms';
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        targets.forEach(function (el) { el.classList.add('in'); });
      });
    });
    window.setTimeout(function () {
      targets.forEach(function (el) { el.classList.add('in'); });
    }, 1900);
  }

  /* ---------- enquiry form ---------- */
  var form = doc.getElementById('enquiryForm');
  if (form) {
    var success = doc.getElementById('formSuccess');
    var flag = function (id, msg) {
      var input = doc.getElementById(id);
      if (!input) return;
      var field = input.closest('.field');
      var slot = field ? field.querySelector('.field-error') : null;
      if (field) field.classList.toggle('invalid', !!msg);
      if (slot) slot.textContent = msg || '';
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = doc.getElementById('name');
      var email = doc.getElementById('email');
      var message = doc.getElementById('message');
      var ok = true;
      if (!name.value.trim()) { flag('name', 'Please add your name.'); ok = false; } else flag('name', '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        flag('email', 'A working email, so I can reply.'); ok = false;
      } else flag('email', '');
      if (message.value.trim().length < 12) {
        flag('message', 'A line about the occasion helps.'); ok = false;
      } else flag('message', '');
      if (!ok) { if (success) success.hidden = true; return; }

      var piece = doc.getElementById('piece').value;
      var budget = doc.getElementById('budget').value;
      var country = doc.getElementById('country').value.trim();
      var deadline = doc.getElementById('deadline').value;
      var engraving = doc.getElementById('engraving').value.trim();
      var subject = 'Commission enquiry: ' + piece + ' — ' + name.value.trim();
      var body = 'Name: ' + name.value.trim() + '\nEmail: ' + email.value.trim() +
        '\nCountry: ' + (country || '—') + '\nPiece: ' + piece + '\nBudget: ' + budget +
        '\nNeeded by: ' + (deadline || '—') + '\nEngraving: ' + (engraving || '—') +
        '\n\n' + message.value.trim();
      var mailto = 'mailto:studio@shiningshield.pl?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      if (success) {
        success.hidden = false;
        success.innerHTML = 'Thank you, ' + name.value.trim().replace(/[<>&]/g, '') + '. Your enquiry is ready — ' +
          '<a href="' + mailto + '">send it from your mail app</a> and I will answer with a drawing, a price and a date, usually within three days. ' +
          'If the date cannot be met, I will say so in the first line.';
      }
    });
    ['name', 'email', 'message'].forEach(function (id) {
      var el = doc.getElementById(id);
      if (el) el.addEventListener('input', function () { flag(id, ''); });
    });
  }

  /* ---------- the lamp ---------- */
  var candlesWrap = doc.getElementById('candles');
  if (!candlesWrap) return;

  var shamash = doc.getElementById('shamash');
  var litCountEl = doc.getElementById('litCount');
  var needEl = doc.getElementById('needCount');
  var readout = doc.querySelector('.lamp-readout');
  var blessing = doc.getElementById('blessing');
  var firstNight = doc.getElementById('firstNight');
  var note = doc.getElementById('ritualNote');
  var reset = doc.getElementById('resetLamp');

  var ORDINAL = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];
  var state = { night: 1, lit: [] };

  for (var i = 0; i < 8; i++) {
    var b = doc.createElement('button');
    b.type = 'button';
    b.className = 'candle';
    b.setAttribute('data-i', String(i));
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', 'Candle ' + (i + 1));
    b.innerHTML = '<span class="flame" aria-hidden="true"></span><span class="wick" aria-hidden="true"></span><span class="stick" aria-hidden="true"></span>';
    candlesWrap.appendChild(b);
    state.lit.push(false);
  }

  function paint() {
    var lit = 0;
    state.lit.forEach(function (on, idx) {
      var el = candlesWrap.children[idx];
      el.classList.toggle('lit', on);
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
      el.setAttribute('aria-label', (on ? 'Put out candle ' : 'Light candle ') + (idx + 1));
      if (on) lit++;
    });
    shamash.classList.toggle('lit', state.shamash);
    shamash.setAttribute('aria-pressed', state.shamash ? 'true' : 'false');
    shamash.setAttribute('aria-label', state.shamash ? 'Put out the shamash' : 'Light the shamash, the helper candle');

    litCountEl.textContent = String(lit);
    needEl.textContent = String(state.night);
    readout.lastChild.textContent = ' lit on the ' + ORDINAL[state.night - 1] + ' night';

    var complete = state.shamash && lit === state.night;
    blessing.hidden = !complete;
    if (firstNight) firstNight.style.display = state.night === 1 ? 'block' : 'none';

    if (complete) {
      note.textContent = 'The night is complete. The blessings are beside the lamp — say them before the candles burn down.';
    } else if (!state.shamash) {
      note.textContent = 'Light the shamash first. It is the helper, and everything else is lit from it.';
    } else if (lit > state.night) {
      note.textContent = 'That is more than tonight needs. Put one out, or choose the next night.';
    } else {
      note.textContent = lit + ' of ' + state.night + ' lit. Tradition fills the cups from the right-hand side of the menorah.';
    }
  }

  candlesWrap.addEventListener('click', function (e) {
    var btn = e.target.closest('.candle');
    if (!btn) return;
    if (!state.shamash) {
      note.textContent = 'Light the shamash first — nothing is lit without it.';
      shamash.focus();
      return;
    }
    var idx = parseInt(btn.getAttribute('data-i'), 10);
    if (!state.lit[idx] && state.lit.filter(Boolean).length >= state.night) {
      state.lit[idx] = false;
      note.textContent = 'Tonight takes ' + state.night + ' candle' + (state.night > 1 ? 's' : '') +
        '. Put one out before lighting another, or choose a later night.';
      paint();
      return;
    }
    state.lit[idx] = !state.lit[idx];
    paint();
  });

  shamash.addEventListener('click', function () {
    state.shamash = !state.shamash;
    if (!state.shamash) state.lit = state.lit.map(function () { return false; });
    paint();
  });

  doc.querySelectorAll('[data-night]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.night = parseInt(btn.getAttribute('data-night'), 10);
      state.shamash = false;
      state.lit = state.lit.map(function () { return false; });
      doc.querySelectorAll('[data-night]').forEach(function (o) { o.classList.toggle('is-on', o === btn); });
      paint();
    });
  });

  if (reset) reset.addEventListener('click', function () {
    state.shamash = false;
    state.lit = state.lit.map(function () { return false; });
    paint();
    shamash.focus();
  });

  state.shamash = false;
  paint();
})();
