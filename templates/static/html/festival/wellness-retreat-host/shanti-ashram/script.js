/* Shanti Ashram — practice builder, breathing pace, and quiet entrances. */
(function () {
  'use strict';
  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yr = doc.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* gentle entrance */
  var targets = doc.querySelectorAll('.hero > *, .horizon, .quiet-facts, .section-head, .day-list li, .sun-arc, .practice-grid > *, .room, .rooms-note, .table-copy, .menu-list li, .voice-grid blockquote, .closing > *, .page-head > *, .retreat, .story-copy p, .team-grid > *, .contact-grid > *');
  if (!reduce && targets.length) {
    targets.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (Math.min(i, 6) * 65) + 'ms';
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        targets.forEach(function (el) { el.classList.add('in'); });
      });
    });
    window.setTimeout(function () {
      targets.forEach(function (el) { el.classList.add('in'); });
    }, 2000);
  }

  /* ---------- stay enquiry ---------- */
  var form = doc.getElementById('stayForm');
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
      var arrive = doc.getElementById('arrive');
      var message = doc.getElementById('message');
      var ok = true;
      if (!name.value.trim()) { flag('name', 'Please add your name.'); ok = false; } else flag('name', '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        flag('email', 'A working email, so we can reply.'); ok = false;
      } else flag('email', '');
      if (!arrive.value) { flag('arrive', 'Choose the night you would arrive.'); ok = false; } else flag('arrive', '');
      if (message.value.trim().length < 12) {
        flag('message', 'A sentence about why you are coming helps.'); ok = false;
      } else flag('message', '');
      if (!ok) { if (success) success.hidden = true; return; }

      var nights = doc.getElementById('nights').value;
      var room = doc.getElementById('room').value;
      var diet = doc.getElementById('diet').value.trim();
      var subject = 'Stay enquiry: ' + name.value.trim() + ', ' + arrive.value;
      var body = 'Name: ' + name.value.trim() + '\nEmail: ' + email.value.trim() +
        '\nArrival: ' + arrive.value + '\nNights: ' + nights + '\nRoom: ' + room +
        '\nDiet: ' + (diet || '—') + '\n\n' + message.value.trim();
      var mailto = 'mailto:stay@shantiashram.in?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      if (success) {
        success.hidden = false;
        success.innerHTML = 'Thank you, ' + name.value.trim().replace(/[<>&]/g, '') + '. Your note is ready — ' +
          '<a href="' + mailto + '">send it from your mail app</a> and Tara will reply within two days. ' +
          'If the week you asked for is full, she will suggest the one either side of it.';
      }
    });
    ['name', 'email', 'arrive'].forEach(function (id) {
      var el = doc.getElementById(id);
      if (el) el.addEventListener('input', function () { flag(id, ''); });
    });
  }

  /* ---------- practice builder ---------- */
  var seqEl = doc.getElementById('sequence');
  if (!seqEl) return;

  var mins = doc.getElementById('mins');
  var minsOut = doc.getElementById('minsOut');
  var totalEl = doc.getElementById('seqTotal');
  var countEl = doc.getElementById('seqCount');
  var breathText = doc.getElementById('breathText');
  var dot = doc.getElementById('breathDot');
  var state = { intent: 'sleep', level: 'new' };

  var PRACTICES = {
    sleep: {
      new: [
        ['Alternate-nostril breathing', 0.20, 'Sit against the wall, spine easy. Six rounds, hand at the nose, no forcing.'],
        ['Supported forward fold', 0.26, 'Bolster under the forehead, knees wide. Stay long enough that the back of the ribs lets go.'],
        ['Legs up the wall', 0.22, 'Hips close to the skirting board, a folded blanket under the pelvis. Ten slow breaths.'],
        ['Body scan, lying down', 0.32, 'From the crown of the head to the soles, naming each part silently. Finish on the left side.']
      ],
      some: [
        ['Alternate-nostril breathing', 0.22, 'Eight rounds. Add a two-count hold at the top if the breath stays smooth.'],
        ['Seated forward fold', 0.24, 'Three long holds of two minutes, a blanket under the sitting bones.'],
        ['Legs up the wall', 0.24, 'Fifteen minutes, eye bag if you have one. This is the practice, not the rest before it.'],
        ['Body scan, lying down', 0.30, 'Longer pauses at the jaw, the diaphragm, and the soles of the feet.']
      ],
      long: [
        ['Alternate-nostril breathing', 0.24, 'Twelve rounds with a five-count hold. Stop if the breath shortens.'],
        ['Long-hold forward folds', 0.28, 'Four holds of three minutes, seated and standing, with the breath unregulated.'],
        ['Legs up the wall', 0.20, 'Twenty minutes. Let the legs be heavy rather than placed.'],
        ['Yoga nidra', 0.28, 'Rotate consciousness through the body; do not try to stay awake.']
      ]
    },
    steady: {
      new: [
        ['Equal breathing', 0.20, 'Four in, four out, counted on the fingers. Fifteen rounds is enough.'],
        ['Standing warm-up', 0.28, 'Feet hip-width, arms overhead, side bends and a slow half-squat. Nothing held.'],
        ['Supported warrior', 0.28, 'Back heel to the wall, front knee bent, one hand on a chair. Two breaths, then change.'],
        ['Seated sit', 0.24, 'Five minutes on a chair, eyes open, attention at the base of the breath.']
      ],
      some: [
        ['Ujjayi breathing', 0.20, 'Six minutes seated, soft sound at the throat, then let the sound go and keep the shape.'],
        ['Standing sequence', 0.34, 'Warrior II, triangle, side angle — held four breaths each, both sides.'],
        ['Seated twist', 0.20, 'Two minutes each side, hand behind, spine tall before it turns.'],
        ['Silent sit', 0.26, 'Fifteen minutes. No counting, no fixing. When you notice you have left, come back.']
      ],
      long: [
        ['Ujjayi breathing', 0.18, 'Ten minutes with a four-count retention. Keep the face soft.'],
        ['Standing sequence', 0.38, 'A full round, both sides, six breaths a posture. Add a balance if the legs are honest.'],
        ['Seated twist', 0.18, 'Three minutes each side, no prop.'],
        ['Silent sit', 0.26, 'Twenty minutes, bell at the start and the end.']
      ]
    },
    release: {
      new: [
        ['Sighing breath', 0.16, 'Inhale through the nose, exhale through the mouth with a sigh. Twelve times.'],
        ['Hip openers on the floor', 0.30, 'Butterfly, then one knee out to the side. Bolsters under both knees.'],
        ['Supported backbend', 0.24, 'A rolled blanket under the shoulder blades, arms open. Three minutes.'],
        ['Long-exhale sit', 0.30, 'Four in, six out, on a chair. Let the out-breath be longer than the in.']
      ],
      some: [
        ['Sighing breath', 0.14, 'Ten sighs, then close the mouth and keep the length.'],
        ['Hip openers on the floor', 0.32, 'Pigeon with a bolster, two minutes each side, no pushing.'],
        ['Supported backbend', 0.22, 'A bolster across the spine, five minutes.'],
        ['Long-exhale sit', 0.32, 'Four in, eight out. Twenty rounds, then sit without counting.']
      ],
      long: [
        ['Sighing breath', 0.12, 'Five sighs to begin, then stillness.'],
        ['Hip openers on the floor', 0.38, 'Long pigeon and a seated straddle, four minutes each, breath-led.'],
        ['Supported backbend', 0.20, 'Seven minutes on the bolster, arms overhead if the shoulders allow.'],
        ['Long-exhale sit', 0.30, 'Four in, eight out, then let the ratio go and watch what remains.']
      ]
    }
  };

  var RATIO = {
    sleep: [4, 2, 6],
    steady: [4, 4, 4],
    release: [4, 1, 8]
  };

  function render() {
    var total = parseInt(mins.value, 10);
    minsOut.textContent = total;
    var list = PRACTICES[state.intent][state.level];
    var running = 0;
    var html = '';
    list.forEach(function (item, i) {
      var dur = i === list.length - 1 ? total - running : Math.max(2, Math.round(item[1] * total));
      running += dur;
      html += '<li><span class="n">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="name">' + item[0] + '</span>' +
        '<span class="dur">' + dur + ' min</span>' +
        '<p>' + item[2] + '</p></li>';
    });
    seqEl.innerHTML = html;
    totalEl.textContent = total;
    countEl.textContent = list.length;
    var r = RATIO[state.intent];
    breathText.textContent = 'Inhale ' + r[0] + ' · hold ' + r[1] + ' · exhale ' + r[2];
    startBreath(r);
  }

  /* precise paced circle: inhale, hold, exhale, rest */
  var raf = null;
  function startBreath(ratio) {
    if (raf) cancelAnimationFrame(raf);
    if (reduce) { dot.style.transform = 'scale(.82)'; return; }
    var inS = ratio[0], holdS = ratio[1], outS = ratio[2];
    var cycle = (inS + holdS + outS) * 1000;
    var start = performance.now();
    function frame(now) {
      var t = (now - start) % cycle;
      var s;
      if (t < inS * 1000) {
        var p = t / (inS * 1000);
        s = 0.62 + 0.38 * (0.5 - 0.5 * Math.cos(Math.PI * p));
      } else if (t < (inS + holdS) * 1000) {
        s = 1;
      } else {
        var q = (t - (inS + holdS) * 1000) / (outS * 1000);
        s = 1 - 0.38 * (0.5 - 0.5 * Math.cos(Math.PI * q));
      }
      dot.style.transform = 'scale(' + s.toFixed(3) + ')';
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }

  doc.querySelectorAll('[data-intent]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.intent = b.getAttribute('data-intent');
      doc.querySelectorAll('[data-intent]').forEach(function (o) { o.classList.toggle('is-on', o === b); });
      render();
    });
  });
  doc.querySelectorAll('[data-level]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.level = b.getAttribute('data-level');
      doc.querySelectorAll('[data-level]').forEach(function (o) { o.classList.toggle('is-on', o === b); });
      render();
    });
  });
  mins.addEventListener('input', render);
  render();
})();
