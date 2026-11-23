/* lebkuchen-heart — shared script: view-transition guard, mobile menu,
   Heart Order Planner (index), order form confirmation (contact). */
(function () {
  'use strict';

  /* Cross-document view transitions abort as unhandled rejections in
     Chrome when a navigation is interrupted; swallow only those. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- mobile menu ---------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('mobilePanel');
  if (btn && panel) {
    function close() {
      document.body.classList.remove('nav-open');
      btn.setAttribute('aria-expanded', 'false');
      panel.setAttribute('hidden', '');
    }
    btn.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        panel.removeAttribute('hidden');
        requestAnimationFrame(function () {
          var first = panel.querySelector('a');
          if (first) first.focus({ preventScroll: true });
        });
      } else {
        panel.setAttribute('hidden', '');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        close();
        btn.focus();
      }
    });
  }

  /* ---------- the printed size table, as data ----------
     These numbers are the same ones printed in the size table on the
     home page and the order form: the planner reads what the page says. */
  var SIZES = {
    S:   { name: 'Handlich',  cm: 12, dough: 90,  perTray: 6, base: 3, maxChars: 10, price: 6  },
    M:   { name: 'Klassik',   cm: 18, dough: 180, perTray: 4, base: 4, maxChars: 16, price: 9  },
    L:   { name: 'Großherz',  cm: 24, dough: 320, perTray: 2, base: 5, maxChars: 24, price: 14 },
    XL:  { name: 'Riesenherz',cm: 32, dough: 550, perTray: 1, base: 7, maxChars: 34, price: 22 },
    XXL: { name: 'Schauherz', cm: 45, dough: 950, perTray: 1, base: 9, maxChars: 48, price: 38 }
  };
  var ORDER = ['S', 'M', 'L', 'XL', 'XXL'];
  var PER_CHAR_MIN = 0.5; /* lettering minutes per character, as printed */

  function fmtDough(g) {
    return g >= 1000 ? (g / 1000).toFixed(2) + ' kg' : g + ' g';
  }
  function fmtMinutes(min) {
    min = Math.round(min);
    if (min < 60) return min + ' min';
    var h = Math.floor(min / 60), m = min % 60;
    return h + ' h ' + (m ? m + ' min' : '');
  }
  function smallestFit(chars) {
    for (var i = 0; i < ORDER.length; i++) {
      if (SIZES[ORDER[i]].maxChars >= chars) return ORDER[i];
    }
    return null;
  }

  /* ---------- Heart Order Planner (index) ---------- */
  var planner = document.getElementById('planner');
  if (planner) {
    var state = { size: 'M', qty: 12 };
    var chips = planner.querySelectorAll('.chip[data-size]');
    var qOut = document.getElementById('qVal');
    var insc = document.getElementById('insc');
    var charCount = document.getElementById('charCount');
    var outDough = document.getElementById('outDough');
    var outTrays = document.getElementById('outTrays');
    var outIcing = document.getElementById('outIcing');
    var outPrice = document.getElementById('outPrice');
    var verdict = document.getElementById('verdict');
    var verdictText = document.getElementById('verdictText');

    function render() {
      var s = SIZES[state.size];
      var text = insc.value.trim();
      var chars = text.length;
      var dough = s.dough * state.qty;
      var trays = Math.ceil(state.qty / s.perTray);
      var icing = (s.base + PER_CHAR_MIN * chars) * state.qty;
      var price = s.price * state.qty;

      qOut.textContent = state.qty;
      charCount.textContent = chars + ' of ' + s.maxChars + ' characters on the ' +
        s.name + ' (' + s.cm + ' cm)';
      outDough.textContent = fmtDough(dough);
      outTrays.textContent = trays + (trays === 1 ? ' tray' : ' trays');
      outIcing.textContent = fmtMinutes(icing);
      outPrice.textContent = '€' + price;

      if (chars === 0) {
        verdict.classList.remove('warn');
        verdictText.textContent = 'Type your words above and I will count the letters ' +
          'the way I pipe them — spaces count too.';
      } else if (chars <= s.maxChars) {
        verdict.classList.remove('warn');
        verdictText.textContent = '"' + text + '" fits the ' + s.name + ' with room for a ' +
          'piped border and two sugar flowers. Good choice.';
      } else {
        var fit = smallestFit(chars);
        verdict.classList.add('warn');
        if (fit) {
          var f = SIZES[fit];
          verdictText.textContent = 'Too long for the ' + s.name + ': "' + text + '" needs ' +
            chars + ' characters, and this heart holds ' + s.maxChars + '. The smallest heart ' +
            'that carries your words is the ' + f.name + ' (' + f.cm + ' cm, up to ' +
            f.maxChars + ' characters, €' + f.price + ').';
        } else {
          verdictText.textContent = '"' + text + '" is ' + chars + ' characters — even the ' +
            'Schauherz tops out at 48. Shorten the words, or split them across two hearts: ' +
            'half a sentence each, hung side by side.';
        }
      }
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        state.size = chip.getAttribute('data-size');
        render();
      });
    });
    document.getElementById('qMinus').addEventListener('click', function () {
      state.qty = Math.max(1, state.qty - 1); render();
    });
    document.getElementById('qPlus').addEventListener('click', function () {
      state.qty = Math.min(200, state.qty + 1); render();
    });
    insc.addEventListener('input', render);
    render();
  }

  /* ---------- order form (contact) ---------- */
  var form = document.getElementById('orderForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName').value.trim();
      var sizeKey = document.getElementById('fSize').value;
      var qty = parseInt(document.getElementById('fQty').value, 10) || 1;
      var text = document.getElementById('fInsc').value.trim();
      var date = document.getElementById('fDate').value;
      var s = SIZES[sizeKey];
      var chars = text.length;
      var total = s.price * qty;

      var seed = (name.length * 31 + qty * 7 + chars * 13 + sizeKey.length * 101) % 9000 + 1000;
      var ref = 'LH-2026-' + seed;

      var warn = '';
      if (chars > s.maxChars) {
        var fit = smallestFit(chars);
        warn = fit
          ? ' One thing: your text is ' + chars + ' characters and the ' + s.name +
            ' holds ' + s.maxChars + '. I will write back suggesting the ' +
            SIZES[fit].name + ' (' + SIZES[fit].cm + ' cm) before I bake anything.'
          : ' One thing: your text is ' + chars + ' characters — more than even the ' +
            'Schauherz holds (48). I will write back so we can shorten it together.';
      }

      document.getElementById('cRef').textContent = ref;
      document.getElementById('cSummary').textContent =
        'Thank you, ' + (name || 'friend') + '. Your order is in my book: ' + qty + ' × ' +
        s.name + ' (' + s.cm + ' cm)' +
        (text ? ', lettered "' + text + '"' : ', no inscription yet') +
        (date ? ', needed by ' + date : '') +
        '. From the printed table that is €' + total + ' for the hearts, ribbon and ' +
        'wrapping included. I reply within two working days with the lettering sketch ' +
        'and the final word on timing.' + warn;

      form.setAttribute('hidden', '');
      var conf = document.getElementById('confirmation');
      conf.removeAttribute('hidden');
      conf.scrollIntoView({ block: 'center', behavior: 'smooth' });
      var ref = document.getElementById('cRef');
      ref.setAttribute('tabindex', '-1');
      ref.focus({ preventScroll: true });
    });
  }

  /* footer year */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
