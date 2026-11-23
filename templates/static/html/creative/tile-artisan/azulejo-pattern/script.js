/* Inês Duarte — Azulejos: interactions.
   No audio anywhere: tile painting is not a sound profession, and
   the stub's ambient canvas failed the owner's sound need-test. */
document.documentElement.classList.add('js');

/* Cross-document view transitions occasionally abort (viewport change,
   slow first paint). Chrome reports the abort as an unhandled promise
   rejection; swallow exactly that rejection and nothing else — the
   navigation itself always completes, simply without the fade. */
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* ---------- mobile nav: the menu is a course of tiles ---------- */
(function () {
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('tile-menu');
  if (!btn || !panel) return;
  var open = false;
  function setMenu(state, moveFocus) {
    open = state;
    panel.hidden = !open;
    panel.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    if (moveFocus === false) return;
    if (open) {
      var first = panel.querySelector('a');
      if (first) first.focus();
    } else {
      btn.focus();
    }
  }
  btn.addEventListener('click', function () { setMenu(!open); });
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false, false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) setMenu(false);
  });
  window.addEventListener('resize', function () {
    if (open && window.innerWidth > 860) setMenu(false, false);
  });
})();

/* ---------- the pattern explorer ---------- */
(function () {
  var root = document.getElementById('explorer');
  if (!root) return;
  var panel = document.getElementById('panelGrid');
  var TILE = 15; /* cm — the standard tile */
  /* The rate card, printed in full in the Prices section of index.html.
     The explorer and the table are the same numbers. */
  var RATES = { catalogue: 24, bespoke: 38 };
  var EXTERIOR_EXTRA = 4; /* per tile, frost-proof stoneware body */
  var state = {
    motif: 'estrela', cw: 'cobalto', kind: 'catalogue',
    finish: 'interior', w: 60, h: 45, rot: 0, alt: false
  };
  var roTiles = document.getElementById('roTiles');
  var roSize = document.getElementById('roSize');
  var roArea = document.getElementById('roArea');
  var roPer = document.getElementById('roPer');
  var roPrice = document.getElementById('roPrice');
  var panelNote = document.getElementById('panelNote');

  function eur(n) { return '€' + n.toLocaleString('en-GB'); }

  function render() {
    var across = Math.max(1, Math.ceil(state.w / TILE));
    var down = Math.max(1, Math.ceil(state.h / TILE));
    var tiles = across * down;
    var coverW = across * TILE, coverH = down * TILE;
    var area = (coverW * coverH) / 10000;
    var per = Math.round(tiles / area);
    var rate = RATES[state.kind] + (state.finish === 'exterior' ? EXTERIOR_EXTRA : 0);
    var price = tiles * rate;

    panel.style.gridTemplateColumns = 'repeat(' + across + ', 1fr)';
    var html = '';
    for (var r = 0; r < down; r++) {
      for (var c = 0; c < across; c++) {
        var deg = state.rot * 90 + (state.alt && (r + c) % 2 === 1 ? 90 : 0);
        html += '<div class="tile"><svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" style="transform:rotate(' + deg + 'deg)"><use href="#m-' + state.motif + '"></use></svg></div>';
      }
    }
    panel.innerHTML = html;
    panelNote.textContent = 'Motif: ' + state.motif + ' · drawn at ' + across + ' × ' + down + ' tiles · preview simplified above 24 × 24';
    roTiles.textContent = tiles;
    roSize.innerHTML = coverW + ' × ' + coverH + ' <span class="unit">cm</span>';
    roArea.innerHTML = area.toFixed(2) + ' <span class="unit">m²</span>';
    roPer.textContent = '≈ ' + per;
    roPrice.textContent = eur(price);
  }

  function segWire(id, key, after) {
    var seg = document.getElementById(id);
    if (!seg) return;
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      state[key] = b.getAttribute('data-val');
      if (after) after();
      render();
    });
  }
  segWire('segMotif', 'motif');
  segWire('segCw', 'cw', function () { root.setAttribute('data-cw', state.cw); });
  segWire('segKind', 'kind');
  segWire('segFinish', 'finish');

  var wIn = document.getElementById('sizeW');
  var hIn = document.getElementById('sizeH');
  function readSize() {
    var w = parseInt(wIn.value, 10), h = parseInt(hIn.value, 10);
    if (!isNaN(w)) state.w = Math.min(360, Math.max(15, w));
    if (!isNaN(h)) state.h = Math.min(360, Math.max(15, h));
    render();
  }
  wIn.addEventListener('input', readSize);
  hIn.addEventListener('input', readSize);
  wIn.addEventListener('change', function () { wIn.value = state.w; });
  hIn.addEventListener('change', function () { hIn.value = state.h; });

  var rotBtn = document.getElementById('rotBtn');
  rotBtn.addEventListener('click', function () {
    state.rot = (state.rot + 1) % 4;
    rotBtn.querySelector('.rot-state').textContent = state.rot * 90 + '°';
    render();
  });
  var altBox = document.getElementById('altBox');
  altBox.addEventListener('change', function () {
    state.alt = altBox.checked;
    render();
  });

  render();
})();

/* ---------- enquiry form: validation + honest in-page confirmation ---------- */
(function () {
  var form = document.getElementById('enquiry-form');
  if (!form) return;
  var done = document.getElementById('confirmation');
  function field(name) { return form.querySelector('[name="' + name + '"]'); }
  function setInvalid(input, bad) {
    var wrap = input.closest('.field');
    if (wrap) {
      var err = wrap.querySelector('.err');
      if (err) err.classList.toggle('show', bad);
    }
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    return !bad;
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  function validate() {
    var ok = true, firstBad = null;
    var name = field('name'), email = field('email'),
        type = field('type'), message = field('message');
    [[name, name.value.trim().length >= 2],
     [email, validEmail(email.value.trim())],
     [type, type.value !== ''],
     [message, message.value.trim().length >= 10]
    ].forEach(function (pair) {
      var good = setInvalid(pair[0], !pair[1]);
      if (!good) { ok = false; if (!firstBad) firstBad = pair[0]; }
    });
    if (firstBad) firstBad.focus();
    return ok;
  }
  ['name', 'email', 'type', 'message'].forEach(function (n) {
    var input = field(n);
    if (input) {
      input.addEventListener('input', function () { setInvalid(input, false); });
      input.addEventListener('change', function () { setInvalid(input, false); });
    }
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;
    var ref = 'AZ-2026-' + Math.floor(100 + Math.random() * 900);
    done.querySelector('.ref').textContent = 'Reference ' + ref;
    done.querySelector('.sum').textContent =
      'Thank you, ' + field('name').value.trim().split(' ')[0] + '. Your enquiry about a ' +
      field('type').value + ' has been noted on this page. ' +
      'This demonstration form sends and stores nothing — to reach the studio for real, ' +
      'email oficina@inesduarte.example and quote the reference above.';
    form.style.display = 'none';
    done.classList.add('show');
    done.setAttribute('tabindex', '-1');
    done.focus();
  });
  var again = document.getElementById('send-another');
  if (again) again.addEventListener('click', function () {
    form.reset();
    form.style.display = '';
    done.classList.remove('show');
    field('name').focus();
  });
})();
