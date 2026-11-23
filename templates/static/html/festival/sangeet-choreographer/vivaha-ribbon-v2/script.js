/* Vivaha Ribbon — Sangeet Choreographer
   Cue panel, opposing family rows, the Sangeet Planner, booking form.
   No audio anywhere: the mixes belong to the families. */
(function () {
  'use strict';

  /* Keep CSS view transitions from surfacing abort rejections */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- cue panel (mobile nav) ---------- */
  var btn = document.querySelector('.cue-btn');
  var panel = document.querySelector('.cue-panel');
  if (btn && panel) {
    var closeBtn = panel.querySelector('.cue-close');
    var firstLink = panel.querySelector('nav a');
    function openPanel() {
      panel.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
    }
    function closePanel() {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      btn.focus();
    }
    btn.addEventListener('click', openPanel);
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });
  }

  /* ---------- opposing rows: two families approach from opposite wings ----------
     Bride's side drifts right, groom's side drifts left, as the section
     travels through the viewport. Static under reduced motion. */
  var famSec = document.querySelector('.families');
  var rowA = document.querySelector('.row-a');
  var rowB = document.querySelector('.row-b');
  if (famSec && rowA && rowB && !reduced) {
    var ticking = false;
    function drift() {
      ticking = false;
      var r = famSec.getBoundingClientRect();
      var vh = window.innerHeight || 800;
      if (r.bottom < 0 || r.top > vh) return;
      var p = (vh - r.top) / (vh + r.height);
      p = Math.max(0, Math.min(1, p));
      var shift = (p - 0.5) * 110;
      rowA.style.transform = 'translateX(' + shift.toFixed(1) + 'px)';
      rowB.style.transform = 'translateX(' + (-shift).toFixed(1) + 'px)';
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(drift); }
    }, { passive: true });
    drift();
  }

  /* ---------- Sangeet Planner ----------
     Every rate below is printed in the rate card on the same page. */
  var planner = document.getElementById('planner');
  if (planner) {
    var RATES = {
      perNumber: 6000,        /* choreography + one clean mix, up to 8 performers */
      extraPerformer: 500,    /* per performer past 8, per number */
      extraFrom: 8,
      directionFrom: 5,       /* show direction on the night, from 5 numbers */
      directionFee: 8000,
      rushPerNumber: 1500,    /* double-length sessions when the calendar is tight */
      songMin: 4, changeMin: 1,
      capWeek: 10,            /* sessions I can run in a week */
      capWeekRush: 14
    };
    var state = { numbers: 6, performers: 10, group: 'elders', weeks: 5 };

    function inr(n) { return '₹' + n.toLocaleString('en-IN'); }

    function compute() {
      var N = state.numbers, P = state.performers, W = state.weeks;
      var sel = document.getElementById('f-group');
      var R = parseInt(sel.options[sel.selectedIndex].getAttribute('data-r'), 10);
      var sessions = N * R;
      var stage = N * RATES.songMin + (N - 1) * RATES.changeMin;
      var mixes = N;
      var base = N * RATES.perNumber
        + N * Math.max(0, P - RATES.extraFrom) * RATES.extraPerformer
        + (N >= RATES.directionFrom ? RATES.directionFee : 0);
      var weeksNeeded = Math.max(Math.ceil(R / 2) + 1, Math.ceil(sessions / RATES.capWeek));
      var rushWeeks = Math.max(Math.ceil(R / 3), Math.ceil(sessions / RATES.capWeekRush));
      var out = { R: R, sessions: sessions, stage: stage, mixes: mixes, base: base,
                  weeksNeeded: weeksNeeded, rushWeeks: rushWeeks, mode: 'ok', fee: base };
      if (W >= weeksNeeded) { out.mode = 'ok'; }
      else if (W >= rushWeeks) { out.mode = 'rush'; out.fee = base + N * RATES.rushPerNumber; }
      else {
        out.mode = 'late';
        out.maxNumbers = Math.max(1, Math.min(
          Math.floor(W * RATES.capWeekRush / R), N - 1));
        out.fee = null;
      }
      return out;
    }

    function render() {
      var o = compute();
      document.getElementById('out-numbers').textContent = state.numbers;
      document.getElementById('out-performers').textContent = state.performers;
      document.getElementById('out-weeks').textContent = state.weeks;
      document.getElementById('r-rehearsals').textContent = o.R + ' per number';
      document.getElementById('r-sessions').textContent = o.sessions;
      document.getElementById('r-stage').textContent = o.stage + ' min';
      document.getElementById('r-mixes').textContent = o.mixes;
      document.getElementById('r-needed').textContent = o.weeksNeeded + ' weeks';
      document.getElementById('r-have').textContent = state.weeks + (state.weeks === 1 ? ' week' : ' weeks');
      var feeEl = document.getElementById('r-fee');
      var box = document.getElementById('plan-state');
      var msg = document.getElementById('plan-msg');
      box.className = 'state' + (o.mode === 'rush' ? ' rush' : o.mode === 'late' ? ' late' : '');
      if (o.mode === 'ok') {
        feeEl.textContent = inr(o.fee);
        msg.textContent = 'This fits the calendar. Two rehearsals a week for each group, ' +
          'and the last week is only the full run-through — nobody learns a new step in the final week.';
      } else if (o.mode === 'rush') {
        feeEl.textContent = inr(o.fee);
        msg.textContent = 'Tight, but workable with the compressed plan: double-length sessions ' +
          '(two hours, three sittings a week) instead of single hours. The rush fee of ' +
          inr(RATES.rushPerNumber) + ' per number is in the total above. The alternative is fewer ' +
          'numbers at the standard fee of ' + inr(o.base) + '.';
      } else {
        feeEl.textContent = 'Not bookable as drawn';
        msg.textContent = 'Honestly: this cannot be rehearsed in ' + state.weeks +
          ' week' + (state.weeks === 1 ? '' : 's') + ' — even double sessions need ' + o.rushWeeks +
          '. The rescue is fewer numbers: cut to ' + o.maxNumbers + ' and the compressed plan fits, ' +
          'or turn the hardest number into a seated one (2 sessions, learned in the family\u2019s own ' +
          'living room). Tell me on the contact page which way you want to go and I will re-plan it with you.';
      }
    }

    planner.querySelectorAll('[data-step]').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-step');
        var d = parseInt(b.getAttribute('data-d'), 10);
        var lim = { numbers: [1, 14], performers: [2, 30], weeks: [1, 12] }[key];
        state[key] = Math.max(lim[0], Math.min(lim[1], state[key] + d));
        render();
      });
    });
    document.getElementById('f-group').addEventListener('change', render);
    render();
  }

  /* ---------- booking form ---------- */
  var form = document.getElementById('book-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('b-name').value.trim();
      var date = document.getElementById('b-date').value;
      var nums = document.getElementById('b-numbers').value;
      var ref = 'VRB-' + (date ? date.replace(/-/g, '').slice(0, 8) : 'SANGEET') +
        '-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('c-ref').textContent = ref;
      document.getElementById('c-summary').textContent =
        'Thank you, ' + (name || 'friend') + '. Your enquiry for ' + nums +
        ' is with me. I reply within two working days with rehearsal dates and a ' +
        'blocking sheet for your stage — keep this reference for the reply thread.';
      form.hidden = true;
      var c = document.getElementById('book-confirm');
      c.hidden = false;
      c.setAttribute('tabindex', '-1');
      c.focus();
    });
  }
})();
