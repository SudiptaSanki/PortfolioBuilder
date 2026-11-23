/* Root Remedy — voucher bench and page behaviour */
(function () {
  'use strict';

  var SPECS = {
    cinchona: {
      acc: 'CAL 118473', name: 'Cinchona ledgeriana', family: 'Rubiaceae',
      collector: 'N. Varghese 0412', locality: 'Periyar, Idukki, Kerala, 1,050 m',
      part: 'Stem bark, dried at 40 °C', compound: 'Quinine', content: 5.8,
      pka: 8.5, logp: 3.2,
      note: 'Bark is stripped from coppiced stems on a four-year cycle. The quill in the plate came from the same stand as this voucher, cut two seasons later.'
    },
    papaver: {
      acc: 'CAL 119041', name: 'Papaver somniferum', family: 'Papaveraceae',
      collector: 'N. Varghese 0788', locality: 'Kashmir Valley, 1,640 m, cultivated',
      part: 'Latex, air-dried', compound: 'Morphine', content: 9.4,
      pka: 8.0, logp: 0.9,
      note: 'Cultivated under licence; the collection is of the capsule latex only. Morphine sits in the dried latex as a meconate salt, which is why the first step is always an acid soak.'
    },
    rauvolfia: {
      acc: 'CAL 119502', name: 'Rauvolfia serpentina', family: 'Apocynaceae',
      collector: 'N. Varghese 1043', locality: 'Nilgiri Biosphere, Tamil Nadu, 780 m',
      part: 'Root, 3-year, shade-dried', compound: 'Reserpine', content: 0.18,
      pka: 6.6, logp: 3.1,
      note: 'Root harvest is the pressure point for this species: the plant is dug, not coppiced. The population survey in 2024 mapped content against elevation and found the highest values on the shaded northern slopes.'
    },
    psychotria: {
      acc: 'CAL 120117', name: 'Psychotria viridis', family: 'Rubiaceae',
      collector: 'N. Varghese 1190', locality: 'Alto Purús, Ucayali, Peru, 240 m',
      part: 'Leaf, dried in shade', compound: 'N,N-DMT', content: 0.32,
      pka: 8.7, logp: 1.2,
      note: 'Collected with a Shipibo maestro and deposited with a duplicate at the Lima herbarium. Leaf content varies widely between individuals, which is one reason the preparation is dosed by the person who knows the stand, not by weight.'
    },
    ephedra: {
      acc: 'CAL 120884', name: 'Ephedra sinica', family: 'Ephedraceae',
      collector: 'N. Varghese 1302', locality: 'Ordos plateau, Inner Mongolia, 1,310 m',
      part: 'Green stem, dried', compound: 'Ephedrine', content: 1.2,
      pka: 9.6, logp: 1.0,
      note: 'A joint collection with the Inner Mongolia Institute; the material is from a licensed stand. Ephedrine is a strong base, so the free-base window sits above pH 11 and the salt form is what moves in water.'
    },
    nicotiana: {
      acc: 'CAL 121033', name: 'Nicotiana tabacum', family: 'Solanaceae',
      collector: 'N. Varghese 1451', locality: 'Vijayanagaram, Andhra Pradesh, 90 m',
      part: 'Cured leaf, mid-stalk', compound: 'Nicotine', content: 2.5,
      pka: 8.0, logp: 1.2,
      note: 'A field weed in this district as much as a crop. Nicotine is volatile in the free base, which is why the dried leaf smells of the plant long after it is dead and why the bench work is done in a fume hood.'
    }
  };

  var current = 'cinchona';
  var $ = function (id) { return document.getElementById(id); };

  function fmt(n, d) {
    if (!isFinite(n)) return '—';
    return n.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  /* ---------- specimen selection ---------- */
  function select(id) {
    if (!SPECS[id]) return;
    current = id;
    var s = SPECS[id];
    if ($('spAcc')) {
      $('spAcc').textContent = s.acc;
      $('spName').innerHTML = '<em>' + s.name + '</em>';
      $('spFamily').textContent = s.family;
      $('spCollector').textContent = s.collector;
      $('spLocality').textContent = s.locality;
      $('spPart').textContent = s.part;
      $('spCompound').textContent = s.compound + ', ' + s.content + ' %';
      $('spChem').textContent = s.pka + ' / ' + s.logp;
      $('spNote').textContent = s.note;
    }
    var c = $('content');
    if (c) { c.value = String(s.content); }
    var els = document.querySelectorAll('.rail-btn');
    for (var i = 0; i < els.length; i += 1) {
      els[i].classList.toggle('is-on', els[i].getAttribute('data-spec') === id);
    }
    render();
  }

  /* ---------- bench model ---------- */
  function calc() {
    var s = SPECS[current];
    var mass = parseFloat($('dryMass').value);
    var pct = parseFloat($('content').value);
    var vol = parseFloat($('solvent').value);
    var eff = parseFloat($('eff').value) / 100;
    var passes = parseInt($('passes').value, 10);
    var ph = parseFloat($('ph').value);

    var target = mass * (pct / 100) * 1000;            // mg of target in the charge
    var recovered = target * (1 - Math.pow(1 - eff, passes));
    var conc = recovered / vol;                          // mg per mL
    var base = 1 / (1 + Math.pow(10, s.pka - ph));       // free base fraction
    var logd = s.logp - Math.log10(1 + Math.pow(10, s.pka - ph));
    var final = recovered * base;

    return {
      target: target, recovered: recovered, conc: conc, base: base,
      logd: logd, final: final, passes: passes, eff: eff, ph: ph, pka: s.pka,
      mass: mass, pct: pct, vol: vol, spec: s
    };
  }

  function drawCurve(r) {
    var X0 = 62, X1 = 396, Y0 = 252, Y1 = 44;
    var px = function (n) { return X0 + ((n - 1) / 4) * (X1 - X0); };
    var py = function (v) { return Y0 - (v / 100) * (Y0 - Y1); };

    var grid = '';
    [0, 25, 50, 75, 100].forEach(function (v) {
      grid += '<line x1="' + X0 + '" y1="' + py(v) + '" x2="' + X1 + '" y2="' + py(v) + '" />';
    });
    $('curveGrid').innerHTML = grid;

    var ax = '';
    [0, 25, 50, 75, 100].forEach(function (v) {
      ax += '<text x="' + (X0 - 8) + '" y="' + (py(v) + 3) + '" text-anchor="end">' + v + '%</text>';
    });
    for (var n = 1; n <= 5; n += 1) {
      ax += '<text x="' + px(n) + '" y="' + (Y0 + 16) + '" text-anchor="middle">' + n + '</text>';
    }
    ax += '<text x="' + ((X0 + X1) / 2) + '" y="' + (Y0 + 32) + '" text-anchor="middle">partitions</text>';
    $('curveAxis').innerHTML = ax;

    var d = '';
    for (var k = 1; k <= 5; k += 1) {
      var v = (1 - Math.pow(1 - r.eff, k)) * 100;
      d += (k === 1 ? 'M' : 'L') + px(k).toFixed(1) + ' ' + py(v).toFixed(1) + ' ';
    }
    $('curvePath').setAttribute('d', d.trim());

    var cx = px(r.passes);
    var cy = py((1 - Math.pow(1 - r.eff, r.passes)) * 100);
    $('curveMark').setAttribute('x1', cx);
    $('curveMark').setAttribute('x2', cx);
    $('curveMark').setAttribute('y1', Y1 - 6);
    $('curveMark').setAttribute('y2', Y0);
    $('curveDot').setAttribute('cx', cx);
    $('curveDot').setAttribute('cy', cy);
    $('curveCap').textContent = 'pass ' + r.passes + ' — ' + fmt((1 - Math.pow(1 - r.eff, r.passes)) * 100, 1) + '% carried over';
  }

  function render() {
    if (!$('dryMass') || !$('curve')) return;
    var r = calc();

    $('dryMassOut').textContent = fmt(r.mass, 0) + ' g';
    $('contentOut').textContent = fmt(r.pct, 2) + ' %';
    $('solventOut').textContent = fmt(r.vol, 0) + ' mL';
    $('effOut').textContent = fmt(r.eff * 100, 0) + ' %';
    $('passesOut').textContent = r.passes;
    $('phOut').textContent = fmt(r.ph, 1);
    $('outPh').textContent = fmt(r.ph, 1);

    $('outMass').textContent = fmt(r.target, 0) + ' mg';
    $('outRecovered').textContent = fmt(r.recovered, 0) + ' mg';
    $('outConc').textContent = fmt(r.conc, 2) + ' mg/mL';
    $('outFree').textContent = fmt(r.base * 100, 2) + ' %';
    $('outLogD').textContent = fmt(r.logd, 1);
    $('outFinal').textContent = fmt(r.final, 0) + ' mg';

    $('outFree').classList.toggle('warn', r.base < 0.5);
    $('outFinal').classList.toggle('warn', r.final < r.target * 0.3);

    var note;
    if (r.ph < r.pka - 1) {
      note = 'Below the pKa the target is protonated and sits in the water. That is the acid soak, not the recovery step: it strips the salt out of the tissue and leaves the fats behind. Raise the pH above ' + (r.pka + 1) + ' to move it into the organic phase.';
    } else if (r.ph > r.pka + 1) {
      note = 'Above the pKa the free base dominates, and ' + fmt(r.base * 100, 1) + ' % of what came out of the tissue will partition into the organic phase. This is the back-extraction window, and it is also where a volatile amine starts to smell like a hazard.';
    } else {
      note = 'At the pKa the target is half ionised and the partition is at its most sensitive: a half-unit of pH moves the recovery by about a third. Buffered clean-ups are run away from this point for exactly that reason.';
    }
    if (r.final < r.recovered * 0.5 && r.ph < r.pka) {
      note += ' Carried through: ' + fmt(r.final, 0) + ' mg, which is why the acid and base steps are counted separately rather than as one yield.';
    }
    $('outNote').textContent = note;

    drawCurve(r);
  }

  function bindBench() {
    if (!$('dryMass')) return;
    ['dryMass', 'content', 'solvent', 'eff', 'passes', 'ph'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('input', render);
    });
    var railBtns = document.querySelectorAll('.rail-btn');
    for (var i = 0; i < railBtns.length; i += 1) {
      railBtns[i].addEventListener('click', function () {
        select(this.getAttribute('data-spec'));
      });
    }
    select(current);
  }

  /* ---------- contact ---------- */
  function bindForm() {
    var f = $('enquiryForm');
    if (!f) return;
    var status = $('formStatus');
    var result = $('formResult');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function setErr(id, msg) {
      var el = $(id);
      if (el) el.textContent = msg;
    }

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('fName').value.trim();
      var email = $('fEmail').value.trim();
      var org = $('fOrg').value.trim();
      var kind = $('fKind').value;
      var message = $('fMessage').value.trim();
      var ok = true;

      setErr('errName', '');
      setErr('errEmail', '');
      setErr('errMessage', '');
      status.textContent = '';
      status.classList.remove('bad');

      if (name.length < 2) { setErr('errName', 'A name, so I know who I am answering.'); ok = false; }
      if (!emailRe.test(email)) { setErr('errEmail', 'That does not look like an address I can reply to.'); ok = false; }
      if (message.length < 24) { setErr('errMessage', 'A sentence or two about the material, the question, or the sheet.'); ok = false; }

      if (!ok) {
        result.hidden = true;
        status.textContent = 'Not sent. ' + (name.length < 2 ? 'Start with the name field.' : 'Check the marked fields.');
        status.classList.add('bad');
        ($('errName').textContent ? $('fName') : ($('errEmail').textContent ? $('fEmail') : $('fMessage'))).focus();
        return;
      }

      var body = 'Name: ' + name + '\nEmail: ' + email + '\nAffiliation: ' + (org || '—') +
        '\nKind of enquiry: ' + kind + '\n\n' + message;
      $('resultBody').textContent = body;
      $('resultSend').setAttribute('href',
        'mailto:field@rootremedy.org?subject=' + encodeURIComponent('Herbarium enquiry — ' + name) +
        '&body=' + encodeURIComponent(body));
      result.hidden = false;
      status.textContent = 'Enquiry prepared. Nothing has left this page yet.';
      result.focus();
    });
  }

  /* ---------- project filter ---------- */
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
      if (count) count.textContent = 'Showing ' + shown + ' of ' + cases.length + ' projects';
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

  /* ---------- menu ---------- */
  function bindMenu() {
    var btn = $('menuBtn');
    var nav = $('siteNav');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  window.__remedy = {
    select: select,
    read: function () { return calc(); },
    set: function (name, value) { var el = $(name); if (el) { el.value = String(value); render(); } },
    specs: SPECS
  };

  document.addEventListener('DOMContentLoaded', function () {
    bindMenu();
    bindBench();
    bindFilters();
    bindForm();
  });
})();
