/* Strato Cloud — sulphate aerosol box model and page behaviour */
(function () {
  'use strict';

  var RHO = 1770;          // kg/m3, sulphate
  var MU = 1.8e-5;         // Pa s, stratospheric air
  var G = 9.81;
  var A_EARTH = 5.1e14;    // m2
  var MFP = 0.7e-6;        // m, mean free path at 20 km
  var TAU_CIRC = 1.2;      // yr, Brewer-Dobson exchange
  var K_RF = 25;           // W/m2 per unit AOD, global mean
  var LAMBDA_T = 0.8;      // K per W/m2

  var $ = function (id) { return document.getElementById(id); };

  function fmt(n, d) {
    if (!isFinite(n)) return '—';
    return n.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function calc() {
    var rate = parseFloat($('rate').value);
    var alt = parseFloat($('alt').value);
    var rad = parseFloat($('radius').value);
    var r = rad * 1e-6;

    var kn = MFP / r;
    var slip = 1 + kn * (1.257 + 0.4 * Math.exp(-1.1 / kn));
    var v = (2 * RHO * G * r * r / (9 * MU)) * slip;      // m/s
    var sedYears = (alt * 1000) / v / (365.25 * 24 * 3600);
    var life = 1 / (1 / sedYears + 1 / TAU_CIRC);          // yr
    var burden = rate * life;                               // Tg S
    var sulfate = burden * 3.06;                            // Tg H2SO4
    var aod = 3 * (sulfate * 1e9) / (2 * RHO * r * A_EARTH);
    var rf = -K_RF * aod;
    var dt = rf * LAMBDA_T;

    return {
      rate: rate, alt: alt, rad: rad, v: v, sedYears: sedYears, life: life,
      burden: burden, sulfate: sulfate, aod: aod, rf: rf, dt: dt, slip: slip
    };
  }

  function drawForcing(r) {
    var X0 = 96, X1 = 500, Y1 = 84, Y2 = 168, H = 26;
    var maxW = 6;
    var x = function (w) { return X0 + (Math.min(w, maxW) / maxW) * (X1 - X0); };

    var axis = '';
    for (var t = 0; t <= 6; t += 1) {
      axis += '<line x1="' + x(t) + '" y1="44" x2="' + x(t) + '" y2="212" stroke="rgba(22,36,43,0.10)"></line>';
      axis += '<text x="' + x(t) + '" y="36" text-anchor="middle">' + t + '</text>';
    }
    axis += '<text x="' + ((X0 + X1) / 2) + '" y="22" text-anchor="middle">global mean forcing, W/m²</text>';
    $('forceAxis').innerHTML = axis;

    var mag = Math.abs(r.rf);
    var bars = '';
    bars += '<rect x="' + X0 + '" y="' + Y1 + '" width="' + (x(mag) - X0) + '" height="' + H + '" fill="#186a78"></rect>';
    bars += '<rect x="' + X0 + '" y="' + Y2 + '" width="' + (x(3.7) - X0) + '" height="' + H + '" fill="rgba(22,36,43,0.72)"></rect>';
    bars += '<line x1="' + x(3.7) + '" y1="' + (Y2 - 8) + '" x2="' + x(3.7) + '" y2="' + (Y2 + H + 8) + '" stroke="#16242b" stroke-width="1" stroke-dasharray="3 3"></line>';
    $('forceBars').innerHTML = bars;

    var labels = '';
    labels += '<text x="' + (X0 - 10) + '" y="' + (Y1 + 18) + '" text-anchor="end">this programme</text>';
    labels += '<text x="' + (X0 - 10) + '" y="' + (Y2 + 18) + '" text-anchor="end">CO₂ doubling</text>';
    labels += '<text x="' + (x(mag) + 8) + '" y="' + (Y1 + 18) + '" fill="#186a78">−' + fmt(mag, 2) + '</text>';
    labels += '<text x="' + (x(3.7) + 8) + '" y="' + (Y2 + 18) + '" fill="#16242b">3.70</text>';
    $('forceLabels').innerHTML = labels;

    $('forceCap').textContent = mag > 3.7
      ? 'Larger than a doubling of CO₂ in this box model, which is the point at which the assumptions stop being defensible.'
      : fmt((mag / 3.7) * 100, 0) + ' % of the forcing of a CO₂ doubling, before any response of the climate system.';
  }

  function render() {
    if (!$('rate') || !$('forcing')) return;
    var r = calc();

    $('rateOut').textContent = fmt(r.rate, 1) + ' Tg S/yr';
    $('altOut').textContent = fmt(r.alt, 1) + ' km';
    $('radiusOut').textContent = fmt(r.rad, 2) + ' µm';

    $('outBurden').textContent = fmt(r.burden, 2) + ' Tg S';
    $('outMass').textContent = fmt(r.sulfate, 1) + ' Tg';
    $('outVel').textContent = fmt(r.v * 100, 2) + ' cm/s';
    $('outSed').textContent = fmt(r.sedYears, 1) + ' yr';
    $('outLife').textContent = fmt(r.life, 2) + ' yr';
    $('outAod').textContent = fmt(r.aod, 3);
    $('outRf').textContent = '−' + fmt(Math.abs(r.rf), 2) + ' W/m²';
    $('outDt').textContent = '−' + fmt(Math.abs(r.dt), 2) + ' K';

    $('outLife').classList.toggle('good', r.life > 1.4);
    $('outAod').classList.toggle('warn', r.aod > 0.15);

    var note;
    if (r.rad < 0.2) {
      note = 'At ' + fmt(r.rad, 2) + ' µm the particles are near the mean free path of the air: they scatter well per kilogram but coagulate into larger ones within weeks, and this model cannot see that. Treat the forcing as an upper bound.';
    } else if (r.rad > 0.75) {
      note = 'At ' + fmt(r.rad, 2) + ' µm settling removes the layer in ' + fmt(r.sedYears, 1) + ' years even before the circulation does, so the sulphur has to be replaced continuously to hold the same optical depth.';
    } else if (r.alt >= 23) {
      note = 'Injecting at ' + fmt(r.alt, 1) + ' km buys residence time but puts the sulphate in the ozone-rich middle stratosphere, where the heterogeneous chemistry and the heating of the tropical lower stratosphere are largest.';
    } else {
      note = 'A steady ' + fmt(r.rate, 1) + ' Tg S a year at ' + fmt(r.alt, 1) + ' km holds about ' + fmt(r.burden, 1) + ' Tg of sulphur aloft. Sedimentation alone would take ' + fmt(r.sedYears, 1) + ' years; the circulation cuts that to ' + fmt(r.life, 2) + '.';
    }
    $('outNote').textContent = note;
    drawForcing(r);
  }

  function bindBench() {
    if (!$('rate')) return;
    ['rate', 'alt', 'radius'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('input', render);
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
      if (count) count.textContent = 'Showing ' + shown + ' of ' + cases.length + ' programmes';
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
    var f = $('enquiryForm');
    if (!f) return;
    var status = $('formStatus');
    var result = $('formResult');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('fName').value.trim();
      var email = $('fEmail').value.trim();
      var org = $('fOrg').value.trim();
      var kind = $('fKind').value;
      var message = $('fMessage').value.trim();
      var ok = true;

      $('errName').textContent = '';
      $('errEmail').textContent = '';
      $('errMessage').textContent = '';
      status.textContent = '';
      status.classList.remove('bad');

      if (name.length < 2) { $('errName').textContent = 'A name, please.'; ok = false; }
      if (!emailRe.test(email)) { $('errEmail').textContent = 'An address that can receive a reply.'; ok = false; }
      if (message.length < 24) { $('errMessage').textContent = 'What is being measured, and with what instrument.'; ok = false; }

      if (!ok) {
        result.hidden = true;
        status.textContent = 'Not sent. Check the marked fields.';
        status.classList.add('bad');
        ($('errName').textContent ? $('fName') : ($('errEmail').textContent ? $('fEmail') : $('fMessage'))).focus();
        return;
      }

      var body = 'Name: ' + name + '\nEmail: ' + email + '\nInstitution: ' + (org || '—') +
        '\nEnquiry: ' + kind + '\n\n' + message;
      $('resultBody').textContent = body;
      $('resultSend').setAttribute('href',
        'mailto:m.alcazar@stratocloud.org?subject=' + encodeURIComponent('Strato Cloud enquiry — ' + (org || name)) +
        '&body=' + encodeURIComponent(body));
      result.hidden = false;
      status.textContent = 'Enquiry prepared. Nothing has left this page.';
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

  window.__strato = {
    read: function () { return calc(); },
    set: function (name, value) { var el = $(name); if (el) { el.value = String(value); render(); } }
  };

  document.addEventListener('DOMContentLoaded', function () {
    bindMenu();
    bindBench();
    bindFilters();
    bindForm();
  });
})();
