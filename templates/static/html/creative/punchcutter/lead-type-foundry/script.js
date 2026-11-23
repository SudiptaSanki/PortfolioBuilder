/* Ashcroft & Matrix — proof press and page behaviour */

(function () {
  'use strict';

  /* ---------- mobile menu ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var mobileNav = document.getElementById('mobile-nav');
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function () {
      var open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!open));
      mobileNav.hidden = open;
    });
    mobileNav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        mobileNav.hidden = true;
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mobileNav.hidden) {
        mobileNav.hidden = true;
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  /* ---------- the proof press ---------- */
  var svg = document.getElementById('proof-svg');
  if (!svg) return;

  var main = document.getElementById('proof-main');
  var shadow = document.getElementById('proof-shadow');
  var highlight = document.getElementById('proof-highlight');
  var inkWarp = document.getElementById('ink-warp');
  var wordInput = document.getElementById('proof-word');
  var tracking = document.getElementById('tracking');
  var ink = document.getElementById('ink');
  var impression = document.getElementById('impression');
  var guides = document.getElementById('guides');
  var guidesLayer = document.getElementById('guides-layer');
  var form = document.getElementById('proof-form');
  var code = document.getElementById('proof-code');
  var note = document.getElementById('stage-note');
  var roTracking = document.getElementById('ro-tracking');
  var roInk = document.getElementById('ro-ink');
  var roPacking = document.getElementById('ro-packing');
  var roCount = document.getElementById('ro-count');
  var tOut = document.getElementById('tracking-out');
  var iOut = document.getElementById('ink-out');
  var pOut = document.getElementById('impression-out');

  if (window.matchMedia && window.matchMedia('(max-width: 700px)').matches) {
    main.removeAttribute('filter');
  }

  var BASE_SIZE = 168;
  var BASELINE = 352;
  var MAX_WIDTH = 980;
  var count = 0;

  function inkFill(v) {
    // 20..100 -> 0.55..1 opacity, measured as film thickness in mm
    return 0.5 + (v / 100) * 0.52;
  }

  function apply() {
    var word = (wordInput.value || 'Specimen').slice(0, 14);
    var track = Number(tracking.value);
    var inkVal = Number(ink.value);
    var pack = Number(impression.value);

    var size = BASE_SIZE;
    var trackPx = (track / 1000) * size;

    [main, shadow, highlight].forEach(function (t) {
      t.textContent = word;
      t.setAttribute('font-size', size);
      t.setAttribute('letter-spacing', trackPx);
      t.setAttribute('y', BASELINE);
    });

    // measure and step the size down so wide settings stay on the sheet
    var w = main.getBBox().width;
    if (w > MAX_WIDTH) {
      size = Math.max(54, Math.floor(size * (MAX_WIDTH / w)));
      trackPx = (track / 1000) * size;
      [main, shadow, highlight].forEach(function (t) {
        t.setAttribute('font-size', size);
        t.setAttribute('letter-spacing', trackPx);
      });
    }

    var offset = pack * 0.6;
    highlight.setAttribute('y', BASELINE - offset);
    highlight.setAttribute('opacity', 0.35 + pack * 0.08);
    shadow.setAttribute('y', BASELINE + offset);
    shadow.setAttribute('opacity', 0.1 + pack * 0.035);

    main.setAttribute('fill-opacity', inkFill(inkVal).toFixed(2));
    main.setAttribute('stroke', '#17150f');
    main.setAttribute('stroke-opacity', (inkVal > 88 ? 0.3 : 0.12).toFixed(2));
    main.setAttribute('stroke-width', (0.15 + (inkVal / 100) * 0.5).toFixed(2));
    if (inkWarp) inkWarp.setAttribute('scale', (inkVal / 100) * 4.2);

    // guides track the type, as they would on a specimen sheet
    var capY = BASELINE - size * 0.7;
    var xY = BASELINE - size * 0.47;
    var gCap = document.getElementById('guide-cap');
    var gX = document.getElementById('guide-x');
    var gBase = document.getElementById('guide-baseline');
    var lCap = document.getElementById('label-cap');
    var lX = document.getElementById('label-x');
    var lBase = document.getElementById('label-baseline');
    if (gCap) { gCap.setAttribute('y1', capY); gCap.setAttribute('y2', capY); }
    if (gX) { gX.setAttribute('y1', xY); gX.setAttribute('y2', xY); }
    if (gBase) { gBase.setAttribute('y1', BASELINE); gBase.setAttribute('y2', BASELINE); }
    if (lCap) lCap.setAttribute('y', capY - 8);
    if (lX) lX.setAttribute('y', xY - 8);
    if (lBase) lBase.setAttribute('y', BASELINE - 8);

    var film = (0.04 + (inkVal / 100) * 0.08).toFixed(2);
    tOut.textContent = (track > 0 ? '+' : '') + track;
    iOut.textContent = film;
    pOut.textContent = (pack > 0 ? '+' : '') + pack;
    roTracking.textContent = (track > 0 ? '+' : '') + track + '/1000 em';
    roInk.textContent = film + ' mm';
    roPacking.textContent = (pack > 0 ? '+' : '') + pack + '/1000 in';
    roCount.textContent = String(count);

    if (track > 62) {
      note.textContent = 'Open as this, the word will not hold a column: rivers of paper open between the letters. Close it before it goes to the stone.';
    } else if (track < -12) {
      note.textContent = 'Tight tracking closes the counters and the f and the r begin to touch. A compositor would add a thin space rather than cut the sidebearings.';
    } else if (inkVal < 32) {
      note.textContent = 'A starved roller leaves the hairlines broken and the serifs grey. Add ink, or slow the press, before you add packing.';
    } else if (inkVal > 90) {
      note.textContent = 'Flooded ink fills the counters and squeezes a bead at the edge of every stem. The proof will dry with a dark halo.';
    } else if (pack > 6) {
      note.textContent = 'Packing this deep punches the paper and wears the face. The impression should be felt with a fingertip, not read from the reverse.';
    } else if (word.length > 11) {
      note.textContent = 'A long word at this size shows every sidebearing at once, which is why the proof is read upside down and at arm\u2019s length.';
    } else {
      note.textContent = 'Spacing is judged by eye against the guides. A proof is only a proof once it has been pulled and read upside down.';
    }
  }

  [tracking, ink, impression].forEach(function (el) {
    el.addEventListener('input', apply);
  });
  wordInput.addEventListener('input', apply);
  guides.addEventListener('change', function () {
    guidesLayer.style.display = guides.checked ? '' : 'none';
  });

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      count += 1;
      var d = new Date();
      var stamp = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0')
      ].join('');
      code.textContent = 'PROOF ' + String(count).padStart(3, '0') + ' · ' + stamp + ' · ' + (wordInput.value || 'SPECIMEN').toUpperCase() + ' · PACKING +' + impression.value;
      roCount.textContent = String(count);
      var marks = document.getElementById('proof-marks');
      marks.style.opacity = '0.25';
      window.requestAnimationFrame(function () {
        marks.style.opacity = '0.95';
      });
      note.textContent = 'Proof pulled. Read it upside down, then at arm\u2019s length, then through a loupe at the serifs.';
    });
  }

  apply();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(apply);
  }
})();

/* ---------- enquiry form (contact page) ---------- */
(function () {
  var form = document.getElementById('enquiry');
  if (!form) return;
  var status = document.getElementById('enquiry-status');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var required = form.querySelectorAll('[required]');
    var ok = true;
    required.forEach(function (field) {
      if (!field.value.trim()) {
        ok = false;
        field.style.borderColor = '#c2351e';
        field.setAttribute('aria-invalid', 'true');
      } else {
        field.style.borderColor = '';
        field.removeAttribute('aria-invalid');
      }
    });
    if (!ok) {
      var first = form.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return;
    }
    var name = (form.querySelector('#f-name').value || '').trim();
    var org = (form.querySelector('#f-org').value || '').trim();
    var type = form.querySelector('#f-type').value;
    var use = Array.prototype.slice.call(form.querySelectorAll('input[name="use"]:checked')).map(function (c) { return c.value; }).join(', ') || 'not stated';
    var message = (form.querySelector('#f-message').value || '').trim();
    var ref = 'A&M-' + String(Date.now()).slice(-6);
    var body = [
      'Name: ' + name,
      'Organisation: ' + (org || '\u2014'),
      'Request: ' + type,
      'Intended use: ' + use,
      '',
      message
    ].join('\n');
    var mail = 'mailto:studio@ashcroftmatrix.example?subject=' + encodeURIComponent('Enquiry ' + ref + ' — ' + type) + '&body=' + encodeURIComponent(body);

    status.hidden = false;
    status.innerHTML = '<h3>Brief assembled — ' + ref + '</h3>' +
      '<p>Nothing has been sent yet. Your details are ready as an email; open it in your mail app and send it, or write to <a href="mailto:studio@ashcroftmatrix.example">studio@ashcroftmatrix.example</a> directly.</p>' +
      '<p><a href="' + mail + '">Open the email with your brief</a></p>';
    status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
})();
