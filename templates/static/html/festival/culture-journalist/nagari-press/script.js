/* ============================================================
   Nagari Press — Rukmini Sen
   The copy fitter and the archive register. No audio, no network.
   ============================================================ */
(function () {
  'use strict';

  var navBtn = document.getElementById('navBtn');
  if (navBtn) {
    navBtn.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- letters form ---------- */

  var form = document.getElementById('letterForm');
  if (form) {
    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
    var note = document.getElementById('formNote');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var checks = [
        ['lName', function (v) { return v.trim().length > 1; }, 'A name, for the letters page.'],
        ['lEmail', function (v) { return emailRe.test(v.trim()); }, 'That address will bounce.'],
        ['lMessage', function (v) { return v.trim().length > 15; }, 'A paragraph is enough; a correction needs the date and the line.']
      ];
      checks.forEach(function (c) {
        var input = document.getElementById(c[0]);
        var err = document.getElementById('err-' + c[0]);
        if (!c[1](input.value)) {
          if (err) err.textContent = c[2];
          ok = false;
        } else if (err) {
          err.textContent = '';
        }
      });
      if (!ok) {
        var first = form.querySelector('.err:not(:empty)');
        if (first) {
          var f = first.parentElement.querySelector('input, textarea, select');
          if (f) f.focus();
        }
        return;
      }
      note.hidden = false;
      note.textContent = 'Filed. Corrections are read first and answered within two days; commissions take a week because I read the clips.';
      form.reset();
    });
  }

  /* ---------- copy fitter ---------- */

  var canvas = document.getElementById('copyMap');
  if (!canvas) return;

  var el = {
    words: document.getElementById('words'),
    size: document.getElementById('size'),
    measure: document.getElementById('measure'),
    cols: document.getElementById('cols'),
    deck: document.getElementById('deck'),
    wordsOut: document.getElementById('wordsOut'),
    sizeOut: document.getElementById('sizeOut'),
    measureOut: document.getElementById('measureOut'),
    colsOut: document.getElementById('colsOut'),
    deckOut: document.getElementById('deckOut'),
    cpl: document.getElementById('outCpl'),
    inches: document.getElementById('outInches'),
    page: document.getElementById('outPage'),
    fit: document.getElementById('outFit'),
    note: document.getElementById('fitNote')
  };

  var INK = '#141414';
  var NEWS = '#f2efe6';
  var NEWS2 = '#eae6da';
  var RED = '#b3271f';
  var GREY = '#6b675e';

  var AVG_CHAR_EM = 0.46;   /* average advance width of Literata-ish text, in ems */
  var AVG_WORD_CHARS = 6.2; /* letters plus space */

  function setup(cv, w, h) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return ctx;
  }

  function compute(s) {
    var measurePt = s.measure * 12;
    var cpl = Math.round(measurePt / (AVG_CHAR_EM * s.size));
    var chars = s.words * AVG_WORD_CHARS;
    var lines = Math.ceil(chars / cpl);
    var leadingIn = (s.size * 1.2) / 72;
    var colInches = lines * leadingIn;
    var pageHeight = 21; /* inches of live column height on this page */
    var pageUsed = (colInches / (s.cols * pageHeight)) * 100;

    var fit, note;
    if (cpl < 26) {
      fit = 'too tight';
      note = 'At ' + cpl + ' characters the line is a ladder. Widen the measure or drop the type a half point.';
    } else if (cpl > 62) {
      fit = 'loose';
      note = 'A ' + cpl + '-character line asks the eye to travel; readers lose the return. Tighten the measure.';
    } else if (pageUsed > 96) {
      fit = 'spills';
      note = 'The copy needs ' + pageUsed.toFixed(0) + '% of a page. Cut about ' + Math.round((pageUsed - 92) / 100 * s.words) + ' words, or give it the spread.';
    } else if (pageUsed < 9) {
      fit = 'short';
      note = 'Only ' + pageUsed.toFixed(0) + '% of the page — that is a brief, not a feature. Add reporting or lift the type size.';
    } else {
      fit = 'fits';
      note = 'A ' + cpl + '-character line at ' + s.size + ' pt, filling ' + pageUsed.toFixed(0) + '% of the page across ' + s.cols + ' columns. ' + (cpl > 50 ? 'Long end of comfortable — good for a reported feature.' : 'Comfortable for continuous reading.');
    }
    return { cpl: cpl, lines: lines, colInches: colInches, pageUsed: pageUsed, fit: fit, note: note, leadingIn: leadingIn };
  }

  function drawProof(s, res) {
    var W = 680, H = 420;
    var ctx = setup(canvas, W, H);
    ctx.fillStyle = NEWS;
    ctx.fillRect(0, 0, W, H);

    var mx = 22, my = 20;
    var innerW = W - mx * 2, innerH = H - my * 2;

    /* page edge */
    ctx.strokeStyle = 'rgba(20,20,20,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, innerW, innerH);

    /* header rule and folio */
    ctx.fillStyle = INK;
    ctx.fillRect(mx, my, innerW, 3);
    ctx.font = '400 8px "Space Mono", monospace';
    ctx.fillStyle = GREY;
    ctx.fillText('THE EDITION · PROOF', mx, my + 14);

    /* headline block, sized by deck words */
    var deckLines = Math.max(1, Math.min(4, Math.ceil(s.deck / 7)));
    var headH = deckLines * 15 + 10;
    var headY = my + 22;
    ctx.fillStyle = NEWS2;
    ctx.fillRect(mx, headY, innerW, headH);
    ctx.strokeStyle = 'rgba(20,20,20,0.2)';
    ctx.strokeRect(mx, headY, innerW, headH);
    ctx.fillStyle = 'rgba(20,20,20,0.72)';
    for (var h = 0; h < deckLines; h++) {
      var wLine = innerW - 18 - (h === deckLines - 1 ? innerW * 0.35 : 0);
      ctx.fillRect(mx + 9, headY + 10 + h * 15, wLine, h === 0 ? 7 : 4);
    }
    if (s.deck === 0) {
      ctx.fillStyle = RED;
      ctx.font = '400 8px "Space Mono", monospace';
      ctx.fillText('NO HEADLINE OR DECK', mx + 10, headY + headH / 2 + 3);
    }

    /* body columns */
    var bodyTop = headY + headH + 14;
    var bodyH = my + innerH - bodyTop - 16;
    var gap = 12;
    var colW = (innerW - gap * (s.cols - 1)) / s.cols;
    var lineH = Math.max(4, Math.min(11, bodyH / 42));

    /* A newspaper column is set to its measure, so the ruled lines fill
       the column. The measure is reported in the readout, not re-drawn. */
    var ruleW = colW * 0.98;

    var perCol = Math.max(3, Math.ceil(res.lines / s.cols));
    var step = bodyH / perCol;
    var scaleNote = '';
    if (step < 3.2) {
      perCol = Math.floor(bodyH / 3.2);
      step = bodyH / perCol;
      scaleNote = 'REDUCED';
    }
    var capacity = perCol * s.cols;
    var drawn = Math.min(res.lines, capacity);

    var k = 0;
    for (var c = 0; c < s.cols; c++) {
      var x = mx + c * (colW + gap);
      ctx.strokeStyle = 'rgba(20,20,20,0.07)';
      ctx.beginPath();
      ctx.moveTo(x - gap / 2, bodyTop - 6);
      ctx.lineTo(x - gap / 2, bodyTop + bodyH);
      ctx.stroke();

      for (var l = 0; l < perCol && k < drawn; l++, k++) {
        var y = bodyTop + l * step + step * 0.62;
        ctx.strokeStyle = 'rgba(20,20,20,0.52)';
        ctx.lineWidth = Math.max(0.8, Math.min(1.6, step * 0.28));
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + ruleW, y);
        ctx.stroke();
      }
    }

    ctx.fillStyle = res.fit === 'spills' ? RED : GREY;
    ctx.font = '400 8px "Space Mono", monospace';
    ctx.fillText(s.cols + ' COLS · ' + s.measure + ' P · ' + s.size + ' PT · ' + res.cpl + ' CPL · ' + res.lines + ' LINES' + (scaleNote ? ' · ' + scaleNote : ''), mx + 2, my + innerH - 4);
    if (res.fit !== 'spills') ctx.fillText('P. 1', mx + innerW - 18, my + innerH - 4);

  }

  function readFitter() {
    return {
      words: parseInt(el.words.value, 10),
      size: parseFloat(el.size.value),
      measure: parseFloat(el.measure.value),
      cols: parseInt(el.cols.value, 10),
      deck: parseInt(el.deck.value, 10)
    };
  }

  function renderFitter() {
    var s = readFitter();
    el.wordsOut.textContent = s.words + ' words';
    el.sizeOut.textContent = s.size + ' pt';
    el.measureOut.textContent = s.measure + ' p';
    el.colsOut.textContent = String(s.cols);
    el.deckOut.textContent = String(s.deck);

    var res = compute(s);
    el.cpl.textContent = String(res.cpl);
    el.inches.textContent = res.colInches.toFixed(1);
    el.page.textContent = res.pageUsed.toFixed(0);
    el.fit.textContent = res.fit;
    el.note.textContent = res.note;

    drawProof(s, res);
  }

  ['input', 'change'].forEach(function (evt) {
    ['words', 'size', 'measure', 'cols', 'deck'].forEach(function (k) {
      el[k].addEventListener(evt, renderFitter);
    });
  });

  renderFitter();

  /* ---------- archive register ---------- */

  var RECORDS = {
    'A-01': {
      title: 'Annual running cost of the theatre',
      doc: 'Audited accounts, FY 2025–26, p. 4',
      held: 'The theatre trust, via the director',
      rights: 'Figures quoted with permission; the document itself is not published',
      tamper: false
    },
    'A-02': {
      title: 'Lease expiry date of 31 March',
      doc: 'Registered lease deed, no. 4471/2015, p. 2',
      held: 'Registrar of assurances, Kolkata',
      rights: 'Public record; copy obtained on payment of fees',
      tamper: false
    },
    'A-03': {
      title: 'Sixty people queued on Sunday',
      doc: "Reporter's notebook, 12 October, counted twice",
      held: 'The desk',
      rights: 'Own reporting; a second count is being arranged',
      tamper: false
    },
    'A-04': {
      title: 'Forty volunteers since 2015',
      doc: 'Volunteer roster, 2015–2026',
      held: 'The theatre trust',
      rights: 'Names withheld; the count verified against the roster',
      tamper: false
    },
    'A-05': {
      title: 'Decision expected in February',
      doc: 'Verbal confirmation, committee clerk, 6 November',
      held: 'Unwritten — one conversation',
      rights: 'On the record, but nothing in writing yet',
      tamper: true
    }
  };

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ('0000000' + (h >>> 0).toString(16)).slice(-8).toUpperCase();
  }

  function recordSum(ref, rec) {
    return hash(ref + '|' + rec.doc + '|' + rec.held + '|' + rec.rights);
  }

  var table = document.getElementById('regTable');
  var detail = document.getElementById('regDetail');

  function showRecord(ref) {
    var rec = RECORDS[ref];
    if (!rec) return;
    document.querySelectorAll('#regTable tbody tr').forEach(function (tr) {
      tr.setAttribute('aria-selected', tr.getAttribute('data-ref') === ref ? 'true' : 'false');
    });
    document.getElementById('regRef').textContent = ref;
    document.getElementById('regTitle').textContent = rec.title;
    document.getElementById('regDoc').textContent = rec.doc;
    document.getElementById('regHeld').textContent = rec.held;
    document.getElementById('regRights').textContent = rec.rights;
    var sum = recordSum(ref, rec);
    var stored = rec.tamper ? hash(ref + '|' + rec.doc + '|' + rec.held + '|altered') : sum;
    document.getElementById('regSum').textContent = stored;
    document.getElementById('regStatus').textContent = 'Not yet checked in this session.';
    document.getElementById('regStatus').className = 'reg-status';
    detail.setAttribute('data-ref', ref);
    detail.setAttribute('data-stored', stored);
    detail.setAttribute('data-sum', sum);
  }

  if (table) {
    table.addEventListener('click', function (e) {
      var tr = e.target.closest('tr[data-ref]');
      if (tr) showRecord(tr.getAttribute('data-ref'));
    });
    table.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var tr = e.target.closest('tr[data-ref]');
      if (tr) {
        e.preventDefault();
        showRecord(tr.getAttribute('data-ref'));
      }
    });
    showRecord('A-01');
  }

  var verifyBtn = document.getElementById('verifyBtn');
  if (verifyBtn) {
    verifyBtn.addEventListener('click', function () {
      var status = document.getElementById('regStatus');
      var ref = detail.getAttribute('data-ref');
      var stored = detail.getAttribute('data-stored');
      var sum = detail.getAttribute('data-sum');
      var rec = RECORDS[ref];
      if (stored === sum) {
        status.className = 'reg-status';
        status.textContent = 'Checked against the stored record on ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '. The document, holder and rights match. ' + (rec && rec.title.indexOf('Decision') === 0 ? 'The clerk still owes the desk a written note.' : 'Safe to print.');
      } else {
        status.className = 'reg-status bad';
        status.textContent = 'This does not match the stored checksum. Do not print it: re-request the document and check who holds it before the edition closes.';
      }
    });
  }
})();
