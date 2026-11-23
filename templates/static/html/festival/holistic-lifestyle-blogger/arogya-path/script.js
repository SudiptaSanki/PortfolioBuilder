/* Arogya Path — interactions. No audio is created on this site. */

(function () {
  'use strict';

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- prakriti check ---------- */
  var form = document.getElementById('prakriti');
  if (form) {
    var NAMES = { v: 'Vata', p: 'Pitta', k: 'Kapha' };
    var RESULT = {
      v: {
        kicker: 'Mostly vata',
        title: 'Vata, with the others behind it',
        body: 'Vata is air and space: dry, light, moving, cold. In practice that can mean a quick mind, dry skin in winter, irregular digestion and sleep that breaks at three. The winter answer is warmth, oil, routine and fewer decisions after dark. Eat cooked food, keep the same meal times for a fortnight, and treat the oil before the bath as the one non-negotiable.'
      },
      p: {
        kicker: 'Mostly pitta',
        title: 'Pitta, with the others behind it',
        body: 'Pitta is fire and water: hot, sharp, intense. It often shows as strong digestion, warm skin, a low tolerance for heat and a short fuse under pressure. Winter is the easy season for this constitution, so the work is not to overdo it: no midday sun, no alcohol as a routine, and a proper pause before the evening meal rather than eating standing up.'
      },
      k: {
        kicker: 'Mostly kapha',
        title: 'Kapha, with the others behind it',
        body: 'Kapha is earth and water: heavy, slow, cool, steady. It can mean a solid frame, deep sleep, slow digestion and a tendency to feel heavy in the damp cold. The winter answer is movement before food, warmth and dryness: ginger, millet, roasted vegetables, and a walk at six even when the bed is warmer. Fewer dairy-heavy dinners.'
      },
      vp: {
        kicker: 'Vata and pitta',
        title: 'Vata–pitta, an uneven pair',
        body: 'Two moving constitutions together: a quick mind, dry skin, strong but irregular digestion, and stress that shows up as both worry and irritation. The routine that suits both is steady rather than extreme: warm cooked food, a fixed bedtime, oil, and no skipped meals. Winter suits you better than summer does.'
      },
      pk: {
        kicker: 'Pitta and kapha',
        title: 'Pitta–kapha, fire under a heavy lid',
        body: 'Strong digestion and a solid frame, with a tendency to run hot then sluggish. The useful winter adjustment is lighter evenings: soup or khichdi instead of a second full meal, and movement after eating rather than a lie-down. Keep the heat in the middle of the day and the food lighter at night.'
      },
      vk: {
        kicker: 'Vata and kapha',
        title: 'Vata–kapha, the two cold ones',
        body: 'Dry and cool at once, with a tendency to stiffen in winter and to sleep long but wake unrefreshed. Warmth, oil and gentle daily movement matter more than any food rule. A fifteen-minute walk before breakfast, sesame oil on the joints, and a hot lunch will do more than a shelf of supplements.'
      },
      even: {
        kicker: 'An even mix',
        title: 'Vata–pitta, with a little kapha',
        body: 'Your answers are close to even, which is common in people who have lived in several cities and change their routine with the weather. Start with the winter routine rather than a dosha-specific one: cooked food, oil before the bath, the main meal at midday, and lights low by half past nine.'
      }
    };

    var bars = { v: document.getElementById('bar-v'), p: document.getElementById('bar-p'), k: document.getElementById('bar-k') };
    var vals = { v: document.getElementById('val-v'), p: document.getElementById('val-p'), k: document.getElementById('val-k') };
    var out = {
      kicker: document.getElementById('result-kicker'),
      title: document.getElementById('result-title'),
      body: document.getElementById('result-body'),
      live: document.getElementById('quiz-live')
    };

    function score() {
      var s = { v: 0, p: 0, k: 0 };
      [1, 2, 3, 4, 5, 6].forEach(function (n) {
        var checked = form.querySelector('input[name="q' + n + '"]:checked');
        if (checked) s[checked.value]++;
      });
      return s;
    }

    function render() {
      var s = score();
      Object.keys(s).forEach(function (key) {
        bars[key].style.width = Math.round((s[key] / 6) * 100) + '%';
        vals[key].textContent = s[key];
      });
      var sorted = Object.keys(s).sort(function (a, b) { return s[b] - s[a]; });
      var key;
      if (s[sorted[0]] - s[sorted[1]] <= 1) {
        var top = sorted.filter(function (k) { return s[k] === s[sorted[0]]; });
        if (s[sorted[0]] === s[sorted[2]]) key = 'even';
        else if (top.length === 2) key = top.slice().sort().join('');
        else key = sorted[0];
      } else {
        key = sorted[0];
      }
      if (!RESULT[key]) key = sorted[0];
      var r = RESULT[key];
      out.kicker.textContent = r.kicker;
      out.title.textContent = r.title;
      out.body.textContent = r.body;
      out.live.textContent = 'Six answers read. ' + NAMES[sorted[0]] + ' is showing most, ' + NAMES[sorted[1]] + ' next.';
    }

    form.addEventListener('change', render);
    var reset = document.getElementById('quiz-reset');
    if (reset) {
      reset.addEventListener('click', function () {
        [1, 2, 3, 4, 5, 6].forEach(function (n) {
          var first = form.querySelector('input[name="q' + n + '"]');
          if (first) first.checked = true;
        });
        render();
        out.live.textContent = 'Reset to the first answer in each question.';
      });
    }
    render();
  }

  /* ---------- letters ---------- */
  var letterForm = document.getElementById('letter-form');
  if (letterForm) {
    var sent = document.getElementById('letter-sent');
    var summary = document.getElementById('letter-summary');
    var mail = document.getElementById('letter-mail');
    var edit = document.getElementById('letter-edit');
    var FIELD = { name: 'l-name', email: 'l-email', text: 'l-text' };

    function note(key, msg) {
      var el = document.getElementById('n-' + key);
      var input = document.getElementById(FIELD[key]);
      if (el) el.textContent = msg || '';
      if (input) {
        if (msg) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      }
    }

    var rules = {
      name: function (v) { return v.trim().length >= 2 ? '' : 'A name to sign it with.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Check the address, so a reply can reach you.'; },
      text: function (v) { return v.trim().length >= 20 ? '' : 'A little more, please. Twenty characters is not yet a letter.'; }
    };

    Object.keys(rules).forEach(function (key) {
      var el = document.getElementById(FIELD[key]);
      el.addEventListener('blur', function () { note(key, rules[key](el.value)); });
      el.addEventListener('input', function () {
        if (el.getAttribute('aria-invalid') === 'true') note(key, rules[key](el.value));
      });
    });

    letterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      Object.keys(rules).forEach(function (key) {
        var el = document.getElementById(FIELD[key]);
        var msg = rules[key](el.value);
        note(key, msg);
        if (msg && !bad) bad = el;
      });
      if (bad) { bad.focus(); return; }

      var name = document.getElementById('l-name').value.trim();
      var email = document.getElementById('l-email').value.trim();
      var kind = document.getElementById('l-kind').value;
      var text = document.getElementById('l-text').value.trim();
      var canPrint = document.getElementById('l-print').checked;

      summary.textContent = name + ', your ' + kind.toLowerCase() + ' is ready to send. ' +
        (canPrint ? 'It is marked as printable, with your first name and city only. ' : 'It will not be printed. ') +
        'Replies take one to two weeks, longer in the fortnight an issue goes out.';

      var body = [
        'Letter to Arogya Path',
        '',
        'Name: ' + name,
        'Email: ' + email,
        'Kind: ' + kind,
        'May be printed: ' + (canPrint ? 'yes, first name and city' : 'no'),
        '',
        text
      ].join('\n');
      mail.href = 'mailto:letters@arogyapath.in?subject=' + encodeURIComponent('Letter — ' + kind) + '&body=' + encodeURIComponent(body);

      letterForm.hidden = true;
      sent.hidden = false;
      sent.focus();
    });

    if (edit) {
      edit.addEventListener('click', function () {
        sent.hidden = true;
        letterForm.hidden = false;
        document.getElementById('l-text').focus();
      });
    }
  }
})();
