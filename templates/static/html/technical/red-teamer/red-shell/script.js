/* Red Shell — ATT&CK chain builder and dwell-time model. */

(function () {
  'use strict';

  /* ------------------------------------------------------------- mobile nav */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.textContent = open ? 'Close' : 'Menu';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.textContent = 'Menu';
      }
    });
  }

  /* ------------------------------------------------------------------ data */
  var TACTICS = [
    { key: 'recon', short: 'Recon', name: 'Reconnaissance', techs: [
      { id: 'scan', n: 'Active scanning', cov: 0.35, dwell: 3 },
      { id: 'opensrc', n: 'Search open tech', cov: 0.20, dwell: 2 }
    ] },
    { key: 'initial', short: 'Initial', name: 'Initial access', techs: [
      { id: 'phish', n: 'Phishing link', cov: 0.55, dwell: 5 },
      { id: 'valid', n: 'Valid accounts', cov: 0.15, dwell: 4 },
      { id: 'publicapp', n: 'Exploit public app', cov: 0.45, dwell: 7 }
    ] },
    { key: 'exec', short: 'Execution', name: 'Execution', techs: [
      { id: 'cmd', n: 'Command and scripting', cov: 0.40, dwell: 3 },
      { id: 'userexec', n: 'User execution', cov: 0.30, dwell: 2 }
    ] },
    { key: 'persist', short: 'Persist', name: 'Persistence', techs: [
      { id: 'sched', n: 'Scheduled task', cov: 0.50, dwell: 6 },
      { id: 'acct', n: 'Create account', cov: 0.25, dwell: 5 }
    ] },
    { key: 'priv', short: 'PrivEsc', name: 'Privilege escalation', techs: [
      { id: 'localexp', n: 'Exploit local', cov: 0.30, dwell: 4 },
      { id: 'token', n: 'Token theft', cov: 0.20, dwell: 3 }
    ] },
    { key: 'evasion', short: 'Evasion', name: 'Defense evasion', techs: [
      { id: 'obf', n: 'Obfuscated files', cov: 0.25, dwell: 5 },
      { id: 'nolog', n: 'Disable logging', cov: 0.12, dwell: 3 }
    ] },
    { key: 'cred', short: 'Cred', name: 'Credential access', techs: [
      { id: 'kerb', n: 'Kerberoasting', cov: 0.45, dwell: 4 },
      { id: 'lsass', n: 'LSASS dump', cov: 0.60, dwell: 3 }
    ] },
    { key: 'lateral', short: 'Lateral', name: 'Lateral movement', techs: [
      { id: 'remote', n: 'Remote services', cov: 0.40, dwell: 6 },
      { id: 'intphish', n: 'Internal phishing', cov: 0.20, dwell: 4 }
    ] },
    { key: 'collect', short: 'Collect', name: 'Collection', techs: [
      { id: 'shares', n: 'Data from shares', cov: 0.30, dwell: 5 },
      { id: 'screen', n: 'Screen capture', cov: 0.15, dwell: 2 }
    ] },
    { key: 'exfil', short: 'Exfil', name: 'Exfiltration', techs: [
      { id: 'c2', n: 'C2 channel', cov: 0.50, dwell: 7 },
      { id: 'cloud', n: 'Cloud storage', cov: 0.35, dwell: 4 }
    ] },
    { key: 'impact', short: 'Impact', name: 'Impact', techs: [
      { id: 'encrypt', n: 'Data encrypted', cov: 0.70, dwell: 2 },
      { id: 'svcstop', n: 'Service stop', cov: 0.40, dwell: 1 }
    ] }
  ];

  var matrix = document.getElementById('matrix');
  if (!matrix) { initForm(); return; }

  var selected = {};
  var statusEl = document.getElementById('matrixStatus');

  TACTICS.forEach(function (tac) {
    var col = document.createElement('div');
    col.className = 'tac';
    var head = document.createElement('h3');
    head.textContent = tac.name;
    col.appendChild(head);
    tac.techs.forEach(function (tech) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tech';
      b.dataset.tac = tac.key;
      b.dataset.id = tech.id;
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = tech.n + '<span class="cv">' + Math.round(tech.cov * 100) + '</span>';
      b.addEventListener('click', function () {
        selected[tech.id] = !selected[tech.id];
        b.setAttribute('aria-pressed', selected[tech.id] ? 'true' : 'false');
        update();
      });
      col.appendChild(b);
    });
    matrix.appendChild(col);
  });

  var note = document.createElement('div');
  note.className = 'tac tac-note';
  note.innerHTML = '<b>Reading the matrix</b>' +
    'Click a technique to add it to the chain. Numbers are the share of attempts a tuned rule catches in a mid-size estate.' +
    '<b>22 techniques · 11 tactics</b>' +
    'Coverage is a planning estimate drawn from 38 operations, not a statement about your sensors.';
  matrix.appendChild(note);

  var outStages = document.getElementById('outStages');
  var outDet = document.getElementById('outDet');
  var outDwell = document.getElementById('outDwell');
  var verdict = document.getElementById('verdict');
  var bars = document.getElementById('bars');

  var BAR_ROWS = TACTICS.map(function (tac) {
    var row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = '<span>' + tac.short + '</span><span class="bar-track"><i style="width:0%"></i></span><span>0%</span>';
    bars.appendChild(row);
    return { tac: tac, el: row };
  });

  function fmtPct(v) { return Math.round(v * 100) + '%'; }

  function update() {
    var picked = [];
    TACTICS.forEach(function (tac) {
      tac.techs.forEach(function (tech) {
        if (selected[tech.id]) picked.push({ tac: tac, tech: tech });
      });
    });

    var stages = {};
    picked.forEach(function (p) { stages[p.tac.key] = true; });
    var stageCount = Object.keys(stages).length;

    var det = picked.filter(function (p) { return p.tech.cov >= 0.4; }).length;
    var dwell = 0;
    picked.forEach(function (p) { dwell += p.tech.dwell * (1 - p.tech.cov); });
    dwell = picked.length ? Math.max(1, Math.round(dwell)) : 0;

    outStages.innerHTML = stageCount + '<small>/11</small>';
    outDet.innerHTML = det + '<small>/' + picked.length + '</small>';
    outDwell.innerHTML = dwell + '<small> d</small>';
    if (statusEl) statusEl.textContent = picked.length + ' selected · ' + stageCount + ' stages · ' + fmtPct(dwell ? (dwell / 34) : 0) + ' of median dwell';

    BAR_ROWS.forEach(function (row) {
      var mine = picked.filter(function (p) { return p.tac.key === row.tac.key; });
      var avg = mine.length ? mine.reduce(function (s, p) { return s + p.tech.cov; }, 0) / mine.length : 0;
      var fill = row.el.querySelector('i');
      fill.style.width = (avg * 100).toFixed(0) + '%';
      fill.classList.toggle('hot', mine.length > 0 && avg >= 0.4);
      row.el.lastElementChild.textContent = mine.length ? fmtPct(avg) : '—';
    });

    if (!picked.length) {
      verdict.textContent = 'Nothing selected. A chain needs at least a foothold and a way out to say anything useful about detection coverage.';
      return;
    }

    var weakest = picked.slice().sort(function (a, b) { return a.tech.cov - b.tech.cov; })[0];
    var text = 'Chain runs through ' + stageCount + ' stage' + (stageCount === 1 ? '' : 's') + '. ' +
      det + ' of ' + picked.length + ' techniques have a rule that should catch them at this coverage level. ' +
      'The weakest step is ' + weakest.tech.n.toLowerCase() + ' at ' + fmtPct(weakest.tech.cov) + ' — that is where the model expects the intrusion to keep moving. ' +
      'Estimated time before first detection: ' + dwell + ' day' + (dwell === 1 ? '' : 's') + '.';

    if (selected.nolog) {
      text += ' Disabling logging before the rest of the chain is the cheapest way to turn a partial detection into none at all.';
    }
    verdict.textContent = text;
  }

  document.getElementById('exampleBtn').addEventListener('click', function () {
    selected = {};
    ['phish', 'cmd', 'sched', 'token', 'lsass', 'remote', 'c2'].forEach(function (id) { selected[id] = true; });
    Array.prototype.forEach.call(matrix.querySelectorAll('.tech'), function (b) {
      b.setAttribute('aria-pressed', selected[b.dataset.id] ? 'true' : 'false');
    });
    update();
  });

  document.getElementById('clearBtn').addEventListener('click', function () {
    selected = {};
    Array.prototype.forEach.call(matrix.querySelectorAll('.tech'), function (b) {
      b.setAttribute('aria-pressed', 'false');
    });
    update();
  });

  update();

function initForm() {
  /* ------------------------------------------------------------------ intake */
  var form = document.getElementById('intake');
  if (!form) return;

  var fstatus = document.getElementById('formStatus');
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setErr(id, message) {
    var input = document.getElementById(id);
    var err = document.getElementById(id + 'Err');
    if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (err) err.textContent = message || '';
    return !message;
  }

  ['name', 'email', 'msg'].forEach(function (id) {
    var input = document.getElementById(id);
    if (input) input.addEventListener('input', function () { setErr(id, ''); });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var ok = true;
    if (!form.elements.name.value.trim()) ok = setErr('name', 'Name required.') && ok;
    else setErr('name', '');
    if (!form.elements.email.value.trim()) ok = setErr('email', 'Email required.') && ok;
    else if (!emailRe.test(form.elements.email.value.trim())) ok = setErr('email', 'Check the address.') && ok;
    else setErr('email', '');
    if (form.elements.msg.value.trim().length < 20) ok = setErr('msg', 'One sentence on the estate and the objective.') && ok;
    else setErr('msg', '');
    if (!form.elements.auth.checked) {
      ok = false;
      fstatus.className = 'form-status show';
      fstatus.textContent = 'Confirm you are authorised to request testing of these systems before sending.';
      return;
    }
    if (!ok) {
      fstatus.className = 'form-status show';
      fstatus.textContent = 'The brief needs a name, a working email and one sentence about the objective.';
      var bad = form.querySelector('[aria-invalid="true"]');
      if (bad) bad.focus();
      return;
    }
    var who = form.elements.name.value.trim().split(' ')[0];
    fstatus.className = 'form-status show';
    fstatus.textContent = 'Request logged, ' + who + '. You will get a scoping call invitation within two working days and a draft rules-of-engagement document before anything else happens. This is a demonstration form in a portfolio template; nothing was sent.';
    form.reset();
    ['name', 'email', 'msg'].forEach(function (id) { setErr(id, ''); });
  });
}

  initForm();
})();
