/* Sherwani Line — rail navigation, entrance, and the live flat sketch. */
(function () {
  'use strict';
  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- rail menu on small screens ---------- */
  var menuBtn = doc.querySelector('.menu-btn');
  var railNav = doc.getElementById('nav');
  if (menuBtn && railNav) {
    menuBtn.addEventListener('click', function () {
      var open = railNav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    railNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        railNav.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- entrance ---------- */
  var targets = doc.querySelectorAll('.hero-copy > *, .tech, .strip, .sec-head, .prose p, .aside-note, .config-grid > *, .cloth-card, .steps li, .closing > *, .page-head > *, .look, .story-copy > *, .team-list li, .contact-grid > *');
  if (!reduce && targets.length) {
    targets.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (Math.min(i, 6) * 55) + 'ms';
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        targets.forEach(function (el) { el.classList.add('in'); });
      });
    });
    window.setTimeout(function () {
      targets.forEach(function (el) { el.classList.add('in'); });
    }, 1600);
  }

  /* ---------- commission enquiry ---------- */
  var form = doc.getElementById('commissionForm');
  if (form) {
    var success = doc.getElementById('formSuccess');
    var flag = function (id, msg) {
      var input = doc.getElementById(id);
      if (!input) return;
      var field = input.closest('.field');
      var slot = field ? field.querySelector('.field-error') : null;
      if (field) field.classList.toggle('invalid', !!msg);
      if (slot) slot.textContent = msg || '';
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = doc.getElementById('name');
      var email = doc.getElementById('email');
      var phone = doc.getElementById('phone');
      var date = doc.getElementById('eventDate');
      var message = doc.getElementById('message');
      var ok = true;
      if (!name.value.trim()) { flag('name', 'Please add your name.'); ok = false; } else flag('name', '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        flag('email', 'We need an email to reply to.'); ok = false;
      } else flag('email', '');
      if (phone.value.trim() && !/^[+\d][\d\s-]{7,}$/.test(phone.value.trim())) {
        flag('phone', 'Please check the number.'); ok = false;
      } else flag('phone', '');
      if (!date.value) { flag('eventDate', 'The date the garment is for.'); ok = false; } else flag('eventDate', '');
      if (message.value.trim().length < 12) {
        flag('message', 'A line about the occasion helps.'); ok = false;
      } else flag('message', '');
      if (!ok) { if (success) success.hidden = true; return; }

      var garment = doc.getElementById('garment').value;
      var budget = doc.getElementById('budget').value;
      var city = doc.getElementById('city').value.trim();
      var subject = 'Commission: ' + name.value.trim() + ' — ' + date.value;
      var body = 'Name: ' + name.value.trim() + '\nEmail: ' + email.value.trim() +
        '\nPhone: ' + (phone.value.trim() || '—') + '\nCity: ' + (city || '—') +
        '\nDate: ' + date.value + '\nGarment: ' + garment + '\nBudget: ' + budget +
        '\n\n' + message.value.trim();
      var mailto = 'mailto:atelier@sherwaniline.in?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      if (success) {
        success.hidden = false;
        success.innerHTML = 'Thank you, ' + name.value.trim().replace(/[<>&]/g, '') + '. Your enquiry is ready — ' +
          '<a href="' + mailto + '">send it from your mail app</a> and I will reply within two working days. ' +
          'If the eight weeks do not fit your date, I will say so straight away and suggest what else might.';
      }
    });
    ['name', 'email', 'phone', 'eventDate', 'message'].forEach(function (id) {
      var el = doc.getElementById(id);
      if (el) el.addEventListener('input', function () { flag(id, ''); });
    });
  }

  /* ---------- configurator ---------- */
  var svg = doc.getElementById('sherwani');
  if (!svg) return;

  var body = doc.getElementById('body');
  var bodyPattern = doc.getElementById('bodyPattern');
  var clipPath = doc.getElementById('bodyClipPath');
  var overlay = doc.getElementById('workOverlay');
  var sleeveL = doc.getElementById('sleeveL');
  var sleeveR = doc.getElementById('sleeveR');
  var hemLine = doc.getElementById('hemLine');
  var buttons = doc.getElementById('buttons');
  var centerLine = doc.getElementById('centerLine');
  var angrakha = doc.getElementById('angrakha');
  var ties = doc.getElementById('ties');
  var collars = {
    bandhgala: doc.getElementById('collarStand'),
    nehru: doc.getElementById('collarNehru'),
    shawl: doc.getElementById('collarShawl')
  };
  var artLabel = doc.getElementById('artLabel');

  var state = { collar: 'bandhgala', closure: 'button', fabric: 'silk', work: 'none', length: 'calf' };

  var COLLAR_NAME = { bandhgala: 'Bandhgala', nehru: 'Nehru', shawl: 'Shawl-collar' };
  var COLLAR_ADJ = { bandhgala: 'Mandarin collar', nehru: 'Nehru collar', shawl: 'Shawl lapel' };
  var COLLAR_PRICE = { bandhgala: 38000, nehru: 36000, shawl: 41000 };
  var CLOSURE_NAME = { button: 'Buttoned front', concealed: 'Concealed placket', angrakha: 'Angrakha wrap' };
  var CLOSURE_ADJ = { button: 'buttoned front', concealed: 'concealed placket', angrakha: 'angrakha wrap with side ties' };
  var CLOSURE_PRICE = { button: 0, concealed: 2500, angrakha: 4000 };
  var FABRIC = {
    silk: { name: 'Raw silk', adj: 'undyed raw silk', fill: '#e7dcc5', line: '#171310', cost: 9000, note: 'Raw silk creases honestly and takes tilla well. Dry clean only, and never on a hanger in direct sun.' },
    brocade: { name: 'Brocade', adj: 'oxblood Banarasi brocade', fill: '#6a2230', line: '#2a1114', cost: 33000, note: 'Brocade is woven with real zari. Keep it folded in muslin, not hung, so the gold does not pull at the shoulder.' },
    velvet: { name: 'Velvet', adj: 'forest cotton velvet', fill: '#2f4a3b', line: '#12241b', cost: 23000, note: 'Cotton velvet, cut with the pile down. Brush it after wearing and it will outlast the marriage.' },
    linen: { name: 'Linen', adj: 'sand handloom linen', fill: '#d9cbb2', line: '#3b3022', cost: 9300, note: 'Linen is cut closer and half-canvassed. It will wrinkle by the second hour and look better for it.' }
  };
  var WORK = {
    none: { name: 'no embroidery', label: 'No work', price: 0, weeks: 0, fill: 'none', opacity: 0 },
    tilla: { name: 'tilla on the chest and cuffs', label: 'Tilla', price: 18000, weeks: 1, fill: 'url(#tillaPat)', opacity: 0.95 },
    chikan: { name: 'chikankari across the front', label: 'Chikankari', price: 24000, weeks: 2, fill: 'url(#chikanPat)', opacity: 0.9 },
    zardozi: { name: 'zardozi on the collar and hem', label: 'Zardozi', price: 48000, weeks: 3, fill: 'url(#zardoziPat)', opacity: 1 }
  };
  var LENGTH = {
    knee: { name: 'knee length', hem: 346, price: 0, weeks: 0 },
    calf: { name: 'calf length', hem: 380, price: 2000, weeks: 0 },
    floor: { name: 'floor length', hem: 424, price: 4500, weeks: 1 }
  };

  function pathFor(hem) {
    return 'M116 90c18-7 38-10 64-10s46 3 64 10V' + (hem - 58) +
      'c0 16-4 38-8 58H124c-4-20-8-42-8-58Z';
  }

  function render() {
    var f = FABRIC[state.fabric];
    var w = WORK[state.work];
    var L = LENGTH[state.length];
    var d = pathFor(L.hem);

    body.setAttribute('d', d);
    clipPath.setAttribute('d', d);
    body.setAttribute('fill', f.fill);
    body.setAttribute('stroke', f.line);
    bodyPattern.setAttribute('d', d);
    bodyPattern.setAttribute('fill', state.fabric === 'brocade' ? 'url(#brocadePat)' : 'none');
    sleeveL.setAttribute('fill', state.fabric === 'brocade' ? 'url(#brocadePat)' : f.fill);
    sleeveR.setAttribute('fill', state.fabric === 'brocade' ? 'url(#brocadePat)' : f.fill);
    sleeveL.setAttribute('stroke', f.line);
    sleeveR.setAttribute('stroke', f.line);

    overlay.setAttribute('fill', w.fill);
    overlay.setAttribute('opacity', String(w.opacity));
    overlay.setAttribute('clip-path', 'url(#bodyClip)');
    if (state.work === 'tilla') {
      overlay.setAttribute('y', '96');
      overlay.setAttribute('height', '118');
    } else if (state.work === 'chikan') {
      overlay.setAttribute('y', '96');
      overlay.setAttribute('height', String(Math.min(180, L.hem - 120)));
    } else {
      overlay.setAttribute('y', '90');
      overlay.setAttribute('height', String(Math.max(10, L.hem - 90)));
    }

    hemLine.setAttribute('d', 'M124 ' + (L.hem - 6) + 'h112');

    Object.keys(collars).forEach(function (key) {
      collars[key].setAttribute('display', key === state.collar ? 'inline' : 'none');
    });

    buttons.innerHTML = '';
    if (state.closure === 'button') {
      for (var y = 128; y < L.hem - 20; y += 38) {
        var c = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', '180');
        c.setAttribute('cy', String(y));
        c.setAttribute('r', '3.4');
        buttons.appendChild(c);
      }
    }
    centerLine.setAttribute('display', state.closure === 'button' || state.closure === 'concealed' ? 'inline' : 'none');
    angrakha.setAttribute('display', state.closure === 'angrakha' ? 'inline' : 'none');
    ties.setAttribute('display', state.closure === 'angrakha' ? 'inline' : 'none');

    var total = COLLAR_PRICE[state.collar] + CLOSURE_PRICE[state.closure] + f.cost + w.price + L.price;
    var weeks = 6 + w.weeks + L.weeks;

    doc.getElementById('outTitle').textContent = COLLAR_NAME[state.collar] + ' sherwani';
    doc.getElementById('outDesc').textContent = COLLAR_ADJ[state.collar] + ', ' + CLOSURE_ADJ[state.closure] + ', ' +
      f.adj + ', ' + L.name + ', ' + w.name + '.';
    doc.getElementById('outPrice').textContent = total.toLocaleString('en-IN');
    doc.getElementById('outWeeks').textContent = String(weeks);
    doc.getElementById('outNote').textContent = f.note + ' Three fittings included; cloth bought after the second.';

    artLabel.textContent = COLLAR_NAME[state.collar].toUpperCase() + ' · ' +
      CLOSURE_NAME[state.closure].toUpperCase() + ' · ' + state.length.toUpperCase();
    svg.setAttribute('aria-label', 'Flat sketch of a ' + COLLAR_ADJ[state.collar] + ' sherwani in ' + f.adj +
      ', ' + L.name + ', ' + w.name + '.');
  }

  ['collar', 'closure', 'fabric', 'work', 'length'].forEach(function (key) {
    var attr = 'data-' + key;
    doc.querySelectorAll('[' + attr + ']').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state[key] = btn.getAttribute(attr);
        doc.querySelectorAll('[' + attr + ']').forEach(function (o) { o.classList.toggle('is-on', o === btn); });
        render();
      });
    });
  });

  render();
})();
