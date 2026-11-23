/* Alpona Night — interactions.
   No audio is created anywhere on this site. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- mobile drawer ---------- */
  var menu = document.querySelector('.menu');
  var drawer = document.getElementById('drawer');
  if (menu && drawer) {
    menu.addEventListener('click', function () {
      var open = menu.getAttribute('aria-expanded') === 'true';
      menu.setAttribute('aria-expanded', String(!open));
      menu.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      drawer.hidden = open;
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        drawer.hidden = true;
        menu.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- marigold drift over the alpona ---------- */
  var canvas = document.getElementById('petals');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var petals = [];
    var w = 0, h = 0, dpr = 1, running = false, frame = 0;

    function size() {
      var rect = canvas.parentElement.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!petals.length) seed();
    }

    function seed() {
      var count = w < 520 ? 16 : 26;
      petals = [];
      for (var i = 0; i < count; i++) {
        petals.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 2 + Math.random() * 3.4,
          vy: 0.16 + Math.random() * 0.4,
          sway: 0.4 + Math.random() * 0.9,
          phase: Math.random() * Math.PI * 2,
          tone: Math.random() > 0.55 ? 'marigold' : 'vermilion',
          rot: Math.random() * Math.PI
        });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < petals.length; i++) {
        var p = petals[i];
        var x = p.x + Math.sin(t * 0.00035 + p.phase) * (10 * p.sway);
        var y = p.y + Math.cos(t * 0.0004 + p.phase) * 6;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.rot + Math.sin(t * 0.0004 + p.phase) * 0.5);
        ctx.globalAlpha = 0.52;
        ctx.fillStyle = p.tone === 'marigold' ? '#E0A03C' : '#C0482F';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r, p.r * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = 'rgba(246,238,220,.75)';
        ctx.beginPath();
        ctx.arc(0, 0, p.r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function step(t) {
      if (!running) return;
      for (var i = 0; i < petals.length; i++) {
        var p = petals[i];
        p.y -= p.vy * 0.35;
        if (p.y < -12) { p.y = h + 10; p.x = Math.random() * w; }
      }
      draw(t);
      frame = requestAnimationFrame(step);
    }

    function start() {
      if (reduceMotion || running) { draw(performance.now()); return; }
      running = true;
      frame = requestAnimationFrame(step);
    }
    function stop() {
      running = false;
      if (frame) cancelAnimationFrame(frame);
    }

    size();
    start();
    window.addEventListener('resize', function () {
      size();
      draw(performance.now());
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
  }

  /* ---------- the nine rasas ---------- */
  var RASAS = {
    shringara: {
      name: 'Shringara', gloss: 'Love, and the ache of separation',
      colour: '#A62E1C',
      played: 'The slow entrance, a dupatta lifted once and held. The song is sung close to the microphone so the breath is audible.',
      rep: 'Yugal milan, act two; Behula\u2019s wedding night',
      cue: 'A single note on the harmonium, held until the audience settles.'
    },
    hasya: {
      name: 'Hasya', gloss: 'Laughter, and the relief it gives',
      colour: '#C9862B',
      played: 'The comic subplot is played faster than the main story, with one deliberate pause so the crowd can finish laughing before the next line.',
      rep: 'The two cowherds in Yugal milan; the barber in Harishchandra\u2019s market',
      cue: 'A dropped prop, then silence held two beats too long.'
    },
    karuna: {
      name: 'Karuna', gloss: 'Grief that asks for nothing',
      colour: '#4C4A63',
      played: 'Standing still, hands open at the sides. The voice drops to nearly speaking, so the back rows lean in and the field goes quiet.',
      rep: 'Behula\u2019s lament, the riverbank scene',
      cue: 'The harmonium stops mid-phrase and the drone is left alone.'
    },
    raudra: {
      name: 'Raudra', gloss: 'Anger, hot and immediate',
      colour: '#7E2214',
      played: 'The body leads: a step forward on the accusation, the arm held straight rather than raised. Shouting is the last resort, not the first.',
      rep: 'Ravana in A winter Ramayana, act three',
      cue: 'A drum hit on the word, not after it.'
    },
    veera: {
      name: 'Veera', gloss: 'Courage, steady rather than loud',
      colour: '#2F5D62',
      played: 'Weight on the front foot, chin level, the line delivered to the horizon rather than to the other actor. The audience should feel the choice being made.',
      rep: 'Harishchandra\u2019s market, the refusal; Savitri before Yama',
      cue: 'The conch and the drum together, once.'
    },
    bhayanaka: {
      name: 'Bhayanaka', gloss: 'Fear, before it becomes panic',
      colour: '#1B2337',
      played: 'Played from the edge of the lamp light, with the face half-lit. Two backstage hands work the blue cloth snake in the dark behind the actor.',
      rep: 'Behula\u2019s lament, the snakebite',
      cue: 'The lamps are lowered, and the drone slides a semitone down.'
    },
    bibhatsa: {
      name: 'Bibhatsa', gloss: 'Revulsion at what has been done',
      colour: '#3E4A2E',
      played: 'Underplayed. The actor looks at the hands, not the wound, and the audience supplies the horror. Loud disgust gets a laugh instead.',
      rep: 'The clay horse, the demolition scene',
      cue: 'A single clay pot broken offstage.'
    },
    adbhuta: {
      name: 'Adbhuta', gloss: 'Wonder at something larger',
      colour: '#6B4E7A',
      played: 'The reveal is lit from behind before the actor moves. Nobody speaks for four seconds; the crowd does the work of being astonished.',
      rep: 'Chaitanya pala, the kirtan; A winter Ramayana, the snow',
      cue: 'All lamps up at once, rice husk released from the bar.'
    },
    shanta: {
      name: 'Shanta', gloss: 'The quiet after the story ends',
      colour: '#5C6B4F',
      played: 'The closing address, spoken plainly, naming the village and thanking the committee. No music under it. It is the last thing an audience remembers.',
      rep: 'The end of every night, before the lamps are carried out',
      cue: 'The harmonium lid closing.'
    }
  };

  var keys = ['shringara', 'hasya', 'karuna', 'raudra', 'veera', 'bhayanaka', 'bibhatsa', 'adbhuta', 'shanta'];
  var buttons = Array.prototype.slice.call(document.querySelectorAll('.rasa'));
  var panel = {
    index: document.getElementById('rasa-index'),
    name: document.getElementById('rasa-name'),
    gloss: document.getElementById('rasa-gloss'),
    swatch: document.getElementById('rasa-swatch'),
    played: document.getElementById('rasa-played'),
    rep: document.getElementById('rasa-rep'),
    cue: document.getElementById('rasa-cue')
  };

  function showRasa(key) {
    var r = RASAS[key];
    if (!r || !panel.name) return;
    var i = keys.indexOf(key);
    panel.index.textContent = 'Rasa ' + String(i + 1).padStart(2, '0') + ' of 09';
    panel.name.textContent = r.name;
    panel.gloss.textContent = r.gloss;
    panel.swatch.style.background = r.colour;
    panel.played.textContent = r.played;
    panel.rep.textContent = r.rep;
    panel.cue.textContent = r.cue;
    buttons.forEach(function (b) {
      var on = b.getAttribute('data-rasa') === key;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { showRasa(b.getAttribute('data-rasa')); });
  });
  if (buttons.length) showRasa('shringara');

  /* ---------- repertoire filter ---------- */
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var items = Array.prototype.slice.call(document.querySelectorAll('.rep-item'));
  var hint = document.getElementById('rep-hint');
  var labels = { all: 'all eight productions', jatra: 'jatra productions', pala: 'pala productions', kirtan: 'kirtan evenings' };

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var form = chip.getAttribute('data-form');
      var shown = 0;
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-pressed', String(on));
      });
      items.forEach(function (item) {
        var match = form === 'all' || item.getAttribute('data-form') === form;
        item.hidden = !match;
        if (match) shown++;
      });
      if (hint) hint.textContent = 'Showing ' + (form === 'all' ? 'all eight productions.' : shown + ' ' + labels[form] + '.');
    });
  });

  /* ---------- booking form ---------- */
  var form = document.getElementById('booking');
  if (form) {
    var success = document.getElementById('success');
    var summary = document.getElementById('success-summary');
    var mailLink = document.getElementById('mail-link');
    var again = document.getElementById('again');

    function setError(id, message) {
      var err = document.getElementById('err-' + id);
      var input = document.getElementById(id);
      if (err) err.textContent = message || '';
      if (input) {
        if (message) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      }
    }

    var validators = {
      name: function (v) { return v.trim().length >= 2 ? '' : 'Please give a name I can call you by.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'That email does not look complete.'; },
      date: function (v) {
        if (!v) return 'Which night are you asking about?';
        var chosen = new Date(v + 'T00:00:00');
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        return chosen >= today ? '' : 'That date has already passed.';
      },
      place: function (v) { return v.trim().length >= 3 ? '' : 'A village or venue helps me judge the travel.'; }
    };

    ['name', 'email', 'date', 'place'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('blur', function () { setError(id, validators[id](el.value)); });
      el.addEventListener('input', function () {
        if (el.getAttribute('aria-invalid') === 'true') setError(id, validators[id](el.value));
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(validators).forEach(function (id) {
        var el = document.getElementById(id);
        var msg = validators[id](el ? el.value : '');
        setError(id, msg);
        if (msg && !firstBad) firstBad = el;
      });
      var agree = document.getElementById('agree');
      var agreeErr = document.getElementById('err-agree');
      if (agree && !agree.checked) {
        if (agreeErr) agreeErr.textContent = 'Please tick the box so I know the fee will be confirmed in writing.';
        if (!firstBad) firstBad = agree;
      } else if (agreeErr) {
        agreeErr.textContent = '';
      }
      if (firstBad) { firstBad.focus(); return; }

      var data = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        date: document.getElementById('date').value,
        place: document.getElementById('place').value.trim(),
        pala: document.getElementById('pala').value,
        occasion: document.getElementById('occasion').value,
        message: document.getElementById('message').value.trim()
      };
      var nice = new Date(data.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      summary.textContent = data.name + ', your request for ' + data.pala.toLowerCase() + ' on ' + nice +
        ' at ' + data.place + ' is ready to send. The company answers within two days, and the date is only held once the fee is agreed in writing.';

      var body = [
        'Booking request',
        '',
        'Name: ' + data.name,
        'Email: ' + data.email,
        'Phone: ' + (data.phone || 'not given'),
        'Night of: ' + nice,
        'Village or venue: ' + data.place,
        'Production: ' + data.pala,
        'Occasion: ' + data.occasion,
        '',
        data.message || '(No further details.)'
      ].join('\n');
      mailLink.href = 'mailto:karthik@alponanight.in?subject=' + encodeURIComponent('Booking request — ' + nice) + '&body=' + encodeURIComponent(body);

      form.hidden = true;
      success.hidden = false;
      success.focus();
    });

    if (again) {
      again.addEventListener('click', function () {
        success.hidden = true;
        form.hidden = false;
        var name = document.getElementById('name');
        if (name) name.focus();
      });
    }
  }
})();
