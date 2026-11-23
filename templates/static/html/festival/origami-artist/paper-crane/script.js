/* Hasegawa Origami Studio — the fold bench, the menu and the commission form.
   Silent: paper has no soundtrack here. */

(function () {
  'use strict';

  var menu = document.querySelector('.menu');
  var nav = document.querySelector('.nav');
  if (menu && nav) {
    menu.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menu.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && window.innerWidth <= 820) {
        nav.classList.remove('is-open');
        menu.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        menu.setAttribute('aria-expanded', 'false');
        menu.focus();
      }
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------------------------------------------------------- fold bench -- */
  var stage = document.getElementById('fold-stage');
  if (stage) {
    var STEPS = [
      {
        title: 'Square, coloured side up',
        text: 'Start with a square. The coloured side faces up if the finished crane is to be coloured; leave it white if not. Crease nothing yet.',
        creases: 0, type: '—', layers: 1,
        art: '<path d="M110 110H390L370 350H90Z" fill="#fbfaf6" stroke="#b9b6ac" stroke-width="1.2"/>' +
             '<text x="250" y="238" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#8b9097">SQUARE</text>'
      },
      {
        title: 'The diagonal',
        text: 'Fold the top-left corner down to the bottom-right and press the crease with a bone folder, then open. The crease runs corner to corner; it is a valley fold as the paper lies.',
        creases: 1, type: 'Valley', layers: 2,
        art: '<path d="M110 110H390L370 350H90Z" fill="#fbfaf6" stroke="#b9b6ac" stroke-width="1.2"/>' +
             '<path d="M110 110L370 350" stroke="#2f4b6e" stroke-width="1.6"/>' +
             '<path d="M330 316l30 34-8 2Z" fill="#2f4b6e" opacity=".8"/>' +
             '<text x="250" y="120" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#2f4b6e">1 · VALLEY</text>'
      },
      {
        title: 'The second diagonal',
        text: 'Fold the top-right corner to the bottom-left and crease, then open. Two creases now cross at the centre, which is where every later step will meet.',
        creases: 2, type: 'Valley', layers: 2,
        art: '<path d="M110 110H390L370 350H90Z" fill="#fbfaf6" stroke="#b9b6ac" stroke-width="1.2"/>' +
             '<path d="M110 110L370 350" stroke="#2f4b6e" stroke-width="1.6"/>' +
             '<path d="M390 110L90 350" stroke="#2f4b6e" stroke-width="1.2" stroke-dasharray="6 5"/>' +
             '<circle cx="250" cy="230" r="3" fill="#2f4b6e"/>' +
             '<text x="250" y="120" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#2f4b6e">2 · VALLEY</text>'
      },
      {
        title: 'Turn over',
        text: 'Turn the sheet over. Fold it in half horizontally and vertically, crease both, and open. These two creases will be mountain folds when the paper is collapsed.',
        creases: 4, type: 'Mountain', layers: 4,
        art: '<path d="M110 110H390L370 350H90Z" fill="#efece3" stroke="#b9b6ac" stroke-width="1.2"/>' +
             '<path d="M90 230L390 230M250 110L240 350" stroke="#2f4b6e" stroke-width="1.2" stroke-dasharray="6 5"/>' +
             '<path d="M110 110L370 350M390 110L90 350" stroke="#8fa2b8" stroke-width="1" stroke-opacity=".8"/>' +
             '<path d="M330 60a30 30 0 1 0 16 12" fill="none" stroke="#8b9097" stroke-width="1.2"/>' +
             '<path d="M344 64l4 10-11-2Z" fill="#8b9097"/>' +
             '<text x="250" y="70" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#2f4b6e">3 · MOUNTAIN</text>'
      },
      {
        title: 'Collapse to the square base',
        text: 'Bring the four corners together so that the paper collapses along the creases into a smaller square with an open flap at the bottom. Press it flat. This is the preliminary base.',
        creases: 8, type: 'Collapse', layers: 4,
        art: '<path d="M250 122L352 232L250 342L148 232Z" fill="#fbfaf6" stroke="#b9b6ac" stroke-width="1.2"/>' +
             '<path d="M250 122L148 232M250 122L352 232" stroke="#b9b6ac" stroke-width="1"/>' +
             '<path d="M250 122V342" stroke="#8fa2b8" stroke-width="1" stroke-dasharray="5 4"/>' +
             '<path d="M250 122L250 342L148 232Z" fill="#2f4b6e" fill-opacity=".04"/>' +
             '<text x="250" y="368" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#2f4b6e">PRELIMINARY BASE · 4 LAYERS</text>'
      },
      {
        title: 'Kite folds',
        text: 'Fold the two lower edges of the top layer in to the centre line, then turn over and repeat behind. The shape now looks like a kite; the narrow point at the bottom will become the neck and tail.',
        creases: 12, type: 'Valley', layers: 8,
        art: '<path d="M250 122L352 232L250 342L148 232Z" fill="#fbfaf6" stroke="#b9b6ac" stroke-width="1.2"/>' +
             '<path d="M250 122L250 342" stroke="#8fa2b8" stroke-width="1" stroke-dasharray="5 4"/>' +
             '<path d="M250 122L148 232L250 342Z" fill="#e8e5da" stroke="#b9b6ac" stroke-width="1"/>' +
             '<path d="M148 232L250 232M352 232L250 232" stroke="#2f4b6e" stroke-width="1.3"/>' +
             '<text x="250" y="368" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#2f4b6e">KITE · BOTH SIDES</text>'
      },
      {
        title: 'Petal fold',
        text: 'Lift the top layer by its bottom point, open it upward along the creases, and flatten it into a long diamond. This is a petal fold, and it is the step where most first attempts tear the paper.',
        creases: 16, type: 'Petal', layers: 8,
        art: '<path d="M250 122L352 232L250 342L148 232Z" fill="#efece3" stroke="#b9b6ac" stroke-width="1.2"/>' +
             '<path d="M250 122L330 250L250 300L170 250Z" fill="#fbfaf6" stroke="#2f4b6e" stroke-width="1.3"/>' +
             '<path d="M250 122V300" stroke="#8fa2b8" stroke-width="1" stroke-dasharray="4 3"/>' +
             '<path d="M250 300l-16 22h32Z" fill="#2f4b6e" opacity=".12"/>' +
             '<text x="250" y="368" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#2f4b6e">PETAL FOLD, FRONT</text>'
      },
      {
        title: 'Repeat behind',
        text: 'Turn the model over and make the same petal fold on the back. The bird base is now complete: four long points, two on each side, and the paper is mostly hidden inside itself.',
        creases: 20, type: 'Petal', layers: 16,
        art: '<path d="M250 122L352 232L250 342L148 232Z" fill="#efece3" stroke="#b9b6ac" stroke-width="1.2"/>' +
             '<path d="M250 122L330 250L250 300L170 250Z" fill="#fbfaf6" stroke="#2f4b6e" stroke-width="1.3"/>' +
             '<path d="M250 140L322 240L250 286L178 240Z" fill="none" stroke="#2f4b6e" stroke-width="1" stroke-dasharray="5 4"/>' +
             '<text x="250" y="368" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#2f4b6e">BIRD BASE · 16 LAYERS</text>'
      },
      {
        title: 'Neck and tail',
        text: 'Fold the two lower points upward and outward with inside reverse folds, one slim for the neck and one wider for the tail. A reverse fold means opening the point, pushing it inside, and flattening it the other way.',
        creases: 26, type: 'Reverse', layers: 8,
        art: '<path d="M250 150L340 236L250 330L160 236Z" fill="#fbfaf6" stroke="#b9b6ac" stroke-width="1.2"/>' +
             '<path d="M250 150L250 330" stroke="#8fa2b8" stroke-width="1" stroke-dasharray="4 3"/>' +
             '<path d="M250 300L180 200L196 190L258 288Z" fill="#f2f0e8" stroke="#2f4b6e" stroke-width="1.1"/>' +
             '<path d="M250 300L320 210L306 198L242 288Z" fill="#e9e6dc" stroke="#2f4b6e" stroke-width="1.1"/>' +
             '<text x="250" y="368" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#2f4b6e">NECK LEFT · TAIL RIGHT</text>'
      },
      {
        title: 'Head and wings',
        text: 'Reverse fold a small head at the top of the neck, then fold the wings down and out. Open the body gently with a finger so the wings sit at an angle; a crane pressed flat looks like a paper hat.',
        creases: 32, type: 'Reverse + valley', layers: 4,
        art: '<polygon points="185,283 250,235 112,168" fill="#f1eee5" stroke="#2f4b6e" stroke-width="1"/>' +
             '<polygon points="315,283 250,235 388,168" fill="#e6e2d6" stroke="#2f4b6e" stroke-width="1"/>' +
             '<polygon points="306,278 318,290 392,238 380,226" fill="#f4f1e8" stroke="#2f4b6e" stroke-width="1"/>' +
             '<polygon points="196,278 212,268 178,182 160,192" fill="#f8f6ef" stroke="#2f4b6e" stroke-width="1"/>' +
             '<polygon points="178,182 152,160 126,168 144,182 160,192" fill="#f1eee5" stroke="#2f4b6e" stroke-width="1"/>' +
             '<polygon points="126,168 106,166 124,176" fill="#e6e2d6" stroke="#2f4b6e" stroke-width="1"/>' +
             '<circle cx="150" cy="174" r="1.7" fill="#2f4b6e"/>' +
             '<polygon points="250,235 315,283 250,345 185,283" fill="#fbfaf5" stroke="#2f4b6e" stroke-width="1.1"/>' +
             '<polygon points="250,235 315,283 250,345" fill="#e8e4d9" fill-opacity=".5"/>' +
             '<path d="M250 240v100M195 285h110" stroke="#8fa2b8" stroke-width=".8" fill="none"/>' +
             '<path d="M250 285 150 210M250 285 350 210" stroke="#8fa2b8" stroke-width=".7" stroke-dasharray="3 3" fill="none"/>' +
             '<text x="250" y="368" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#2f4b6e">CRANE · 32 CREASES</text>'
      }
    ];

    var current = 0;
    var stageCap = document.getElementById('stage-cap');
    var stepNum = document.getElementById('step-num');
    var stepTitle = document.getElementById('step-title');
    var stepText = document.getElementById('step-text');
    var stepCreases = document.getElementById('step-creases');
    var stepType = document.getElementById('step-type');
    var stepLayers = document.getElementById('step-layers');
    var prevBtn = document.getElementById('prev-step');
    var nextBtn = document.getElementById('next-step');
    var stepButtons = document.querySelectorAll('[data-step]');

    function render() {
      var s = STEPS[current];
      stage.innerHTML =
        '<rect width="480" height="430" fill="#fbfaf6"/>' +
        '<g stroke="#e6e3da" stroke-width=".7">' +
        '<path d="M0 80h480M0 160h480M0 240h480M0 320h480M0 400h480"/>' +
        '<path d="M80 0v430M160 0v430M240 0v430M320 0v430M400 0v430"/>' +
        '</g>' +
        s.art +
        '<text x="20" y="24" font-family="JetBrains Mono, monospace" font-size="9" fill="#8b9097">CRANE · STEP ' + (current + 1) + ' OF 10</text>';
      stage.setAttribute('aria-label', 'Fold diagram, step ' + (current + 1) + ': ' + s.title + '. ' + s.text);

      stageCap.textContent = 'Step ' + (current + 1) + ' of 10';
      stepNum.textContent = String(current + 1).padStart(2, '0');
      stepTitle.textContent = s.title;
      stepText.textContent = s.text;
      stepCreases.textContent = String(s.creases);
      stepType.textContent = s.type;
      stepLayers.textContent = String(s.layers);
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === STEPS.length - 1;
      Array.prototype.forEach.call(stepButtons, function (b) {
        b.classList.toggle('is-on', parseInt(b.dataset.step, 10) === current + 1);
      });
    }

    prevBtn.addEventListener('click', function () { if (current > 0) { current--; render(); } });
    nextBtn.addEventListener('click', function () { if (current < STEPS.length - 1) { current++; render(); } });
    Array.prototype.forEach.call(stepButtons, function (b) {
      b.addEventListener('click', function () { current = parseInt(b.dataset.step, 10) - 1; render(); });
    });
    document.addEventListener('keydown', function (e) {
      if (!document.querySelector('.bench')) return;
      if (e.target.matches('input, select, textarea, button')) return;
      if (e.key === 'ArrowRight' && current < STEPS.length - 1) { current++; render(); }
      if (e.key === 'ArrowLeft' && current > 0) { current--; render(); }
    });

    render();
  }

  /* ------------------------------------------------------------- sheet -- */
  var sheet = document.getElementById('sheet');
  if (sheet) {
    var sheetOut = document.getElementById('sheet-out');
    var cSpan = document.getElementById('c-span');
    var cHeight = document.getElementById('c-height');
    var cPaper = document.getElementById('c-paper');
    var cTime = document.getElementById('c-time');

    function calc() {
      var s = parseFloat(sheet.value);
      sheetOut.textContent = s + ' cm';
      cSpan.textContent = (s * 0.98).toFixed(1) + ' cm';
      cHeight.textContent = (s * 0.62).toFixed(1) + ' cm';
      cPaper.textContent = s <= 10 ? '40 g tant' : s <= 22 ? '60 g tant' : '90 g kozo';
      cTime.textContent = Math.round(8 + s * 1.2) + ' min';
    }
    sheet.addEventListener('input', calc);
    calc();
  }

  /* --------------------------------------------------------------- form -- */
  var enquiry = document.getElementById('commission-form');
  if (enquiry) {
    var status = document.getElementById('form-status');
    var fields = [
      { id: 'name', test: function (v) { return v.trim().length >= 2; }, msg: 'A name to reply to, please.' },
      { id: 'email', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'That email looks incomplete.' },
      { id: 'kind', test: function (v) { return v !== ''; }, msg: 'Choose the kind of work.' },
      { id: 'date', test: function (v) { return v !== ''; }, msg: 'When would it need to be ready?' },
      { id: 'message', test: function (v) { return v.trim().length >= 12; }, msg: 'A line about the room and the size is enough.' }
    ];

    function setErr(id, msg) {
      var e = document.getElementById('err-' + id);
      if (e) e.textContent = msg;
      var input = document.getElementById(id);
      if (input) {
        if (msg) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      }
    }

    fields.forEach(function (fd) {
      var input = document.getElementById(fd.id);
      if (input) {
        input.addEventListener('input', function () { setErr(fd.id, ''); });
        input.addEventListener('change', function () { setErr(fd.id, ''); });
      }
    });

    enquiry.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      fields.forEach(function (fd) {
        var input = document.getElementById(fd.id);
        if (!input) return;
        var ok = fd.test(input.value);
        setErr(fd.id, ok ? '' : fd.msg);
        if (!ok && !bad) bad = input;
      });
      if (bad) {
        if (status) status.textContent = 'The studio still needs: ' + fields.filter(function (fd) {
          var i = document.getElementById(fd.id);
          return i && !fd.test(i.value);
        }).map(function (fd) { return fd.id; }).join(', ') + '.';
        bad.focus();
        return;
      }
      var get = function (id) { var e2 = document.getElementById(id); return e2 ? e2.value : ''; };
      var subject = 'Studio enquiry — ' + get('kind') + ' — ' + get('name');
      var body = 'Name: ' + get('name') +
        '\nEmail: ' + get('email') +
        '\nKind: ' + get('kind') +
        '\nNeeded by: ' + get('date') +
        '\nRoom and size: ' + get('place') +
        '\n\n' + get('message');
      var link = document.getElementById('mail-link');
      if (link) {
        link.href = 'mailto:hello@hasegawaorigami.jp?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        link.hidden = false;
      }
      if (status) status.textContent = 'Checked. Open the message in your mail app to send it. The studio answers on Mondays and Thursdays.';
    });
  }
})();
