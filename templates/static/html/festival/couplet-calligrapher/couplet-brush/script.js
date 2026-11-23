/* Couplet Brush — panel bench, nastaliq measurement, navigation, commission form.
   No libraries, no audio. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var top = document.querySelector('.top');
  var navBtn = document.getElementById('navBtn');
  if (top && navBtn) {
    navBtn.addEventListener('click', function () {
      var open = top.classList.toggle('nav-open');
      navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      navBtn.textContent = open ? 'Close' : 'Menu';
    });
    top.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        top.classList.remove('nav-open');
        navBtn.setAttribute('aria-expanded', 'false');
        navBtn.textContent = 'Menu';
      });
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- panel bench ---------- */
  var form = document.getElementById('panelForm');
  if (form) {
    var COUPLETS = {
      'ghalib-d': {
        poet: 'Ghalib',
        ur: ['یہ نہ تھی ہماری قسمت کہ وصالِ یار ہوتا', 'اگر اور جیتے رہتے یہی انتظار ہوتا'],
        en: 'It was not our fate that the beloved should be met. Had we lived on, it would have been this same waiting.',
        chars: 68
      },
      'ghalib-a': {
        poet: 'Ghalib',
        ur: ['ہزاروں خواہشیں ایسی کہ ہر خواہش پہ دم نکلے', 'بہت نکلے مرے ارمان لیکن پھر بھی کم نکلے'],
        en: 'A thousand desires, each one such that I would give my life for it. Many longings surfaced, and still they were too few.',
        chars: 78
      },
      'ghalib-b': {
        poet: 'Ghalib',
        ur: ['دلِ ناداں تجھے ہوا کیا ہے', 'آخر اس درد کی دوا کیا ہے'],
        en: 'Foolish heart, what has come over you? What, in the end, is the cure for this ache?',
        chars: 42
      },
      'ghalib-e': {
        poet: 'Ghalib',
        ur: ['بازیچۂ اطفال ہے دنیا مرے آگے', 'ہوتا ہے شب و روز تماشا مرے آگے'],
        en: 'The world, to me, is a children’s game. Night and day the spectacle plays out before me.',
        chars: 60
      },
      mir: {
        poet: 'Mir Taqi Mir',
        ur: ['پتہ پتہ بوٹا بوٹا حال ہمارا جانے ہے', 'جانے نہ جانے گل ہی نجانے باغ تو سارا جانے ہے'],
        en: 'Every leaf, every seedling knows of my condition. The garden knows it all; only the flower does not.',
        chars: 74
      }
    };

    var coupletSel = document.getElementById('couplet');
    var sizeRange = document.getElementById('size');
    var widthRange = document.getElementById('width');
    var paperSel = document.getElementById('paper');
    var borderSel = document.getElementById('border');
    var swatches = Array.prototype.slice.call(document.querySelectorAll('.swatch'));
    var ink = 'siyahi';

    var panel = document.getElementById('previewPanel');
    var paperEl = document.getElementById('panelPaper');
    var line1 = document.getElementById('previewLine1');
    var line2 = document.getElementById('previewLine2');
    var panelMark = document.getElementById('panelMark');
    var fitNote = document.getElementById('fitNote');
    var caption = document.getElementById('panelCaption');

    var INK = { siyahi: '#17120d', madder: '#8f3a30', indigo: '#2c3a55' };
    var PAPER = {
      wasli: { bg: '#efe2c6', label: 'Wasli paper', cost: 1800 },
      silk: { bg: '#f4eddd', label: 'Silk-mounted', cost: 3200 },
      ivory: { bg: '#faf5e8', label: 'Ivory board', cost: 1400 }
    };
    var BORDER = { gold: { label: 'gold rule', hours: 1.5 }, illuminated: { label: 'illumination', hours: 5 }, plain: { label: 'plain border', hours: 0 } };

    /* measure Nastaliq advances once, at 100px */
    var adv = {};
    var meter = document.createElement('canvas').getContext('2d');
    function measure() {
      meter.font = '100px "Noto Nastaliq Urdu", serif';
      Object.keys(COUPLETS).forEach(function (k) {
        adv[k] = COUPLETS[k].ur.map(function (l) {
          return meter.measureText(l).width;
        });
      });
    }
    measure();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { measure(); compute(); });
    }

    function mmToPanel() {
      var c = COUPLETS[coupletSel.value];
      var S = Number(sizeRange.value);
      var W = Number(widthRange.value);
      var widths = (adv[coupletSel.value] || [c.chars * 40, c.chars * 40]).map(function (px) {
        return (px / 100) * S; /* mm at script size S */
      });
      var marginMm = 30;
      var avail = W * 10 - marginMm * 2;
      var maxLine = Math.max(widths[0], widths[1]);
      var fits = maxLine <= avail;
      var needCm = Math.ceil((maxLine + marginMm * 2) / 10);
      var H = Math.round((2 * S * 2.12 + 62) / 10 * 10) / 10; /* cm */
      return { c: c, S: S, W: W, widths: widths, fits: fits, needCm: needCm, H: H };
    }

    function render() {
      var m = mmToPanel();
      var c = m.c;

      line1.textContent = c.ur[0];
      line2.textContent = c.ur[1];
      line1.style.color = INK[ink];
      line2.style.color = INK[ink];

      paperEl.style.background = PAPER[paperSel.value].bg;
      paperEl.style.minHeight = '';
      panel.classList.remove('no-border');
      panel.classList.toggle('b-plain', borderSel.value === 'plain');
      panel.classList.toggle('b-illuminated', borderSel.value === 'illuminated');
      if (borderSel.value === 'plain') panel.classList.add('no-border');

      panelMark.textContent = 'PANEL · ' + m.W + ' × ' + Math.round(m.H) + ' CM';

      /* size the type to the panel's real width */
      function sizeType() {
        var pxPerMm = paperEl.clientWidth / (m.W * 10);
        var fs = m.S * pxPerMm;
        line1.style.fontSize = fs + 'px';
        line2.style.fontSize = fs + 'px';
        paperEl.style.minHeight = Math.round(m.H * 10 * pxPerMm * 0.92) + 'px';
      }
      sizeType();
      if (!render._raf) {
        render._raf = requestAnimationFrame(function () {
          render._raf = null;
          sizeType();
        });
      }

      document.getElementById('sizeOut').textContent = m.S + ' mm';
      document.getElementById('widthOut').textContent = m.W + ' cm';
      document.getElementById('outPanel').textContent = m.W + ' × ' + Math.round(m.H) + ' cm';

      var inkMl = 0.5 + c.chars * m.S * 0.0012;
      var hours = 3.2 + c.chars * 0.055 + BORDER[borderSel.value].hours + (paperSel.value === 'silk' ? 1 : 0);
      var price = Math.round((hours * 1400 + PAPER[paperSel.value].cost) / 10) * 10;
      document.getElementById('outInk').textContent = inkMl.toFixed(1) + ' ml';
      document.getElementById('outHours').textContent = hours.toFixed(1);
      document.getElementById('outPrice').textContent = '₹' + price.toLocaleString('en-IN');

      if (m.fits) {
        var margin = ((m.W * 10 - Math.max(m.widths[0], m.widths[1])) / 2 / 10).toFixed(1);
        fitNote.textContent = 'Both misras fit on one line at ' + m.S + ' mm. There is ' + margin + ' cm of margin at each end.';
        fitNote.classList.remove('warn');
      } else {
        fitNote.textContent = 'At ' + m.S + ' mm the longer misra needs ' + m.needCm + ' cm of panel, not ' + m.W + '. Widen the panel or drop to ' + Math.max(10, Math.floor(m.S * m.W / m.needCm)) + ' mm, or the line will break and the sher will lose its balance.';
        fitNote.classList.add('warn');
      }

      caption.textContent = PAPER[paperSel.value].label + ', ' + BORDER[borderSel.value].label + ', ' + ink + ' ink. The frame is drawn to the panel’s proportion; the type is set to the size chosen.';
    }

    function compute() {
      render();
    }

    coupletSel.addEventListener('change', compute);
    paperSel.addEventListener('change', compute);
    borderSel.addEventListener('change', compute);
    [sizeRange, widthRange].forEach(function (r) { r.addEventListener('input', compute); });
    swatches.forEach(function (s) {
      s.addEventListener('click', function () {
        ink = s.getAttribute('data-ink');
        swatches.forEach(function (o) {
          var on = o === s;
          o.classList.toggle('is-on', on);
          o.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        compute();
      });
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    window.addEventListener('resize', render);

    compute();
    if (!reduced) {
      panel.style.opacity = '0';
      requestAnimationFrame(function () {
        panel.style.transition = 'opacity 600ms ease';
        panel.style.opacity = '1';
      });
    }
  }

  /* ---------- commission filter ---------- */
  var filters = document.querySelector('.filters');
  if (filters) {
    var rows = document.querySelectorAll('.commission');
    filters.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter');
      if (!btn) return;
      var key = btn.getAttribute('data-filter');
      filters.querySelectorAll('.filter').forEach(function (f) {
        var on = f === btn;
        f.classList.toggle('is-on', on);
        f.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      rows.forEach(function (r) { r.hidden = key !== 'all' && r.getAttribute('data-kind') !== key; });
      var count = document.getElementById('commissionCount');
      if (count) {
        var n = 0;
        rows.forEach(function (r) { if (!r.hidden) n++; });
        count.textContent = n + (n === 1 ? ' commission' : ' commissions');
      }
    });
  }

  /* ---------- commission form ---------- */
  var cf = document.getElementById('commissionForm');
  if (cf) {
    var note = document.getElementById('formNote');
    cf.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('name');
      var email = document.getElementById('email');
      var kind = document.getElementById('kind');
      var when = document.getElementById('when');
      var message = document.getElementById('message');
      var consent = document.getElementById('consent');
      var ok = true;
      function show(id, msg) { var n = document.getElementById(id); if (n) n.textContent = msg || ''; }
      ['errName', 'errEmail', 'errKind', 'errWhen', 'errMessage', 'errConsent'].forEach(function (id) { show(id, ''); });

      if (!name.value.trim() || name.value.trim().length < 2) { show('errName', 'A name for the commission.'); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { show('errEmail', 'That address will not reach the studio.'); ok = false; }
      if (!kind.value) { show('errKind', 'Choose what the panel is for.'); ok = false; }
      if (!when.value) { show('errWhen', 'A date helps me place the commission in the queue.'); ok = false; }
      if (message.value.trim().length < 12) { show('errMessage', 'Tell me the sher, the wall or the occasion.'); ok = false; }
      if (!consent.checked) { show('errConsent', 'Please tick the box so I may reply.'); ok = false; }

      if (!ok) {
        if (note) note.hidden = true;
        var first = cf.querySelector('.err:not(:empty)');
        if (first) first.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
        return;
      }
      if (note) {
        note.hidden = false;
        note.textContent = 'Received, ' + name.value.trim().split(' ')[0] + '. I answer on Sundays and Wednesdays. If you have a sher in mind, send the words with the reply; if not, I will suggest three that suit the space.';
      }
      cf.reset();
    });
  }
})();
