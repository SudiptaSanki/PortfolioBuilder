/* Marcus Thorne — stand-up. Billing-sheet interactions.
   No audio anywhere: the act is the product, and it is not given away here. */
(function () {
  'use strict';

  /* The narrowly-filtered view-transition abort guard (proven pattern):
     Chrome surfaces an aborted cross-document transition as an unhandled
     rejection; the navigation itself always completes. Swallow only that. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile menu: the running order ---------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('mobile-panel');
  if (btn && panel) {
    var closePanel = function (focusBack) {
      panel.classList.remove('open');
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
      if (focusBack) btn.focus();
    };
    var openPanel = function () {
      panel.hidden = false;
      /* rAF so the panel is rendered before the class lands (focus + animation) */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          panel.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
          document.documentElement.style.overflow = 'hidden';
          var first = panel.querySelector('a');
          if (first) first.focus();
        });
      });
    };
    btn.addEventListener('click', function () {
      if (panel.classList.contains('open')) closePanel(false); else openPanel();
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) closePanel(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(true);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860 && panel.classList.contains('open')) closePanel(false);
    });
  }

  /* ---------- reveal on scroll (opacity only, reduced-motion safe) ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    if (prefersReduced || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- format explorer: spec the night ----------
     FORMATS is the single source of truth. The printed rate card on
     index.html carries the same fees; the probe asserts they match. */
  var FORMATS = {
    club: {
      name: 'Club Set', tabMeta: '20 min · 16+',
      time: '20', timeUnit: 'minutes, on the dot',
      rating: '16+', ratingNote: 'Club material — swearing and adult themes',
      fee: '£250', feeNote: 'from £250 — weekend club set',
      audience: '40–400', audienceNote: 'Comedy-club rooms, seated',
      themes: 'The club set: family, money, getting older, the town he is in. Built to open cold rooms and to close strong ones — the same twenty works first or last on the bill.',
      tech: 'One handheld mic on a stand, a spare on the desk, PA voiced for speech, one stool, still water. MC introduces with the agreed billing line; no music under the set.'
    },
    headline: {
      name: 'Headline Hour', tabMeta: '60 min · 18+',
      time: '60', timeUnit: 'minutes plus interval option',
      rating: '18+', ratingNote: 'The full hour — adult themes throughout',
      fee: '£900', feeNote: 'from £900 — the touring hour, “Second Helpings”',
      audience: '100–600', audienceNote: 'Theatre and arts-centre rooms',
      themes: 'Three movements — family, debt, turning forty — with two callbacks planted early and paid off late. The hour is a single argument, not six club sets in a trench coat.',
      tech: 'As club set, plus a single warm spot state and a house-tabs call at the interval if the venue runs one. Soundcheck 60 minutes before doors.'
    },
    corporate: {
      name: 'Corporate Clean Set', tabMeta: '25 min · Clean',
      time: '25', timeUnit: 'minutes, timed to your running order',
      rating: 'Clean', ratingNote: 'Guaranteed in writing — see the definition on the About page',
      fee: '£1,200', feeNote: 'from £1,200 — includes the bespoke briefing call',
      audience: '50–1,000', audienceNote: 'Staff parties, awards nights, conferences',
      themes: 'Work, offices, travel, and your firm itself: six minutes written bespoke from a briefing call, agreed in advance. Nothing about named individuals unless they have signed it off.',
      tech: 'Arrives 90 minutes early for an AV check with your producer. Mic, PA and a lectern-free stage. Content kill-list agreed in writing before the night.'
    },
    compere: {
      name: 'Compère / Hosting', tabMeta: 'Full evening',
      time: '3 hrs', timeUnit: 'the full evening, doors to close',
      rating: 'To bill', ratingNote: 'Set to the rating of the bill being hosted',
      fee: '£450', feeNote: 'from £450 — full evening',
      audience: 'Any', audienceNote: 'Club nights, galas, charity bills',
      themes: 'Holding the night together: house rules set in the first three minutes, energy re-set between acts, and a standing five minutes in reserve for when an act dies or a raffle overruns.',
      tech: 'Needs the final running order by 18:00 on the day and one point of contact in the room. Works with the venue’s MC mic and PA.'
    },
    late: {
      name: 'Festival Late Show', tabMeta: '40 min · 18+',
      time: '40', timeUnit: 'minutes, post-23:00 slot',
      rating: '18+', ratingNote: 'Late material — looser, louder, later',
      fee: '£600', feeNote: 'from £600 — festival late slot',
      audience: '80–500', audienceNote: 'Festival tents and late rooms',
      themes: 'The after-dark version: crowd work up front, the club material uncut, and a closer built for a room that has been drinking since eight. Not the set for a mixed-age bill.',
      tech: 'As club set. Late finish is priced in — no surprise surcharge for a 23:40 start, provided the slot is confirmed at booking.'
    }
  };

  var tabsWrap = document.querySelector('.format-tabs');
  var spec = document.getElementById('spec-sheet');
  if (tabsWrap && spec) {
    var val = function (id) { return document.getElementById(id); };
    var selectFormat = function (key, focusTab) {
      var f = FORMATS[key];
      if (!f) return;
      tabsWrap.querySelectorAll('.format-tab').forEach(function (t) {
        var on = t.getAttribute('data-format') === key;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (on && focusTab) t.focus();
      });
      val('spec-name').textContent = f.name;
      val('spec-time').innerHTML = f.time + ' <span class="unit">' + f.timeUnit + '</span>';
      val('spec-rating').textContent = f.rating;
      val('spec-rating-note').textContent = f.ratingNote;
      val('spec-fee').textContent = f.fee;
      val('spec-fee-note').textContent = f.feeNote;
      val('spec-aud').innerHTML = f.audience + ' <span class="unit">' + f.audienceNote + '</span>';
      val('spec-themes').textContent = f.themes;
      val('spec-tech').textContent = f.tech;
      var cta = val('spec-book');
      if (cta) cta.href = 'contact.html?format=' + key;
      spec.setAttribute('data-current', key);
    };
    tabsWrap.addEventListener('click', function (e) {
      var t = e.target.closest('.format-tab');
      if (t) selectFormat(t.getAttribute('data-format'), false);
    });
    tabsWrap.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var tabs = Array.prototype.slice.call(tabsWrap.querySelectorAll('.format-tab'));
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      var n = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      selectFormat(tabs[n].getAttribute('data-format'), true);
    });
    selectFormat('club', false);
    window.MarcusThorne = { formats: FORMATS, selectFormat: selectFormat };
  }

  /* ---------- booking form (contact page) ---------- */
  var form = document.getElementById('booking-form');
  if (form) {
    /* preselect the format the visitor specced in the explorer */
    var params = new URLSearchParams(window.location.search);
    var wanted = params.get('format');
    var sel = document.getElementById('f-format');
    if (sel && wanted && FORMATS[wanted]) sel.value = wanted;

    var fields = ['f-name', 'f-email', 'f-format', 'f-date', 'f-venue', 'f-message'];
    var showError = function (id, msg) {
      var input = document.getElementById(id);
      var err = document.getElementById(id + '-error');
      if (msg) {
        input.setAttribute('aria-invalid', 'true');
        if (err) { err.textContent = msg; err.classList.add('show'); }
      } else {
        input.removeAttribute('aria-invalid');
        if (err) { err.textContent = ''; err.classList.remove('show'); }
      }
      return !msg;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, firstBad = null;
      var v = {};
      fields.forEach(function (id) { v[id] = document.getElementById(id).value.trim(); });
      var checks = [
        ['f-name', v['f-name'] ? '' : 'Your name is needed.'],
        ['f-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v['f-email']) ? '' : 'A valid email is needed so the office can reply.'],
        ['f-format', v['f-format'] ? '' : 'Pick the format you are booking.'],
        ['f-date', v['f-date'] ? '' : 'The event date is needed — even a rough one.'],
        ['f-venue', v['f-venue'] ? '' : 'Venue and town are needed for the travel quote.'],
        ['f-message', v['f-message'].length >= 10 ? '' : 'A line or two about the night (10+ characters).']
      ];
      checks.forEach(function (c) {
        if (!showError(c[0], c[1])) { ok = false; if (!firstBad) firstBad = c[0]; }
      });
      if (!ok) { document.getElementById(firstBad).focus(); return; }
      var ref = 'MT-2026-' + String(Math.floor(100 + Math.random() * 900));
      var conf = document.getElementById('confirmation');
      document.getElementById('conf-ref').textContent = ref;
      document.getElementById('conf-format').textContent =
        FORMATS[v['f-format']] ? FORMATS[v['f-format']].name : v['f-format'];
      form.hidden = true;
      conf.classList.add('show');
      conf.setAttribute('tabindex', '-1');
      conf.focus();
      window.scrollTo({ top: conf.offsetTop - 80, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
    var again = document.getElementById('send-another');
    if (again) {
      again.addEventListener('click', function () {
        form.reset();
        fields.forEach(function (id) { showError(id, ''); });
        document.getElementById('confirmation').classList.remove('show');
        form.hidden = false;
        document.getElementById('f-name').focus();
      });
    }
  }
})();
