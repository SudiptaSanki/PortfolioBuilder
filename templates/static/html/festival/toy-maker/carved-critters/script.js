/* Carved Critters — the carver's bench. Silent: no audio is created here. */
(function () {
  'use strict';

  var years = document.querySelectorAll('[data-year]');
  for (var y = 0; y < years.length; y++) years[y].textContent = new Date().getFullYear();

  var toyBody = document.getElementById('toyBody');
  if (!toyBody) { initOrderForm(); return; }

  var bodyWidth = document.getElementById('bodyWidth');
  var earLength = document.getElementById('earLength');
  var tailCurl = document.getElementById('tailCurl');
  var bodyOut = document.getElementById('bodyOut');
  var earOut = document.getElementById('earOut');
  var tailOut = document.getElementById('tailOut');
  var piecesOut = document.getElementById('piecesOut');
  var lengthOut = document.getElementById('lengthOut');
  var sandOut = document.getElementById('sandOut');
  var finishOut = document.getElementById('finishOut');
  var note = document.getElementById('toolNote');
  var workpieceNote = document.getElementById('workpieceNote');
  var crank = document.getElementById('crank');
  var reset = document.getElementById('reset');
  var wheelsBox = document.getElementById('wheels');

  var WOODS = {
    lime: { body: '#e0b578', shade: '#c9975a', grain: '#a97640', label: 'lime' },
    beech: { body: '#d9a06a', shade: '#bd8049', grain: '#96602f', label: 'beech' },
    walnut: { body: '#9a6a42', shade: '#7d5130', grain: '#5f3a20', label: 'walnut' },
  };

  var defaults = { animal: 'hare', width: 66, ears: 44, tail: 60, wood: 'lime', wheels: true };

  function value(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : defaults[name];
  }

  function build() {
    var animal = value('animal');
    var wood = WOODS[value('wood')] || WOODS.lime;
    var w = Number(bodyWidth.value);
    var ears = Number(earLength.value);
    var tail = Number(tailCurl.value);
    var withWheels = wheelsBox.checked;

    bodyOut.textContent = String(w);
    earOut.textContent = String(ears);
    tailOut.textContent = String(tail);

    var rw = 40 + (w - 46) * (46 / 40);        // body radius x, 40..86
    var rx = Math.round(rw);
    var ry = Math.round(rw * 0.76);
    var cx = 170;
    var cy = 196;
    var headR = animal === 'hare' ? Math.round(rw * 0.42) : Math.round(rw * 0.52);
    var headX = cx + Math.round(rw * 0.66);
    var headY = cy - Math.round(rw * 0.62);
    var parts = 5;

    var s = '';
    s += '<ellipse cx="' + cx + '" cy="' + (cy + 6) + '" rx="' + rx + '" ry="' + ry + '" fill="' + wood.body + '" stroke="' + wood.grain + '" stroke-opacity=".45"/>';
    s += '<path d="M' + (cx - rx + 8) + ' ' + (cy - ry * 0.4) + 'q' + (rx * 0.7) + ' ' + (ry * 0.5) + ' ' + (rx * 1.4) + ' -' + (ry * 0.1) + '" fill="none" stroke="' + wood.grain + '" stroke-width="1.3" stroke-opacity=".45"/>';
    s += '<path d="M' + (cx - rx + 4) + ' ' + (cy + ry * 0.35) + 'q' + (rx * 0.8) + ' ' + (ry * 0.4) + ' ' + (rx * 1.5) + ' -' + (ry * 0.2) + '" fill="none" stroke="' + wood.grain + '" stroke-width="1.2" stroke-opacity=".35"/>';

    /* tail, angle follows the curl dial */
    var tailX = cx - rx + 6;
    var tailY = cy - 4;
    if (animal === 'bear') {
      s += '<circle cx="' + (tailX - 4) + '" cy="' + tailY + '" r="8" fill="' + wood.body + '" stroke="' + wood.grain + '" stroke-opacity=".45"/>';
    } else {
      s += '<g transform="rotate(' + (-tail) + ' ' + tailX + ' ' + tailY + ')">';
      s += '<path d="M' + tailX + ' ' + tailY + 'q-' + (12 + rx * 0.28) + ' -6 -' + (16 + rx * 0.3) + ' 6 q' + (8 + rx * 0.14) + ' 6 ' + (16 + rx * 0.3) + ' -2" fill="' + wood.body + '" stroke="' + wood.grain + '" stroke-opacity=".5"/>';
      s += '</g>';
    }

    /* legs or wheels */
    if (withWheels) {
      parts += 1;
      var wy = cy + ry + 8;
      var wheelR = 16;
      [cx - rx * 0.52, cx + rx * 0.48].forEach(function (wx) {
        s += '<circle class="wheel" cx="' + wx + '" cy="' + wy + '" r="' + wheelR + '" fill="#2f5d4a"/>';
        s += '<circle cx="' + wx + '" cy="' + wy + '" r="' + (wheelR * 0.38) + '" fill="#f3e7d3"/>';
        s += '<path d="M' + wx + ' ' + (wy - wheelR + 3) + 'v' + (wheelR * 2 - 6) + '" stroke="#f3e7d3" stroke-width="1.4" stroke-opacity=".7"/>';
        s += '<path d="M' + (wx - wheelR + 3) + ' ' + wy + 'h' + (wheelR * 2 - 6) + '" stroke="#f3e7d3" stroke-width="1.4" stroke-opacity=".7"/>';
        s += '<circle cx="' + wx + '" cy="' + wy + '" r="3" fill="#c98a2e"/>';
      });
      s += '<path d="M' + cx + ' ' + (cy + ry) + 'v' + (wy - cy - ry - 2) + '" stroke="' + wood.grain + '" stroke-width="5"/>';
      /* pull handle */
      s += '<path d="M' + (cx - rx - 2) + ' ' + (cy + 10) + 'h-26" stroke="' + wood.grain + '" stroke-width="4" stroke-linecap="round"/>';
      s += '<circle cx="' + (cx - rx - 32) + '" cy="' + (cy + 10) + '" r="5" fill="#c98a2e"/>';
    } else {
      var legY = cy + ry - 2;
      [cx - rx * 0.45, cx + rx * 0.4].forEach(function (lx) {
        s += '<rect x="' + (lx - 9) + '" y="' + legY + '" width="18" height="' + (24 + ry * 0.18) + '" rx="8" fill="' + wood.shade + '" stroke="' + wood.grain + '" stroke-opacity=".4"/>';
      });
    }

    /* head and ears */
    s += '<circle cx="' + headX + '" cy="' + headY + '" r="' + headR + '" fill="' + wood.shade + '" stroke="' + wood.grain + '" stroke-opacity=".5"/>';
    var earPx = ears * 1.35;

    if (animal === 'hare') {
      s += '<ellipse cx="' + (headX - headR * 0.4) + '" cy="' + (headY - headR - earPx * 0.42) + '" rx="' + (headR * 0.22) + '" ry="' + (earPx * 0.55) + '" transform="rotate(-12 ' + (headX - headR * 0.4) + ' ' + (headY - headR - earPx * 0.42) + ')" fill="' + wood.body + '" stroke="' + wood.grain + '" stroke-opacity=".5"/>';
      s += '<ellipse cx="' + (headX + headR * 0.36) + '" cy="' + (headY - headR - earPx * 0.4) + '" rx="' + (headR * 0.2) + '" ry="' + (earPx * 0.52) + '" transform="rotate(9 ' + (headX + headR * 0.36) + ' ' + (headY - headR - earPx * 0.4) + ')" fill="' + wood.body + '" stroke="' + wood.grain + '" stroke-opacity=".5"/>';
    } else if (animal === 'bear') {
      var bearEar = Math.max(6, earPx * 0.3);
      s += '<circle cx="' + (headX - headR * 0.62) + '" cy="' + (headY - headR * 0.66) + '" r="' + bearEar + '" fill="' + wood.shade + '" stroke="' + wood.grain + '" stroke-opacity=".5"/>';
      s += '<circle cx="' + (headX + headR * 0.6) + '" cy="' + (headY - headR * 0.66) + '" r="' + bearEar + '" fill="' + wood.shade + '" stroke="' + wood.grain + '" stroke-opacity=".5"/>';
      s += '<circle cx="' + headX + '" cy="' + (headY + headR * 0.32) + '" r="' + (headR * 0.3) + '" fill="' + wood.body + '"/>';
    } else {
      var foxEar = Math.max(8, earPx * 0.42);
      s += '<path d="M' + (headX - headR * 0.7) + ' ' + (headY - headR * 0.6) + 'l' + (foxEar * 0.3) + ' -' + foxEar + ' ' + (foxEar * 0.8) + ' ' + (foxEar * 0.55) + 'z" fill="' + wood.body + '" stroke="' + wood.grain + '" stroke-opacity=".5"/>';
      s += '<path d="M' + (headX + headR * 0.7) + ' ' + (headY - headR * 0.6) + 'l-' + (foxEar * 0.3) + ' -' + foxEar + ' -' + (foxEar * 0.8) + ' ' + (foxEar * 0.55) + 'z" fill="' + wood.body + '" stroke="' + wood.grain + '" stroke-opacity=".5"/>';
      s += '<ellipse cx="' + (headX + headR * 0.55) + '" cy="' + (headY + headR * 0.25) + '" rx="' + (headR * 0.45) + '" ry="' + (headR * 0.3) + '" fill="' + wood.body + '"/>';
    }

    /* face */
    s += '<circle cx="' + (headX + headR * 0.5) + '" cy="' + (headY - headR * 0.12) + '" r="' + Math.max(3, headR * 0.13) + '" fill="#35231a"/>';
    s += '<path d="M' + (headX + headR * 0.82) + ' ' + (headY + headR * 0.18) + 'q6 4 9 0" fill="none" stroke="#35231a" stroke-width="1.8" stroke-linecap="round"/>';
    s += '<circle cx="' + (headX + headR * 1.02) + '" cy="' + (headY + headR * 0.36) + '" r="' + Math.max(4, headR * 0.16) + '" fill="#2f5d4a"/>';

    /* joint pins */
    s += '<circle cx="' + (cx + rx * 0.55) + '" cy="' + (cy - ry * 0.28) + '" r="4" fill="#c98a2e"/>';
    s += '<circle cx="' + (cx - rx * 0.5) + '" cy="' + (cy + ry * 0.2) + '" r="3.4" fill="#c98a2e"/>';

    toyBody.innerHTML = s;

    /* summary numbers */
    parts += animal === 'fox' ? 2 : 0;
    var lengthCm = Math.round(w * 0.18 + 9);
    piecesOut.textContent = String(parts);
    lengthOut.textContent = lengthCm + ' cm';
    sandOut.textContent = value('wood') === 'walnut' ? '4 grits' : '3 grits';
    finishOut.textContent = value('wood') === 'walnut' ? 'Oil, wax' : 'Beeswax';

    var animalWord = animal === 'hare' ? 'Hare' : animal === 'bear' ? 'Bear' : 'Fox';
    if (workpieceNote) {
      workpieceNote.textContent = animalWord + ', ' + lengthCm + ' cm, ' + WOODS[value('wood')].label + ' wood' + (wheelsBox.checked ? ', four wheels.' : ', standing on turned legs.');
    }
    if (note) note.textContent = animalWord + ' laid out: ' + parts + ' pieces before glue.';
  }

  ['bodyWidth', 'earLength', 'tailCurl'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', build);
  });
  ['animal', 'wood'].forEach(function (name) {
    var inputs = document.querySelectorAll('input[name="' + name + '"]');
    for (var i = 0; i < inputs.length; i++) inputs[i].addEventListener('change', build);
  });
  if (wheelsBox) wheelsBox.addEventListener('change', build);

  if (crank) {
    crank.addEventListener('click', function () {
      toyBody.classList.remove('rolling');
      void toyBody.getBoundingClientRect();
      toyBody.classList.add('rolling');
      var revolutions = Math.max(2, Math.round(Number(bodyWidth.value) / 12));
      if (note) note.textContent = 'Crank turned: ' + revolutions + ' revolutions, then it rolled to the end of the bench and stopped against the vice.';
      window.setTimeout(function () { toyBody.classList.remove('rolling'); }, 1400);
    });
  }

  if (reset) {
    reset.addEventListener('click', function () {
      bodyWidth.value = String(defaults.width);
      earLength.value = String(defaults.ears);
      tailCurl.value = String(defaults.tail);
      wheelsBox.checked = defaults.wheels;
      var a = document.querySelector('input[name="animal"][value="hare"]');
      var wd = document.querySelector('input[name="wood"][value="lime"]');
      if (a) a.checked = true;
      if (wd) wd.checked = true;
      build();
      if (note) note.textContent = 'Back to the hare my father drew.';
    });
  }

  build();

  initOrderForm();
})();

function initOrderForm() {
  /* ---------- order form ---------- */
  var form = document.getElementById('order-form');
  if (form) {
    var status = document.getElementById('form-status');
    var date = form.querySelector('#date');
    if (date) {
      var today = new Date();
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      date.min = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
    }
    form.addEventListener('submit', function (evt) {
      evt.preventDefault();
      var name = form.querySelector('#name');
      var email = form.querySelector('#email');
      var piece = form.querySelector('#piece');
      var when = form.querySelector('#date');
      var qty = form.querySelector('#qty');
      var noteField = form.querySelector('#note');
      var missing = [];
      if (!name.value.trim()) missing.push('a name');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) missing.push('an email');
      if (!piece.value) missing.push('which animal');
      if (!when.value) missing.push('a date');
      if (!qty.value || Number(qty.value) < 1) missing.push('how many');
      if (noteField.value.trim().length < 6) missing.push('a word about the wood or the child');
      status.hidden = false;
      if (missing.length) {
        status.textContent = 'Still needed: ' + missing.join(', ') + '.';
        status.style.color = '#a8562a';
        return;
      }
      status.style.color = '';
      status.textContent = 'Order noted: ' + qty.value + ' piece' + (Number(qty.value) > 1 ? 's' : '') + ' for ' + when.value + '. I write back within three days with the drying time.';
      form.reset();
    });
  }
}
