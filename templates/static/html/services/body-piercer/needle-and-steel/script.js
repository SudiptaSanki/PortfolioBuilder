/* Needle & Steel — chart-wall interactions.
   Mobile index panel, the Piercing Planner (reads the printed Chart 01 table),
   and the booking form. No audio: piercing is not a sound trade. */
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

  /* ---------- mobile index panel ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var panel = document.querySelector('.nav-panel');
  if (toggle && panel) {
    var firstLink = panel.querySelector('a');
    function closePanel() {
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && firstLink) {
        if (reduced) { firstLink.focus(); }
        else { requestAnimationFrame(function () { firstLink.focus(); }); }
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closePanel(); toggle.focus(); }
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) { closePanel(); }
    });
  }

  /* ---------- date helpers ---------- */
  var DAY = 24 * 60 * 60 * 1000;
  function fmt(d) {
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
  function addDays(d, n) { return new Date(d.getTime() + n * DAY); }
  function today() { var t = new Date(); t.setHours(0, 0, 0, 0); return t; }
  function iso(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  /* ---------- Piercing Planner (index only) ---------- */
  var planForm = document.getElementById('planner');
  if (planForm) {
    var rows = Array.prototype.slice.call(document.querySelectorAll('#heal-table tbody tr'));
    var data = rows.map(function (tr) {
      return {
        id: tr.getAttribute('data-id'),
        name: tr.getAttribute('data-name'),
        healWeeks: parseInt(tr.getAttribute('data-heal-weeks'), 10),
        downsizeWeek: parseInt(tr.getAttribute('data-downsize-week'), 10),
        fee: parseInt(tr.getAttribute('data-fee'), 10)
      };
    });
    var chipBox = document.getElementById('p-piercing-chips');
    data.forEach(function (p, i) {
      var lab = document.createElement('label');
      lab.className = 'chip';
      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'p-piercing';
      input.value = p.id;
      if (i === 0) { input.checked = true; }
      var span = document.createElement('span');
      span.textContent = p.name;
      lab.appendChild(input);
      lab.appendChild(span);
      chipBox.appendChild(lab);
    });

    var targetInput = document.getElementById('p-target');
    var now = today();
    targetInput.min = iso(now);
    targetInput.value = iso(addDays(now, 182));

    var out = document.getElementById('plan-out');
    var verdict = document.getElementById('plan-verdict');
    var sched = document.getElementById('plan-sched');
    var cost = document.getElementById('plan-cost');
    var computed = false;

    function selectedPiercing() {
      var v = planForm.querySelector('input[name="p-piercing"]:checked');
      for (var i = 0; i < data.length; i++) { if (data[i].id === (v && v.value)) { return data[i]; } }
      return data[0];
    }
    function goldSelected() {
      var g = planForm.querySelector('input[name="p-jewellery"]:checked');
      return g && g.value === 'gold';
    }

    function compute() {
      var p = selectedPiercing();
      var target = targetInput.value ? new Date(targetInput.value + 'T00:00:00') : addDays(now, 182);
      var healDays = p.healWeeks * 7;
      var healedFromToday = addDays(now, healDays);
      var latest = addDays(target, -healDays);
      var gold = goldSelected();
      var total = p.fee + (gold ? 55 : 0);

      verdict.className = 'verdict';
      var html = '';
      if (latest >= now) {
        verdict.classList.add('ok');
        html = '<span class="v-title">Good timing</span><p>Book by <b>' + fmt(latest) +
          '</b> and a ' + p.name.toLowerCase() + ' is planned healed by your date, ' + fmt(target) +
          '. The schedule below runs from a booking this week.</p>';
      } else {
        verdict.classList.add('warn');
        var lateWeeks = Math.round((healedFromToday - target) / (7 * DAY));
        html = '<span class="v-title">Too tight — honestly</span><p>A ' + p.name.toLowerCase() +
          ' pierced today is planned healed by <b>' + fmt(healedFromToday) + '</b> — about ' + lateWeeks +
          ' week' + (lateWeeks === 1 ? '' : 's') + ' after ' + fmt(target) + '. Healing does not speed up for a deadline. ' +
          'Your real options: choose a faster-healing piercing from Chart 01 (a tongue plans at 6 weeks, a lobe at 8), ' +
          'wear a clip-on or magnetic piece for the day itself, or book the piercing for straight after — it will be healed for everything after.</p>';
      }
      verdict.innerHTML = html;

      var items = [];
      items.push(['This week', 'Consultation and piercing — anatomy check first; if the anatomy is not right for it, I will tell you and suggest what is.']);
      items.push([fmt(addDays(now, 14)), 'Check-up 1 (free) — swelling, angle and jewellery fit reviewed in person.']);
      if (p.downsizeWeek > 0) {
        items.push([fmt(addDays(now, p.downsizeWeek * 7)), 'Downsize (free) — the shorter post goes in. This appointment is where cartilage piercings are saved or lost; do not skip it.']);
      }
      items.push([fmt(healedFromToday), 'Planned healed — final check (free). First jewellery change only after this date, and only if the check says yes.']);
      sched.innerHTML = items.map(function (it) {
        return '<li><span class="when">' + it[0] + '</span><span class="what">' + it[1] + '</span></li>';
      }).join('');

      cost.innerHTML =
        '<span><b>Fee</b> £' + p.fee + ' (' + p.name + ', titanium included)</span>' +
        (gold ? '<span><b>Gold ends</b> + £55</span>' : '<span><b>Jewellery</b> implant-grade titanium, included</span>') +
        '<span><b>Total</b> £' + total + '</span>' +
        '<span>Check-ups and first downsize included</span>';
      out.hidden = false;
      computed = true;
    }

    planForm.addEventListener('submit', function (e) { e.preventDefault(); compute(); });
    planForm.addEventListener('change', function () { if (computed) { compute(); } });
  }

  /* ---------- booking form (contact only) ---------- */
  var bookForm = document.getElementById('book-form');
  if (bookForm) {
    bookForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('b-name').value.trim();
      var piercingSel = document.getElementById('b-piercing');
      var piercing = piercingSel.options[piercingSel.selectedIndex].text;
      var ref = 'NS-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
      document.getElementById('conf-ref').textContent = ref;
      document.getElementById('conf-line').textContent =
        'Thank you, ' + (name || 'and noted') + ' — your request for a ' + piercing.toLowerCase() +
        ' appointment is on the studio chart. Mara replies within one working day with times. ' +
        'Bring photo ID on the day; no ID, no piercing, no exceptions.';
      bookForm.hidden = true;
      var conf = document.getElementById('confirmation');
      conf.hidden = false;
      conf.setAttribute('tabindex', '-1');
      conf.focus();
      conf.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    });
  }
})();
