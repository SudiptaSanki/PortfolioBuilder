/* Temple Emerald — shared script: menu, clip reveals, planner, booking form. */
(function () {
  'use strict';

  /* View-transition aborts surface as unhandled rejections; swallow only those. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile menu ---------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.querySelector('.menu-panel');
  if (btn && panel) {
    function closeMenu() {
      panel.classList.remove('open');
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }
    btn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
      if (open) {
        panel.hidden = false;
        requestAnimationFrame(function () {
          var first = panel.querySelector('a');
          if (first) first.focus();
        });
      } else {
        panel.hidden = true;
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        closeMenu();
        btn.focus();
      }
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
  }

  /* ---------- clip reveals ----------
     Position-check on scroll, NOT IntersectionObserver: an element clipped
     to zero visible area reports zero intersection with itself in Chrome,
     so IO can never fire for a clip-path reveal (the malai-string lesson). */
  var clips = Array.prototype.slice.call(document.querySelectorAll('.clipimg'));
  if (clips.length) {
    if (reduced) {
      clips.forEach(function (el) { el.classList.add('on'); });
    } else {
      var pending = clips.slice();
      var ticking = false;
      var checkClips = function () {
        ticking = false;
        var vh = window.innerHeight;
        pending = pending.filter(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < vh * 0.94 && r.bottom > 0) {
            el.classList.add('on');
            return false;
          }
          return true;
        });
        if (!pending.length) {
          window.removeEventListener('scroll', onScroll);
          window.removeEventListener('resize', onScroll);
        }
      };
      var onScroll = function () {
        if (!ticking) { ticking = true; requestAnimationFrame(checkClips); }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      checkClips();
    }
  }

  /* ---------- performance planner ---------- */
  var planner = document.querySelector('[data-planner]');
  if (planner) {
    var VESHA = {
      pacha:   { label: 'Pacha vesha — the green face', fee: 18000, makeup: 3.5 },
      kathi:   { label: 'Kathi vesha — the knife',      fee: 20000, makeup: 4 },
      thadi:   { label: 'Thadi vesha — the beard',      fee: 21000, makeup: 4.5 },
      minukku: { label: 'Minukku — the polished face',  fee: 15000, makeup: 2.5 }
    };
    var LENGTH = {
      full: { label: 'Full night',  mult: 1,    start: 21 * 60,      startLabel: '9:00 PM' },
      exc:  { label: 'Excerpt, 2 hours', mult: 0.6, start: 19 * 60 + 30, startLabel: '7:30 PM' },
      demo: { label: 'Demonstration, 1 hour', mult: 0.45, start: 10 * 60, startLabel: '10:00 AM' }
    };
    var EXTRA_ACTOR = 9000, MUSICIANS = 16000, CREW = 6000, FIXED_PEOPLE = 6;
    var BOOKED = [
      { from: '2026-12-10', to: '2026-12-12', what: 'the Guruvayur Ekadasi nights',
        open: '7–9 December and 13–15 December' },
      { from: '2026-12-24', to: '2027-01-02', what: 'a temple series in Thrissur district',
        open: '3–6 January and 9–11 January' },
      { from: '2027-02-13', to: '2027-02-15', what: 'a wedding week in Kochi',
        open: '9–11 February and 17–19 February' }
    ];
    var state = { vesha: 'pacha', length: 'full', actors: 3 };
    var out = {
      vesha: planner.querySelector('[data-out="vesha"]'),
      artiste: planner.querySelector('[data-out="artiste"]'),
      fixed: planner.querySelector('[data-out="fixed"]'),
      total: planner.querySelector('[data-out="total"]'),
      troupe: planner.querySelector('[data-out="troupe"]'),
      makeup: planner.querySelector('[data-out="makeup"]'),
      call: planner.querySelector('[data-out="call"]'),
      verdict: planner.querySelector('[data-out="verdict"]'),
      actorVal: planner.querySelector('[data-actors-val]')
    };
    var dateIn = planner.querySelector('[data-date]');

    function inr(n) { return '₹' + n.toLocaleString('en-IN'); }
    function fmtTime(mins) {
      var h = Math.floor(mins / 60), m = mins % 60;
      var ap = h >= 12 ? 'PM' : 'AM';
      var h12 = h % 12; if (h12 === 0) h12 = 12;
      return h12 + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
    }
    function hours(h) {
      return (h % 1 === 0) ? h + ' hrs' : h.toFixed(1).replace(/\.0$/, '') + ' hrs';
    }

    function render() {
      var v = VESHA[state.vesha], L = LENGTH[state.length];
      var artisteRaw = v.fee + EXTRA_ACTOR * (state.actors - 1);
      var artiste = Math.round(artisteRaw * L.mult);
      var fixed = MUSICIANS + CREW;
      var total = artiste + fixed;
      var call = L.start - Math.round(v.makeup * 60) - 60;
      out.vesha.textContent = v.label + ' · ' + L.label.toLowerCase();
      out.artiste.textContent = inr(artiste);
      out.fixed.textContent = inr(fixed);
      out.total.textContent = inr(total);
      out.troupe.textContent = (state.actors + FIXED_PEOPLE) + ' people';
      out.makeup.textContent = hours(v.makeup);
      out.call.textContent = fmtTime(call);
      out.actorVal.textContent = state.actors;

      var d = dateIn && dateIn.value;
      if (!d) {
        out.verdict.className = 'verdict';
        out.verdict.innerHTML = 'Pick a date and I will tell you plainly whether the night is free. ' +
          'The troupe travels the day before a full-night performance.';
        return;
      }
      var hit = null;
      BOOKED.forEach(function (b) { if (d >= b.from && d <= b.to) hit = b; });
      var nice = new Date(d + 'T12:00:00').toLocaleDateString('en-IN',
        { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      if (hit) {
        out.verdict.className = 'verdict warn';
        out.verdict.innerHTML = '<b>' + nice + ' is already given</b> — to ' + hit.what + '. ' +
          'I do not hold two courtyards on one night, and I will not send a substitute face. ' +
          'The open nights nearest to it: <b>' + hit.open + '</b>. Write to me for one of those.';
      } else {
        out.verdict.className = 'verdict';
        out.verdict.innerHTML = '<b>' + nice + ' is open.</b> The make-up chair is set up by ' +
          fmtTime(call) + '; the lamp is lit at ' + L.startLabel + '. ' +
          'A date is held for seven days on a committee\u2019s word, then on the advance.';
      }
    }

    planner.querySelectorAll('[data-vesha]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.vesha = b.getAttribute('data-vesha');
        planner.querySelectorAll('[data-vesha]').forEach(function (x) {
          x.setAttribute('aria-pressed', String(x === b));
        });
        render();
      });
    });
    planner.querySelectorAll('[data-length]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.length = b.getAttribute('data-length');
        planner.querySelectorAll('[data-length]').forEach(function (x) {
          x.setAttribute('aria-pressed', String(x === b));
        });
        render();
      });
    });
    var minus = planner.querySelector('[data-step="-1"]');
    var plus = planner.querySelector('[data-step="1"]');
    if (minus) minus.addEventListener('click', function () {
      state.actors = Math.max(1, state.actors - 1); render();
    });
    if (plus) plus.addEventListener('click', function () {
      state.actors = Math.min(12, state.actors + 1); render();
    });
    if (dateIn) dateIn.addEventListener('change', render);
    render();
  }

  /* ---------- booking form ---------- */
  var form = document.querySelector('[data-booking]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('[name="name"]').value.trim();
      var date = form.querySelector('[name="date"]').value;
      var story = form.querySelector('[name="story"]');
      var storyLabel = story.options[story.selectedIndex].text;
      var ref = 'TE-' + new Date().getFullYear() + '-' +
        Math.random().toString(36).slice(2, 6).toUpperCase();
      var box = document.querySelector('[data-confirmation]');
      var when = date ? new Date(date + 'T12:00:00').toLocaleDateString('en-IN',
        { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'a date still to fix';
      box.querySelector('[data-conf-text]').innerHTML =
        'Thank you, <b>' + name.replace(/</g, '&lt;') + '</b>. Your night is noted: <b>' +
        storyLabel + '</b>, ' + when + '. I read every letter myself and answer within three days — ' +
        'sooner in season. Keep your reference:';
      box.querySelector('[data-conf-ref]').textContent = ref;
      form.hidden = true;
      box.hidden = false;
      box.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    });
  }
})();
