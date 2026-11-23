/* arctic-albedo — Lehtonen Ice Survey
   Sound ruling: FAILS the need-test — no audio anywhere on this site.
   Sea-ice field science is not a sound profession and no interaction
   here teaches through audio. The stub's particle canvas was
   decoration and was honestly replaced by the working Albedo
   Explorer and campaign estimator (see CREDITS.md). */
document.documentElement.classList.add('js');

/* Cross-document view transitions abort as unhandled rejections in
   Chrome when interrupted; the navigation itself always completes.
   Swallow only that specific rejection. */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* ---------- mobile menu: the survey index ---------- */
(function () {
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('menuPanel');
  if (!btn || !panel) return;
  var firstLink = panel.querySelector('a');
  function open() {
    panel.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('lock');
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      if (firstLink) firstLink.focus();
    }); });
  }
  function close(back) {
    panel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('lock');
    if (back) btn.focus();
  }
  btn.addEventListener('click', function () {
    if (panel.classList.contains('open')) close(false); else open();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) close(true);
  });
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) close(false);
  });
})();

/* ---------- reveals (opacity only) ---------- */
(function () {
  var els = document.querySelectorAll('.rv');
  if (!els.length) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.1 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ---------- Albedo Explorer ---------- */
(function () {
  var root = document.getElementById('explorer');
  if (!root) return;
  var rows = Array.prototype.slice.call(root.querySelectorAll('.ctrl-row'));
  var workEl = document.getElementById('workLines');
  var alphaEl = document.getElementById('alphaVal');
  var totalEl = document.getElementById('mixTotal');
  var refEl = document.getElementById('refNum');
  var absEl = document.getElementById('absNum');
  var refBar = document.getElementById('refBar');
  var absBar = document.getElementById('absBar');
  var mixSegs = {};
  root.querySelectorAll('.mixbar > div').forEach(function (d) { mixSegs[d.getAttribute('data-seg')] = d; });
  var legend = {};
  root.querySelectorAll('[data-leg]').forEach(function (el) { legend[el.getAttribute('data-leg')] = el; });

  function fmt(n, d) { return n.toFixed(d); }

  function compute() {
    var total = 0, raw = 0, lines = [];
    var data = rows.map(function (row) {
      var mid = parseFloat(row.getAttribute('data-mid'));
      var input = row.querySelector('input[type=range]');
      var f = parseInt(input.value, 10);
      total += f;
      var contrib = (f / 100) * mid;
      raw += contrib;
      return { row: row, name: row.getAttribute('data-name'), mid: mid, f: f, contrib: contrib, input: input };
    });
    data.forEach(function (d) {
      d.row.querySelector('[data-val]').textContent = d.f + '%';
      lines.push(d.name + ' — ' + fmt(d.f / 100, 2) + ' × ' + fmt(d.mid, 2) + ' = ' + fmt(d.contrib, 3));
      if (mixSegs[d.row.getAttribute('data-key')]) {
        mixSegs[d.row.getAttribute('data-key')].style.width = (total > 0 ? (d.f / total) * 100 : 0) + '%';
      }
      if (legend[d.row.getAttribute('data-key')]) {
        legend[d.row.getAttribute('data-key')].textContent = d.f + '%';
      }
    });
    var eff = total > 0 ? raw / (total / 100) : 0;
    var html = lines.map(function (l) { return '<div>' + l + '</div>'; }).join('');
    html += '<div class="sum">Σ contributions = ' + fmt(raw, 3) + '</div>';
    if (total !== 100) {
      html += '<div class="sum">Mix totals ' + total + '% — weighted over the entered mix: ' + fmt(raw, 3) + ' ÷ ' + fmt(total / 100, 2) + ' = ' + fmt(eff, 3) + '</div>';
    }
    workEl.innerHTML = html;
    alphaEl.innerHTML = 'α = ' + fmt(eff, 2) + ' <small>effective broadband albedo</small>';
    var ref = Math.round(eff * 100);
    refEl.textContent = ref + ' reflected';
    absEl.textContent = (100 - ref) + ' absorbed';
    refBar.style.width = ref + '%';
    absBar.style.width = (100 - ref) + '%';
    if (total === 100) {
      totalEl.innerHTML = 'Mix total: <strong>100%</strong> — a complete surface. The fractions are the survey.';
    } else {
      totalEl.innerHTML = 'Mix total: <span class="warn">' + total + '%</span> — a real surface totals 100%. Until it does, the sheet weights the mix you entered and shows the division.';
    }
  }

  rows.forEach(function (row) {
    var input = row.querySelector('input[type=range]');
    input.addEventListener('input', compute);
    row.querySelectorAll('[data-step]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = parseInt(input.value, 10) + parseInt(b.getAttribute('data-step'), 10);
        v = Math.max(0, Math.min(100, v));
        input.value = v;
        compute();
      });
    });
  });
  var reset = document.getElementById('mixReset');
  if (reset) reset.addEventListener('click', function () {
    rows.forEach(function (row) {
      row.querySelector('input[type=range]').value = row.getAttribute('data-default');
    });
    compute();
  });
  compute();
})();

/* ---------- campaign estimator ---------- */
(function () {
  var root = document.getElementById('estimator');
  if (!root) return;
  var days = 12;
  var daysEl = document.getElementById('daysVal');
  var lines = Array.prototype.slice.call(root.querySelectorAll('[data-line]'));
  var totalEl = document.getElementById('estTotal');
  var shareEl = document.getElementById('estShare');
  function eur(n) { return '€' + n.toLocaleString('en-GB'); }
  function compute() {
    var total = 0, logCamp = 0;
    lines.forEach(function (el) {
      var rate = parseInt(el.getAttribute('data-rate'), 10);
      var per = el.getAttribute('data-line');
      var amt = per === 'day' ? rate * days : rate;
      total += amt;
      if (el.getAttribute('data-logcamp')) logCamp += amt;
      el.querySelector('[data-amt]').textContent = per === 'day'
        ? days + ' × ' + eur(rate) + ' = ' + eur(amt)
        : eur(amt) + ' fixed';
    });
    daysEl.textContent = days;
    totalEl.textContent = eur(total);
    var share = Math.round((logCamp / total) * 100);
    shareEl.innerHTML = '<strong>' + eur(logCamp) + ' of this budget — ' + share + '% — is logistics and camp.</strong> ' +
      'The science is the cheap part of Arctic science. Any quote that hides that split is hiding the risk as well.';
  }
  root.querySelectorAll('[data-days]').forEach(function (b) {
    b.addEventListener('click', function () {
      days = Math.max(4, Math.min(40, days + parseInt(b.getAttribute('data-days'), 10)));
      compute();
    });
  });
  compute();
})();

/* ---------- enquiry form (demonstration — transmits nothing) ---------- */
(function () {
  var form = document.getElementById('enquiry');
  if (!form) return;
  var confirm = document.getElementById('confirm');
  var params = new URLSearchParams(window.location.search);
  var typeSel = form.querySelector('#f-type');
  var wanted = params.get('type');
  if (typeSel && wanted) {
    for (var i = 0; i < typeSel.options.length; i++) {
      if (typeSel.options[i].value === wanted) { typeSel.selectedIndex = i; break; }
    }
  }
  function flag(input, errEl, bad) {
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    if (errEl) errEl.classList.toggle('on', bad);
    return !bad;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.querySelector('#f-name');
    var email = form.querySelector('#f-email');
    var msg = form.querySelector('#f-msg');
    var ok = true;
    ok = flag(name, document.getElementById('e-name'), !name.value.trim()) && ok;
    ok = flag(email, document.getElementById('e-email'), !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) && ok;
    ok = flag(msg, document.getElementById('e-msg'), !msg.value.trim()) && ok;
    if (!ok) {
      var first = form.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return;
    }
    var ref = 'SL-2026-' + Math.floor(100 + Math.random() * 900);
    document.getElementById('confirmRef').textContent = ref;
    form.hidden = true;
    confirm.hidden = false;
    confirm.querySelector('h3').focus && confirm.querySelector('h3').focus();
  });
  var again = document.getElementById('sendAnother');
  if (again) again.addEventListener('click', function () {
    form.reset();
    form.hidden = false;
    confirm.hidden = true;
  });
})();
