/* Neel Pottery — glaze room, navigation, enquiry form. */

(function () {
  'use strict';

  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  /* ---------------- vessels ---------------- */
  var FORMS = {
    surahi: {
      label: 'Surahi',
      viewBox: '0 0 480 560',
      path: 'M212 66 C204 66 200 74 204 82 L216 128 C152 158 118 232 118 330 C118 440 168 506 240 506 C312 506 362 440 362 330 C362 232 328 158 264 128 L276 82 C280 74 276 66 268 66 Z',
      details: [
        'M204 82 C214 74 266 74 276 82',
        'M206 66 H274',
        'M120 330 C170 316 310 316 360 330'
      ]
    },
    bowl: {
      label: 'Bowl',
      viewBox: '0 0 480 560',
      path: 'M96 292 C96 292 122 452 240 452 C358 452 384 292 384 292 Z',
      details: [
        'M96 292 C96 292 122 306 240 306 C358 306 384 292 384 292',
        'M100 300 C150 320 330 320 380 300'
      ]
    },
    plate: {
      label: 'Plate',
      viewBox: '0 0 480 560',
      path: 'M74 330 C74 276 148 240 240 240 C332 240 406 276 406 330 C406 384 332 420 240 420 C148 420 74 384 74 330 Z',
      details: [
        'M104 320 C104 282 165 258 240 258 C315 258 376 282 376 320 C376 358 315 382 240 382 C165 382 104 358 104 320 Z'
      ]
    },
    jar: {
      label: 'Jar with lid',
      viewBox: '0 0 480 560',
      path: 'M196 160 C196 138 214 122 240 122 C266 122 284 138 284 160 C322 190 344 260 338 340 C332 424 296 470 240 470 C184 470 148 424 142 340 C136 260 158 190 196 160 Z',
      details: [
        'M196 160 H284',
        'M222 122 H258',
        'M150 260 C190 248 290 248 330 260'
      ]
    }
  };

  var SYMBOLS = {
    flower: '<g stroke="#1b3a8c" stroke-width="2.6" fill="none">' +
      '<ellipse cx="0" cy="-10" rx="3.4" ry="7"/>' +
      '<ellipse cx="9.5" cy="-3" rx="3.4" ry="7" transform="rotate(72 9.5 -3)"/>' +
      '<ellipse cx="5.9" cy="8" rx="3.4" ry="7" transform="rotate(144 5.9 8)"/>' +
      '<ellipse cx="-5.9" cy="8" rx="3.4" ry="7" transform="rotate(216 -5.9 8)"/>' +
      '<ellipse cx="-9.5" cy="-3" rx="3.4" ry="7" transform="rotate(288 -9.5 -3)"/></g>' +
      '<circle cx="0" cy="0" r="2.8" fill="#1b3a8c"/>',
    jaali: '<path d="M0 -14 14 0 0 14 -14 0Z" fill="none" stroke="#1b3a8c" stroke-width="2"/>' +
      '<path d="M0 -7 7 0 0 7 -7 0Z" fill="none" stroke="#1b3a8c" stroke-width="1.5"/>' +
      '<circle cx="0" cy="0" r="2" fill="#1b3a8c"/>',
    fish: '<path d="M-14 0c4-7 16-7 20 0-4 7-16 7-20 0Z" fill="none" stroke="#1b3a8c" stroke-width="2"/>' +
      '<path d="M6 0l7-6v12Z" fill="#1b3a8c"/><circle cx="-6" cy="-1.5" r="1.4" fill="#1b3a8c"/>',
    peacock: '<ellipse cx="0" cy="-4" rx="7" ry="9" fill="none" stroke="#1b3a8c" stroke-width="1.8"/>' +
      '<ellipse cx="0" cy="-4" rx="3.4" ry="4.6" fill="#1b3a8c" opacity=".85"/>' +
      '<path d="M0 5v9M0 10c-4-2-6-5-6-8M0 10c4-2 6-5 6-8" fill="none" stroke="#1b3a8c" stroke-width="1.6"/>',
    leaf: '<path d="M0 14C-9 8-11 0-8-9 1-7 6 0 6 7 6 10 3 13 0 14Z" fill="none" stroke="#1b3a8c" stroke-width="1.9"/>' +
      '<path d="M0 14V-6" stroke="#1b3a8c" stroke-width="1.2"/>'
  };

  var holder = document.getElementById('vesselHolder');
  if (holder) {
    var state = { form: 'surahi', motif: 'flower', size: 44, fired: false };
    var paintLayer = null;
    var vesselSvg = null;

    function build() {
      var f = FORMS[state.form];
      var svg = '<svg id="vessel" viewBox="' + f.viewBox + '" role="img" aria-label="' + f.label + ' painted in cobalt">';
      svg += '<defs><clipPath id="vClip"><path d="' + f.path + '"/></clipPath>';
      Object.keys(SYMBOLS).forEach(function (k) {
        svg += '<g id="sym-' + k + '">' + SYMBOLS[k] + '</g>';
      });
      svg += '</defs>';
      svg += '<path class="clay" d="' + f.path + '" fill="#ece4d6" stroke="#c8bfae" stroke-width="1.6"/>';
      svg += '<g class="details" fill="none" stroke="#1b3a8c" stroke-width="1.3" opacity=".7">';
      f.details.forEach(function (d) { svg += '<path d="' + d + '"/>'; });
      svg += '</g>';
      svg += '<g clip-path="url(#vClip)"><g id="paintLayer"></g></g>';
      svg += '</svg>';
      holder.innerHTML = svg;

      vesselSvg = document.getElementById('vessel');
      paintLayer = document.getElementById('paintLayer');
      state.fired = false;
      updateState();
      updateCount();
      vesselSvg.addEventListener('pointerdown', place);
    }

    function place(e) {
      e.preventDefault();
      var svg = vesselSvg;
      var pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      var ctm = svg.getScreenCTM();
      if (!ctm) return;
      var loc = pt.matrixTransform(ctm.inverse());

      var clay = svg.querySelector('.clay');
      if (clay.isPointInFill && !clay.isPointInFill(loc)) return;

      var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', '#sym-' + state.motif);
      use.setAttribute('class', 'motif');
      use.setAttribute('transform', 'translate(' + loc.x.toFixed(1) + ' ' + loc.y.toFixed(1) + ') scale(' + (state.size / 40).toFixed(3) + ')');
      paintLayer.appendChild(use);
      if (state.fired) state.fired = false;
      updateState();
      updateCount();
    }

    function updateState() {
      if (state.fired) vesselSvg.classList.add('fired');
      else vesselSvg.classList.remove('fired');
      document.getElementById('glazeState').textContent = state.fired
        ? 'Fired at 820°C · cobalt under a feldspar glaze'
        : 'Unfired · cobalt oxide on raw quartz';
    }

    function updateCount() {
      var n = paintLayer ? paintLayer.children.length : 0;
      document.getElementById('glazeCount').textContent = n + (n === 1 ? ' motif' : ' motifs');
      document.getElementById('roCount').textContent = n;
    }

    document.getElementById('formSel').addEventListener('change', function (e) {
      state.form = e.target.value;
      build();
    });

    document.querySelectorAll('#motifBtns .mbtn').forEach(function (b) {
      b.addEventListener('click', function () {
        state.motif = b.getAttribute('data-motif');
        document.querySelectorAll('#motifBtns .mbtn').forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
      });
    });

    document.querySelectorAll('#brushBtns .brush-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        state.size = parseInt(b.getAttribute('data-size'), 10);
        document.querySelectorAll('#brushBtns .brush-btn').forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
      });
    });

    document.getElementById('fireBtn').addEventListener('click', function () {
      state.fired = true;
      updateState();
    });

    document.getElementById('undoBtn').addEventListener('click', function () {
      if (paintLayer && paintLayer.lastElementChild) paintLayer.removeChild(paintLayer.lastElementChild);
      updateCount();
    });

    document.getElementById('clearBtn').addEventListener('click', function () {
      if (paintLayer) paintLayer.innerHTML = '';
      state.fired = false;
      updateState();
      updateCount();
    });

    build();
  }

  /* ---------------- enquiry form ---------------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var status = document.getElementById('formStatus');
    function setErr(id, on) {
      var el = document.getElementById(id);
      if (el) {
        var f = el.closest('.field');
        if (f) f.classList.toggle('has-err', on);
      }
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('n-name');
      var email = document.getElementById('n-email');
      var phone = document.getElementById('n-phone');
      var piece = document.getElementById('n-piece');
      var date = document.getElementById('n-date');
      var city = document.getElementById('n-city');
      var brief = document.getElementById('n-brief');
      var consent = document.getElementById('n-consent');
      var bad = [];

      var okName = name.value.trim().length >= 2;
      var okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
      var okPhone = phone.value.trim() === '' || /^[0-9+\s()-]{7,18}$/.test(phone.value.trim());
      var okPiece = piece.value !== '';
      var okDate = date.value !== '';
      var okCity = city.value.trim().length >= 2;
      var okBrief = brief.value.trim().length >= 15;
      var okConsent = consent.checked;

      setErr('n-name', !okName); if (!okName) bad.push('name');
      setErr('n-email', !okEmail); if (!okEmail) bad.push('email');
      setErr('n-phone', !okPhone); if (!okPhone) bad.push('phone');
      setErr('n-piece', !okPiece); if (!okPiece) bad.push('piece');
      setErr('n-date', !okDate); if (!okDate) bad.push('date');
      setErr('n-city', !okCity); if (!okCity) bad.push('city');
      setErr('n-brief', !okBrief); if (!okBrief) bad.push('brief');
      setErr('n-consent', !okConsent); if (!okConsent) bad.push('consent');

      if (bad.length) {
        status.textContent = 'Please check the highlighted fields.';
        status.className = 'form-status bad';
        var first = form.querySelector('.has-err input, .has-err select, .has-err textarea');
        if (first) first.focus();
        return;
      }
      status.textContent = 'Thank you. Shabnam will write within two working days with a price and a firing date.';
      status.className = 'form-status ok';
      form.reset();
      form.querySelectorAll('.has-err').forEach(function (f) { f.classList.remove('has-err'); });
    });
    form.addEventListener('input', function (e) {
      var f = e.target.closest('.field');
      if (f) f.classList.remove('has-err');
    });
  }
})();
