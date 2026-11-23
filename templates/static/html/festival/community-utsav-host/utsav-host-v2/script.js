/* utsav-host — shared script: mobile sections panel, view-transition
   abort guard, the Festival Budget Planner (index) and the contact
   form (contact). No audio anywhere: the need-test fails for a host. */

/* CSS view transitions abort noisily when a navigation interrupts one;
   swallow only that exact rejection. */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* ---------- mobile sections panel ---------- */
(function () {
  var btn = document.getElementById('sectionsBtn');
  var panel = document.getElementById('navPanel');
  if (!btn || !panel) return;
  var closeTimer = null;

  function openPanel() {
    window.clearTimeout(closeTimer);
    panel.hidden = false;
    requestAnimationFrame(function () {
      panel.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      var first = panel.querySelector('a');
      if (first) first.focus();
    });
  }
  function closePanel() {
    panel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    closeTimer = window.setTimeout(function () { panel.hidden = true; }, 260);
  }
  btn.addEventListener('click', function () {
    if (panel.classList.contains('open')) { closePanel(); btn.focus(); }
    else openPanel();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      closePanel(); btn.focus();
    }
  });
})();

/* ---------- Festival Budget Planner ---------- */
(function () {
  var root = document.getElementById('planner');
  if (!root) return;

  function rate(key) {
    var td = root.querySelector('[data-per="' + key + '"]');
    return td ? parseInt(td.getAttribute('data-v'), 10) : 0;
  }
  var R = {
    venue: rate('venue'), idol: rate('idol'), licence: rate('licence'),
    pa: rate('pa'), days: rate('days'), act: rate('act'), food: rate('food'),
    cleanupBase: rate('cleanupBase'), cleanupPer: rate('cleanupPer'),
    stallFee: rate('stallFee'), sponsor: rate('sponsor'), ceiling: rate('ceiling')
  };
  var MAX_STALLS = 24;

  var state = { households: 120, footfall: 4000, stalls: 12, acts: 10, sponsor: true };
  var fmt = function (n) { return '₹' + n.toLocaleString('en-IN'); };
  var num = function (n) { return n.toLocaleString('en-IN'); };
  function set(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function compute() {
    var paTotal = R.pa * R.days;
    var prog = R.act * state.acts;
    var food = R.food * state.footfall;
    var cleanup = R.cleanupBase + R.cleanupPer * state.footfall;
    var cost = R.venue + R.idol + R.licence + paTotal + prog + food + cleanup;
    var stallInc = R.stallFee * state.stalls;
    var sponInc = state.sponsor ? R.sponsor : 0;
    var income = stallInc + sponInc;
    var net = cost - income;
    var per = Math.ceil(net / state.households);
    return { paTotal: paTotal, prog: prog, food: food, cleanup: cleanup,
             cost: cost, stallInc: stallInc, sponInc: sponInc,
             income: income, net: net, per: per };
  }

  function verdictText(c) {
    if (c.per <= R.ceiling) {
      return { cls: 'ok', html: '<b>The plan holds.</b> The ask is ' + fmt(c.per) +
        ' per household — under the ' + fmt(R.ceiling) + ' ceiling this para set in 2019. ' +
        'Take it to the committee as it stands.' };
    }
    var excess = c.net - R.ceiling * state.households;
    var saved = 0, steps = [], actsNow = state.acts, stallsNow = state.stalls;
    if (!state.sponsor && excess > 0) {
      steps.push('sign the sponsor board (−' + fmt(R.sponsor) + ')');
      saved += R.sponsor; excess -= R.sponsor;
    }
    if (excess > 0 && actsNow > 0) {
      var trim = Math.min(actsNow, Math.ceil(excess / R.act));
      steps.push('trim the programme to ' + (actsNow - trim) + ' acts (−' + fmt(trim * R.act) + ')');
      saved += trim * R.act; excess -= trim * R.act; actsNow -= trim;
    }
    if (excess > 0 && stallsNow < MAX_STALLS) {
      var add = Math.min(MAX_STALLS - stallsNow, Math.ceil(excess / R.stallFee));
      steps.push('fill ' + (stallsNow + add) + ' stalls (−' + fmt(add * R.stallFee) + ')');
      saved += add * R.stallFee; excess -= add * R.stallFee; stallsNow += add;
    }
    var lead = '<b>Over the ceiling.</b> As drawn, the ask is ' + fmt(c.per) +
      ' per household — past the ' + fmt(R.ceiling) + ' this para set in 2019. ';
    if (excess > 0) {
      return { cls: 'no', html: lead + 'Bring it back: ' + steps.join(', then ') +
        ' — and even then the ask stays over the ceiling. The honest answer is a smaller ' +
        'festival: fewer mouths fed, or more households sharing the cost. Do not paper over ' +
        'the gap and hope; hope is not a budget line.' };
    }
    var finalPer = Math.ceil((c.net - saved) / state.households);
    return { cls: 'no', html: lead + 'Bring it back: ' + steps.join(', then ') +
      ', and the ask lands on ' + fmt(finalPer) + ' — at the ceiling, not a rupee over.' };
  }

  function render() {
    set('hhVal', num(state.households));
    set('ffVal', num(state.footfall));
    set('stVal', num(state.stalls));
    set('actVal', num(state.acts));
    var c = compute();
    set('rVenue', fmt(R.venue));
    set('rIdol', fmt(R.idol));
    set('rLicence', fmt(R.licence));
    set('rPA', fmt(c.paTotal));
    set('rProg', fmt(c.prog));
    set('rFood', fmt(c.food));
    set('rClean', fmt(c.cleanup));
    set('rCost', fmt(c.cost));
    set('rStallInc', fmt(c.stallInc));
    set('rSponInc', fmt(c.sponInc));
    set('rIncome', fmt(c.income));
    set('rNet', fmt(c.net));
    set('rPer', fmt(c.per));
    var v = document.getElementById('verdict');
    var t = verdictText(c);
    v.className = t.cls;
    v.innerHTML = t.html;
  }

  function bindStepper(minusId, plusId, key, step, min, max) {
    var minus = document.getElementById(minusId);
    var plus = document.getElementById(plusId);
    if (!minus || !plus) return;
    minus.addEventListener('click', function () {
      state[key] = Math.max(min, state[key] - step); render();
    });
    plus.addEventListener('click', function () {
      state[key] = Math.min(max, state[key] + step); render();
    });
  }
  bindStepper('hhMinus', 'hhPlus', 'households', 10, 40, 400);
  bindStepper('ffMinus', 'ffPlus', 'footfall', 250, 500, 8000);
  bindStepper('stMinus', 'stPlus', 'stalls', 1, 0, MAX_STALLS);
  bindStepper('actMinus', 'actPlus', 'acts', 1, 0, 20);

  var sponsorBtn = document.getElementById('sponsorBtn');
  if (sponsorBtn) {
    sponsorBtn.addEventListener('click', function () {
      state.sponsor = !state.sponsor;
      sponsorBtn.setAttribute('aria-pressed', state.sponsor ? 'true' : 'false');
      var st = sponsorBtn.querySelector('.state');
      if (st) st.textContent = state.sponsor ? 'Signed' : 'Not signed';
      render();
    });
  }
  render();
})();

/* ---------- contact form ---------- */
(function () {
  var form = document.getElementById('hostForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('fName').value.trim();
    var reach = document.getElementById('fReach').value.trim();
    var society = document.getElementById('fSociety').value.trim();
    var households = document.getElementById('fHouseholds').value.trim();
    var sum = 0;
    var seed = name + '|' + society + '|' + households;
    for (var i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
    var ref = 'UH-2027-' + (1000 + (sum * 7 + parseInt(households || '0', 10) * 13) % 9000);
    document.getElementById('confRef').textContent = ref;
    document.getElementById('confText').textContent =
      'Thank you, ' + name + '. Your note about ' + society +
      ' (' + households + ' households) is in the book. I reply within three working days ' +
      'at ' + reach + ' — usually with two questions and a date for a walk around your ground.';
    form.hidden = true;
    var conf = document.getElementById('confirmation');
    conf.hidden = false;
    conf.setAttribute('tabindex', '-1');
    conf.focus();
  });
})();
