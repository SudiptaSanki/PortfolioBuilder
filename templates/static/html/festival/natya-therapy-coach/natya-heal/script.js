/* ============================================================
   Natya Heal — the rasa card. Silent: no audio anywhere.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var drawer = document.getElementById('nav-drawer');
  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      drawer.hidden = open;
      document.body.style.overflow = open ? '' : 'hidden';
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        drawer.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- rasa data ---------- */
  var PLACES = {
    chest: { label: 'the chest', short: 'chest', note: 'Keep the collarbones wide; a collapsed chest turns grief into breath-holding.' },
    throat: { label: 'the base of the throat', short: 'throat', note: 'Let the jaw stay loose. If sound comes, allow it; do not shape it into a word.' },
    shoulders: { label: 'the tops of the shoulders', short: 'shoulders', note: 'Stop before the shoulders drop past their natural rest. Release is not collapse.' },
    belly: { label: 'below the navel', short: 'belly', note: 'Keep the lower ribs soft. Do not brace the belly to make the movement look stronger.' },
    hands: { label: 'the palms', short: 'hands', note: 'Warm the hands first. Cold hands make the gesture look like a task rather than an offering.' },
    feet: { label: 'the soles', short: 'feet', note: 'Work barefoot on a non-slip mat. Do not grip the floor with the toes.' }
  };

  var RASAS = {
    karuna: {
      name: 'Karuna', english: 'grief', sub: 'The rasa of grief, held where most people hold it.', breath: '4 : 6', level: 'seated', id: 'NH—01',
      steps: [
        'Sit on the floor with the spine tall and rest both hands on {place}.',
        'Inhale for four; on the exhale, let the chest sink one centimetre and stay there.',
        'Lift the right hand into alapadma and turn it slowly outward, as if offering something.',
        'Hold the turn for one full breath, then let the hand fall open.',
        'Finish with six rounds of 4:6 breathing and sit for one minute without moving.'
      ],
      note: 'Do not ask the person to name the loss. The gesture is doing the naming. Stop at the first sign of numbness in the hands.'
    },
    shringara: {
      name: 'Shringara', english: 'longing', sub: 'The rasa of longing and delight, which the body often hides first.', breath: '4 : 8', level: 'standing', id: 'NH—02',
      steps: [
        'Stand with the feet hip-width apart and bring both hands to {place}.',
        'Inhale for four and draw the elbows back without lifting the shoulders.',
        'Open the arms into a slow varnam arc, leading with the little finger, eyes following the right hand.',
        'On the exhale, return the hands to {place} more slowly than you opened them.',
        'Repeat four times, then stand still for five breaths with the arms at the sides.'
      ],
      note: 'Longing can arrive as tears without sadness. That is ordinary; keep the breath longer on the out-breath and continue only if the person wants to.'
    },
    hasya: {
      name: 'Hasya', english: 'release', sub: 'The rasa of laughter, used to discharge what has been held too tightly.', breath: '3 : 3', level: 'seated or standing', id: 'NH—03',
      steps: [
        'Sit or stand and tap {place} lightly with the fingertips, eight times, without speaking.',
        'Begin a small, forced “ha” on each exhale; do not wait for it to be genuine.',
        'Let the sound grow into a shoulder shake for ten seconds, then stop completely.',
        'Sit in the silence that follows and notice where the body has softened.',
        'Repeat three rounds, with a full minute of stillness before the last one.'
      ],
      note: 'Never ask someone to laugh at their own distress. If the laughter turns to crying, stop the tapping and stay with the breath.'
    },
    raudra: {
      name: 'Raudra', english: 'anger', sub: 'The rasa of anger, worked through the arms rather than the voice.', breath: '5 : 5', level: 'standing', id: 'NH—04',
      steps: [
        'Stand with the knees soft, hands in fists at {place}.',
        'Inhale for five and lift the arms to shoulder height, palms facing out.',
        'Exhale for five and push the palms away as if against a wall that is not there.',
        'Hold the push for three breaths, then shake the hands out loosely for ten seconds.',
        'Close with the palms over {place} and eight slow breaths.'
      ],
      note: 'Anger work is contraindicated with recent cardiac events or uncontrolled hypertension. Keep the jaw unclenched and the voice off.'
    },
    veera: {
      name: 'Veera', english: 'courage', sub: 'The rasa of courage, built from the ground upward, not from the chin.', breath: '4 : 4', level: 'standing', id: 'NH—05',
      steps: [
        'Stand with the feet wide and press the soles down; bring the hands to {place}.',
        'Inhale for four, lengthening the spine from the tailbone.',
        'Exhale for four and extend the right arm forward at eye level, fingers together, as in virabhadra.',
        'Hold for two breaths, return, and repeat on the left.',
        'Finish with the feet together and six breaths, arms hanging heavy.'
      ],
      note: 'Courage work attracts people who are already over-functioning. Watch for breath-holding and remind them that effort is not the same as strain.'
    },
    bhayanaka: {
      name: 'Bhayanaka', english: 'fear', sub: 'The rasa of fear, entered in small doses and always with an exit.', breath: '4 : 7', level: 'seated', id: 'NH—06',
      steps: [
        'Sit with the back supported and both feet flat; place the hands on {place}.',
        'Name one small, specific fear out loud — not the largest one.',
        'Inhale for four, exhale for seven, and let the eyes move slowly to the left and right.',
        'Make the smallest possible gesture of pushing away with the right palm, then release it.',
        'Return the hands to {place} and take five natural breaths, no counting.'
      ],
      note: 'Stop if the person dissociates, goes pale, or loses track of the room. Orient them to three objects and do not continue that day.'
    },
    bibhatsa: {
      name: 'Bibhatsa', english: 'revulsion', sub: 'The rasa of revulsion, which is often shame wearing a plainer coat.', breath: '4 : 6', level: 'seated', id: 'NH—07',
      steps: [
        'Sit comfortably and rest the hands on {place}.',
        'Bring to mind something mildly distasteful — a smell, a texture — not a memory of harm.',
        'Inhale for four; exhale for six and turn both palms downward, as if setting something aside.',
        'Hold the downward palms for three breaths, noticing the urge to recoil.',
        'Release the hands and wash them slowly, dry, in the air, for ten seconds.'
      ],
      note: 'Do not use this rasa with shame tied to abuse or the body. That work belongs with a trained therapist, and I will say so in the first session.'
    },
    adbhuta: {
      name: 'Adbhuta', english: 'wonder', sub: 'The rasa of wonder, the easiest door for people who distrust feeling.', breath: '4 : 8', level: 'standing', id: 'NH—08',
      steps: [
        'Stand at a window if there is one, hands resting at {place}.',
        'Inhale for four and look at one ordinary thing as if you had not seen it before.',
        'Exhale for eight and raise both hands slowly to frame that thing, thumbs at eyebrow height.',
        'Hold the frame for two breaths without naming what you see.',
        'Lower the hands, close the eyes, and take four breaths with the attention on the space between the eyebrows.'
      ],
      note: 'Wonder is not positivity. If the person reports numbness, stay with sensation — temperature, weight, texture — before returning to the frame.'
    },
    shanta: {
      name: 'Shanta', english: 'stillness', sub: 'The rasa of stillness, which is not the absence of feeling.', breath: '4 : 8', level: 'seated', id: 'NH—09',
      steps: [
        'Sit with the hands resting on {place} and the eyes closed or lowered.',
        'Inhale for four, exhale for eight, without forcing the count.',
        'Let the hands make one slow, open gesture outward, then return.',
        'Sit for one minute with no instruction at all.',
        'Close by pressing the palms together at the sternum and bowing once.'
      ],
      note: 'Stillness can be frightening for people with trauma histories. Offer the eyes-open version and keep the door visible.'
    }
  };

  var state = { rasa: 'shanta', place: 'chest', len: 25 };
  var cardTitle = document.getElementById('protocol-title');
  var cardSub = document.getElementById('protocol-sub');
  var cardId = document.getElementById('protocol-id');
  var cardBreath = document.getElementById('protocol-breath');
  var cardTime = document.getElementById('protocol-time');
  var cardLevel = document.getElementById('protocol-level');
  var cardSteps = document.getElementById('protocol-steps');
  var cardNote = document.getElementById('protocol-note');

  function paintCard() {
    var r = RASAS[state.rasa];
    var p = PLACES[state.place];
    if (!cardTitle) return;
    cardTitle.textContent = r.name + ' at ' + p.label;
    cardSub.textContent = r.sub;
    cardId.textContent = r.id;
    cardBreath.textContent = r.breath;
    cardTime.textContent = state.len + ' min';
    cardLevel.textContent = r.level;
    cardSteps.innerHTML = '';
    r.steps.forEach(function (s) {
      var li = document.createElement('li');
      li.textContent = s.replace('{place}', p.label);
      cardSteps.appendChild(li);
    });
    cardNote.textContent = r.note + ' ' + p.note;
  }

  var rasaBtns = Array.prototype.slice.call(document.querySelectorAll('.rasa'));
  rasaBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.rasa = btn.getAttribute('data-rasa');
      rasaBtns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      paintCard();
    });
  });

  var placeBtns = Array.prototype.slice.call(document.querySelectorAll('.place'));
  placeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.place = btn.getAttribute('data-place');
      placeBtns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-set', on);
        b.setAttribute('aria-pressed', String(on));
      });
      paintCard();
    });
  });

  var lenBtns = Array.prototype.slice.call(document.querySelectorAll('.len'));
  lenBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.len = Number(btn.getAttribute('data-len'));
      lenBtns.forEach(function (b) { b.classList.toggle('is-set', b === btn); });
      paintCard();
    });
  });

  paintCard();

  /* ---------- casebook filter ---------- */
  var filterBtns = Array.prototype.slice.call(document.querySelectorAll('.chip[data-filter]'));
  var cases = Array.prototype.slice.call(document.querySelectorAll('.case'));
  if (filterBtns.length && cases.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var kind = btn.getAttribute('data-filter');
        filterBtns.forEach(function (b) { b.classList.toggle('is-set', b === btn); });
        cases.forEach(function (c) { c.hidden = kind !== 'all' && c.getAttribute('data-type') !== kind; });
      });
    });
  }

  /* ---------- referral form ---------- */
  var form = document.getElementById('referral-form');
  var sent = document.getElementById('sent');
  var sentDetail = document.getElementById('sent-detail');

  function setError(id, message) {
    var err = document.querySelector('.err[data-for="' + id + '"]');
    var input = document.getElementById(id);
    if (err) err.textContent = message || '';
    if (input) {
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      var field = input.closest('.field');
      if (field) field.classList.toggle('has-error', Boolean(message));
    }
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  if (form) {
    ['n-name', 'n-email', 'n-date', 'n-type', 'n-note'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var clear = function () { if (el.getAttribute('aria-invalid') === 'true') setError(id, ''); };
      el.addEventListener('input', clear);
      el.addEventListener('change', clear);
    });
    var agree = document.getElementById('n-agree');
    if (agree) agree.addEventListener('change', function () {
      var err = document.querySelector('.err[data-for="n-agree"]');
      if (err && agree.checked) err.textContent = '';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('n-name');
      var email = document.getElementById('n-email');
      var date = document.getElementById('n-date');
      var type = document.getElementById('n-type');
      var note = document.getElementById('n-note');
      var problems = [];
      ['n-name', 'n-email', 'n-date', 'n-type', 'n-note'].forEach(function (id) { setError(id, ''); });
      var agreeErr = document.querySelector('.err[data-for="n-agree"]');
      if (agreeErr) agreeErr.textContent = '';

      if (!name.value.trim()) { setError('n-name', 'A name, or an initial if you prefer.'); problems.push(name); }
      if (!email.value.trim()) { setError('n-email', 'I need an address to reply to.'); problems.push(email); }
      else if (!validEmail(email.value.trim())) { setError('n-email', 'That address looks incomplete.'); problems.push(email); }
      if (!date.value) { setError('n-date', 'A rough date is enough.'); problems.push(date); }
      else {
        var d = new Date(date.value + 'T12:00:00');
        var today = new Date(); today.setHours(0, 0, 0, 0);
        if (isNaN(d.getTime())) { setError('n-date', 'That date cannot be read.'); problems.push(date); }
        else if (d < today) { setError('n-date', 'Please choose a future date.'); problems.push(date); }
      }
      if (!type.value) { setError('n-type', 'Tell me who the sessions are for.'); problems.push(type); }
      if (note.value.trim().length < 12) { setError('n-note', 'A few words about the situation, without identifying details.'); problems.push(note); }
      if (!agree.checked) { if (agreeErr) agreeErr.textContent = 'Please confirm you have read the note.'; problems.push(agree); }

      if (problems.length) { problems[0].focus(); return; }

      var chosen = type.options[type.selectedIndex].textContent;
      var readable = new Date(date.value + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      if (sentDetail) {
        sentDetail.textContent = 'Thank you, ' + name.value.trim().split(' ')[0] + '. Your note about ' + chosen + ' starting around ' + readable + ' has reached Sharada. She replies to ' + email.value.trim() + ' within two working days, usually sooner.';
      }
      form.hidden = true;
      if (sent) { sent.hidden = false; sent.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); }
    });
  }
})();
