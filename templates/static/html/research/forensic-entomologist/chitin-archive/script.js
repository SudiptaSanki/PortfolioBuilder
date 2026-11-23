/* Chitin Archive — accumulated degree hour bench and page behaviour */
(function () {
  'use strict';

  var SPECIES = {
    vicina: { short: 'C. vicina', full: 'Calliphora vicina', base: 10, factor: 1.00 },
    sericata: { short: 'L. sericata', full: 'Lucilia sericata', base: 10, factor: 0.72 },
    regina: { short: 'P. regina', full: 'Phormia regina', base: 9, factor: 0.80 }
  };

  var STAGES = [
    { name: 'Eggs', adh: 0 },
    { name: 'First instar', adh: 360 },
    { name: 'Second instar', adh: 480 },
    { name: 'Third instar', adh: 650 },
    { name: 'Post-feeding', adh: 1250 },
    { name: 'Puparia', adh: 1610 },
    { name: 'Adults emerged', adh: 3530 }
  ];

  var $ = function (id) { return document.getElementById(id); };

  function fmt(n, d) {
    if (n === null || !isFinite(n)) return '—';
    return n.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function calc() {
    var sp = SPECIES[$('species').value] || SPECIES.vicina;
    var idx = parseInt($('stage').value, 10);
    var temp = parseFloat($('temp').value);
    var cold = parseFloat($('cold').value);
    var warmHours = 24 - cold;
    var rate = Math.max(0, temp - sp.base) * warmHours;
    var req = STAGES[idx].adh * sp.factor;
    var next = idx < STAGES.length - 1 ? STAGES[idx + 1].adh * sp.factor : null;

    var minDays = rate > 0 ? req / rate : null;
    var maxDays = rate > 0 && next !== null ? next / rate : null;

    return {
      sp: sp, idx: idx, temp: temp, cold: cold, rate: rate, req: req, next: next,
      minDays: minDays, maxDays: maxDays, stage: STAGES[idx].name,
      maxAdh: STAGES[STAGES.length - 1].adh * sp.factor
    };
  }

  function drawBands(r) {
    var X0 = 122, X1 = 500, Y0 = 26, ROW = 22, H = 11;
    var x = function (v) { return X0 + (v / r.maxAdh) * (X1 - X0); };
    var y = function (i) { return Y0 + i * ROW; };

    var grid = '';
    [0, 1000, 2000, 3000].forEach(function (v) {
      if (v > r.maxAdh) return;
      grid += '<line x1="' + x(v) + '" y1="' + (Y0 - 6) + '" x2="' + x(v) + '" y2="' + (y(6) + H + 10) + '"></line>';
    });
    $('bandGrid').innerHTML = grid;

    var rows = '';
    var labels = '';
    for (var i = 0; i < STAGES.length; i += 1) {
      var a = STAGES[i].adh * r.sp.factor;
      var b = i < STAGES.length - 1 ? STAGES[i + 1].adh * r.sp.factor : r.maxAdh;
      var on = i === r.idx;
      rows += '<rect x="' + x(a) + '" y="' + y(i) + '" width="' + Math.max(2, x(b) - x(a)) + '" height="' + H + '" fill="' + (on ? 'rgba(217,154,60,0.55)' : 'rgba(228,219,203,0.13)') + '"></rect>';
      labels += '<text x="' + (X0 - 10) + '" y="' + (y(i) + 9) + '" text-anchor="end" fill="' + (on ? '#e4dbcb' : '#a1957f') + '">' + STAGES[i].name + '</text>';
    }
    $('bandRows').innerHTML = rows;

    var ax = labels;
    [0, 1000, 2000, 3000].forEach(function (v) {
      if (v > r.maxAdh) return;
      ax += '<text x="' + x(v) + '" y="' + (y(6) + 28) + '" text-anchor="middle">' + v + '</text>';
    });
    ax += '<text x="' + ((X0 + X1) / 2) + '" y="' + (y(6) + 44) + '" text-anchor="middle">accumulated degree hours</text>';
    $('bandAxis').innerHTML = ax;

    var win = $('bandWindow');
    var wx = x(r.req);
    var ww = r.next !== null ? x(r.next) - x(r.req) : x(r.maxAdh) - x(r.req);
    win.setAttribute('x', wx);
    win.setAttribute('y', Y0 - 8);
    win.setAttribute('width', Math.max(0, ww));
    win.setAttribute('height', y(6) + H + 8 - (Y0 - 8));

    $('bandMark').setAttribute('x1', wx);
    $('bandMark').setAttribute('x2', wx);
    $('bandMark').setAttribute('y1', Y0 - 10);
    $('bandMark').setAttribute('y2', y(6) + H + 6);
    $('bandCap').textContent = r.stage.toLowerCase() + ' at ' + fmt(r.req, 0) + ' ADH';
  }

  function render() {
    if (!$('temp') || !$('bands')) return;
    var r = calc();

    $('tempOut').textContent = fmt(r.temp, 1) + ' °C';
    $('coldOut').textContent = fmt(r.cold, 0) + ' h';
    $('outRate').textContent = fmt(r.rate, 0) + ' ADH/day';
    $('outReq').textContent = fmt(r.req, 0) + ' ADH';
    $('outMin').textContent = r.minDays === null ? 'no growth' : fmt(r.minDays, 1) + ' days';
    $('outNext').textContent = r.next === null ? 'final stage' : fmt(r.next, 0) + ' ADH';

    if (r.rate <= 0) {
      $('outWindow').textContent = '—';
      $('outState').textContent = 'arrested';
      $('outState').className = 'warn';
      $('outNote').textContent = 'At or below the base temperature of ' + r.sp.base + ' °C no development happens at all. The insects are not slow, they are stopped, and only a temperature series can say for how long.';
    } else {
      if (r.maxDays === null) {
        $('outWindow').textContent = '≥ ' + fmt(r.minDays, 1) + ' days';
      } else {
        $('outWindow').textContent = fmt(r.minDays, 1) + ' – ' + fmt(r.maxDays, 1) + ' days';
      }
      $('outState').textContent = r.minDays > 30 ? 'succession case' : 'development case';
      $('outState').className = r.minDays > 30 ? 'warn' : 'good';
      var note;
      if (r.minDays > 30) {
        note = 'Beyond about a month the blow-fly clock stops being useful on its own: the larvae have finished and the beetles are doing the timing. Read the succession list instead of stretching this number.';
      } else if (r.cold >= 10) {
        note = 'With ' + fmt(r.cold, 0) + ' hours a day below ' + r.sp.base + ' °C, the scene supplies only ' + fmt(r.rate, 0) + ' degree hours daily. That is the coldest part of the model and the part most often argued about, because it depends on a logger that may not exist.';
      } else {
        note = 'The interval runs from the first appearance of ' + r.stage.toLowerCase() + ' to the next stage. A death cannot be newer than ' + fmt(r.minDays, 1) + ' days or older than ' + (r.maxDays === null ? 'the next threshold' : fmt(r.maxDays, 1) + ' days') + ' on this temperature alone.';
      }
      $('outNote').textContent = note;
    }

    $('baseNote').innerHTML = 'Base temperature ' + r.sp.base + ' °C for <em>' + r.sp.full + '</em>. Nights under the threshold contribute nothing to development, which is why a cool week stretches an interval far more than most people expect.';
    drawBands(r);
  }

  function bindBench() {
    if (!$('temp')) return;
    ['species', 'stage', 'temp', 'cold'].forEach(function (id) {
      var el = $(id);
      if (el) { el.addEventListener('input', render); el.addEventListener('change', render); }
    });
    render();
  }

  function bindFilters() {
    var list = $('caseList');
    if (!list) return;
    var cases = list.querySelectorAll('.case');
    var count = $('caseCount');
    var btns = document.querySelectorAll('[data-filter]');

    function apply(f) {
      var shown = 0;
      for (var i = 0; i < cases.length; i += 1) {
        var tags = (cases[i].getAttribute('data-tags') || '').split(' ');
        var on = f === 'all' || tags.indexOf(f) !== -1;
        cases[i].hidden = !on;
        if (on) shown += 1;
      }
      if (count) count.textContent = 'Showing ' + shown + ' of ' + cases.length + ' cases';
      for (var j = 0; j < btns.length; j += 1) {
        var on = btns[j].getAttribute('data-filter') === f;
        btns[j].classList.toggle('is-on', on);
        btns[j].setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    }
    for (var k = 0; k < btns.length; k += 1) {
      btns[k].addEventListener('click', function () { apply(this.getAttribute('data-filter')); });
    }
    apply('all');
  }

  function bindForm() {
    var f = $('sampleForm');
    if (!f) return;
    var status = $('formStatus');
    var result = $('formResult');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('fName').value.trim();
      var email = $('fEmail').value.trim();
      var agency = $('fAgency').value.trim();
      var kind = $('fKind').value;
      var message = $('fMessage').value.trim();
      var ok = true;

      $('errName').textContent = '';
      $('errEmail').textContent = '';
      $('errMessage').textContent = '';
      status.textContent = '';
      status.classList.remove('bad');

      if (name.length < 2) { $('errName').textContent = 'A name and a contact number, please.'; ok = false; }
      if (!emailRe.test(email)) { $('errEmail').textContent = 'This address cannot receive a reply.'; ok = false; }
      if (message.length < 20) { $('errMessage').textContent = 'Stage, temperature and where the larvae were on the body.'; ok = false; }

      if (!ok) {
        result.hidden = true;
        status.textContent = 'Not sent. Complete the marked fields.';
        status.classList.add('bad');
        ($('errName').textContent ? $('fName') : ($('errEmail').textContent ? $('fEmail') : $('fMessage'))).focus();
        return;
      }

      var body = 'Name: ' + name + '\nEmail: ' + email + '\nAgency / case: ' + (agency || '—') +
        '\nMaterial: ' + kind + '\n\n' + message;
      $('resultBody').textContent = body;
      $('resultSend').setAttribute('href',
        'mailto:h.vos@chitinarchive.nl?subject=' + encodeURIComponent('Sample submission — ' + (agency || name)) +
        '&body=' + encodeURIComponent(body));
      result.hidden = false;
      status.textContent = 'Submission prepared. Nothing has left this page.';
      result.focus();
    });
  }

  function bindMenu() {
    var btn = $('menuBtn');
    var nav = $('siteNav');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  window.__chitin = {
    read: function () { return calc(); },
    set: function (name, value) { var el = $(name); if (el) { el.value = String(value); render(); } },
    species: SPECIES,
    stages: STAGES
  };

  document.addEventListener('DOMContentLoaded', function () {
    bindMenu();
    bindBench();
    bindFilters();
    bindForm();
  });
})();
