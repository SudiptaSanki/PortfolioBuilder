/* Chandana Vaidya Sala — interactions
   Rituchakra wheel, prakriti reading, navigation, contact form. No storage, no network calls. */

(function () {
  'use strict';

  /* ---------------- navigation ---------------- */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  /* ---------------- seasons ---------------- */
  var SEASONS = [
    {
      id: 'grishma', name: 'Grishma', en: 'summer', months: 'Edavam – Mithunam', span: 'mid-May to mid-July',
      dosha: 'Vata', color: '#a1752f', monthsNum: [5, 6],
      note: 'Heat pulls water out of the body and vata rises with it: dry skin, light sleep, a short temper at noon. Keep salt and sour tastes, drink warm water rather than iced, and move the long walk to before seven.'
    },
    {
      id: 'varsha', name: 'Varsha', en: 'monsoon', months: 'Karkidakam – Chingam', span: 'mid-July to mid-September',
      dosha: 'Vata', color: '#4a6650', monthsNum: [7, 8],
      note: 'The rains soften the ground and the digestion together. This is the month of Karkidaka chikitsa: warm, light, cooked food; no curd at night; oil on the skin before the bath. Old joint pain usually speaks up now.'
    },
    {
      id: 'sarat', name: 'Sarat', en: 'autumn', months: 'Kanni – Thulam', span: 'mid-September to mid-November',
      dosha: 'Pitta', color: '#9a4a24', monthsNum: [9, 10],
      note: 'Pitta, held back through the rains, comes out with the sun. Acidity, skin eruptions and early waking arrive together. Cool and sweet tastes, ghee, coconut, fewer chillies, and no work arguments after nine at night.'
    },
    {
      id: 'hemanta', name: 'Hemanta', en: 'early winter', months: 'Vrischikam – Dhanu', span: 'mid-November to mid-January',
      dosha: 'Kapha', color: '#7a713f', monthsNum: [11, 12],
      note: 'The strongest digestion of the year and the strongest appetite. Kapha gathers quietly: heaviness in the morning, a slow start, a cold that lingers. Eat well at midday, keep supper early and light, and do not sleep through the morning light.'
    },
    {
      id: 'sisira', name: 'Sisira', en: 'late winter', months: 'Makaram – Kumbham', span: 'mid-January to mid-March',
      dosha: 'Kapha', color: '#4d6b75', monthsNum: [1, 2],
      note: 'Cold and dry outside, kapha still thick inside. Warm oil massage, dry ginger with honey in the morning, and stronger exercise than the rest of the year. This is the window for rasayana courses and for building strength.'
    },
    {
      id: 'vasanta', name: 'Vasanta', en: 'spring', months: 'Meenam – Medam', span: 'mid-March to mid-May',
      dosha: 'Kapha', color: '#76874a', monthsNum: [3, 4],
      note: 'Kapha liquefies with the first heat. Sinus, allergies and sluggish mornings belong to this month. Bitter and astringent tastes, lighter meals, and a short fast once a week if you are used to it — not otherwise.'
    }
  ];

  function currentSeason() {
    var m = new Date().getMonth() + 1;
    for (var i = 0; i < SEASONS.length; i++) {
      if (SEASONS[i].monthsNum.indexOf(m) !== -1) return SEASONS[i];
    }
    return SEASONS[1];
  }

  function polar(cx, cy, r, deg) {
    var rad = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  function arcPath(cx, cy, rOuter, rInner, start, end) {
    var p1 = polar(cx, cy, rOuter, start);
    var p2 = polar(cx, cy, rOuter, end);
    var p3 = polar(cx, cy, rInner, end);
    var p4 = polar(cx, cy, rInner, start);
    var large = end - start <= 180 ? 0 : 1;
    return 'M' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2) +
      'A' + rOuter + ' ' + rOuter + ' 0 ' + large + ' 1 ' + p2[0].toFixed(2) + ' ' + p2[1].toFixed(2) +
      'L' + p3[0].toFixed(2) + ' ' + p3[1].toFixed(2) +
      'A' + rInner + ' ' + rInner + ' 0 ' + large + ' 0 ' + p4[0].toFixed(2) + ' ' + p4[1].toFixed(2) + 'Z';
  }

  var wheelEl = document.getElementById('wheel');
  var legendEl = document.getElementById('wheelLegend');
  var noteEl = document.getElementById('wheelNote');
  var wheelArcs = {};
  var selectedSeason = currentSeason();

  function seasonNote(s) {
    return '<span class="season-line">' + s.name + ' · ' + s.en + ' — ' + s.months + '</span>' +
      '<span><strong>' + s.dosha + '</strong> is the dosha of the season. ' + s.note + '</span>';
  }

  function buildWheel() {
    if (!wheelEl) return;
    var cx = 260, cy = 260, rOut = 232, rIn = 168;
    var svg = '<svg viewBox="0 0 520 520" role="presentation">';
    svg += '<circle cx="260" cy="260" r="246" fill="none" stroke="#cfc3a8" stroke-width="1"/>';
    svg += '<circle cx="260" cy="260" r="160" fill="none" stroke="#ded3ba" stroke-width="1"/>';

    // month ticks
    for (var t = 0; t < 60; t++) {
      var a = t * 6;
      var big = t % 5 === 0;
      var p1 = polar(cx, cy, 232, a);
      var p2 = polar(cx, cy, big ? 242 : 237, a);
      svg += '<line class="wheel-tick" x1="' + p1[0].toFixed(1) + '" y1="' + p1[1].toFixed(1) +
        '" x2="' + p2[0].toFixed(1) + '" y2="' + p2[1].toFixed(1) + '"' + (big ? '' : ' opacity=".5"') + '/>';
    }

    SEASONS.forEach(function (s, i) {
      var start = i * 60 + 1.2;
      var end = (i + 1) * 60 - 1.2;
      svg += '<path class="wheel-arc" data-season="' + s.id + '" d="' + arcPath(cx, cy, rOut, rIn, start, end) +
        '" fill="' + s.color + '" stroke="#f2ebdd" stroke-width="1"/>';

      var mid = i * 60 + 30;
      var lp = polar(cx, cy, (rOut + rIn) / 2, mid);
      svg += '<text x="' + lp[0].toFixed(1) + '" y="' + (lp[1] + 4).toFixed(1) +
        '" text-anchor="middle" class="wheel-season" font-family="Karla, sans-serif" font-size="12" letter-spacing=".04em" fill="#f6f0e2" opacity=".92">' +
        s.name + '</text>';

      var ap = polar(cx, cy, rOut + 10, mid);
      svg += '<text x="' + ap[0].toFixed(1) + '" y="' + (ap[1] + 3).toFixed(1) +
        '" text-anchor="middle" class="wheel-dosha" font-family="Karla, sans-serif" font-size="9.5" letter-spacing=".06em" fill="#8d8d7a">' +
        s.dosha + '</text>';
    });

    svg += '<text class="wheel-centre" x="260" y="246" text-anchor="middle" font-size="27" fill="#22231b">Rituchakra</text>';
    svg += '<text class="wheel-sub" x="260" y="268" text-anchor="middle" fill="#6b6c5c" font-size="11.5" letter-spacing=".04em">six seasons of the Malayalam year</text>';
    svg += '<text class="wheel-sub" x="260" y="292" text-anchor="middle" fill="#96431f" font-size="10.5" letter-spacing=".05em">THRISSUR · 10.5°N</text>';
    svg += '</svg>';
    wheelEl.innerHTML = svg;

    wheelEl.querySelectorAll('.wheel-arc').forEach(function (el) {
      wheelArcs[el.getAttribute('data-season')] = el;
      el.addEventListener('click', function () { selectSeason(el.getAttribute('data-season')); });
    });

    if (legendEl) {
      legendEl.innerHTML = SEASONS.map(function (s) {
        return '<li><button type="button" data-season="' + s.id + '" aria-pressed="false">' +
          '<span class="dot" style="background:' + s.color + '"></span>' +
          '<span><span class="lg-name">' + s.name + '</span>' +
          '<span class="lg-months">' + s.months + '</span></span></button></li>';
      }).join('');
      legendEl.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () { selectSeason(b.getAttribute('data-season')); });
      });
    }
  }

  function selectSeason(id) {
    var s = null;
    for (var i = 0; i < SEASONS.length; i++) if (SEASONS[i].id === id) s = SEASONS[i];
    if (!s) return;
    selectedSeason = s;
    Object.keys(wheelArcs).forEach(function (k) {
      wheelArcs[k].classList.toggle('is-dim', k !== id);
    });
    if (legendEl) {
      legendEl.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-season') === id ? 'true' : 'false');
      });
    }
    if (noteEl) noteEl.innerHTML = seasonNote(s);
  }

  buildWheel();
  if (wheelEl) selectSeason(currentSeason().id);

  /* ---------------- prakriti reading ---------------- */
  var DOSHAS = {
    v: { key: 'v', name: 'Vata', color: '#6c7f5b' },
    p: { key: 'p', name: 'Pitta', color: '#b1842a' },
    k: { key: 'k', name: 'Kapha', color: '#4c6b74' }
  };

  var QUESTIONS = [
    { t: 'Build and frame', o: [
      { d: 'v', s: 'Light frame, joints that show, weight that does not stay' },
      { d: 'p', s: 'Medium build, steady weight, warm to the touch' },
      { d: 'k', s: 'Solid frame, broad shoulders, weight that arrives easily' }] },
    { t: 'Skin', o: [
      { d: 'v', s: 'Dry, cool, thin; fine lines arrive early' },
      { d: 'p', s: 'Warm, sensitive, flushes easily, freckles or moles' },
      { d: 'k', s: 'Thick, cool, smooth, slow to burn or blush' }] },
    { t: 'Hair', o: [
      { d: 'v', s: 'Dry and coarse, splits at the ends' },
      { d: 'p', s: 'Fine and soft, greys or thins early' },
      { d: 'k', s: 'Thick and heavy, oils quickly at the scalp' }] },
    { t: 'Appetite', o: [
      { d: 'v', s: 'Irregular — forgets a meal, then feels empty and shaky' },
      { d: 'p', s: 'Strong and sharp; irritable if a meal is late' },
      { d: 'k', s: 'Steady but light; can skip a meal comfortably' }] },
    { t: 'Digestion', o: [
      { d: 'v', s: 'Gas and bloating, variable from day to day' },
      { d: 'p', s: 'Fast and loose, sometimes sour or burning' },
      { d: 'k', s: 'Slow and heavy, sleepy after eating' }] },
    { t: 'Sleep', o: [
      { d: 'v', s: 'Light; wakes between two and four with a busy mind' },
      { d: 'p', s: 'Moderate; wakes hot or with a plan already forming' },
      { d: 'k', s: 'Deep and long, slow to rise, slow to start' }] },
    { t: 'Speech', o: [
      { d: 'v', s: 'Quick and talkative, jumps between subjects' },
      { d: 'p', s: 'Precise and direct, argues a point well' },
      { d: 'k', s: 'Slow, measured, few words and a long pause' }] },
    { t: 'Under pressure', o: [
      { d: 'v', s: 'Anxious and scattered, thoughts at double speed' },
      { d: 'p', s: 'Irritable and critical, sharp at the nearest person' },
      { d: 'k', s: 'Withdrawn and heavy, slow to move or answer' }] },
    { t: 'Temperature', o: [
      { d: 'v', s: 'Feels the cold; hands and feet stay cold' },
      { d: 'p', s: 'Runs hot, dislikes heat and humidity' },
      { d: 'k', s: 'Comfortable in cool weather, dislikes damp cold' }] },
    { t: 'Sweat', o: [
      { d: 'v', s: 'Scant, even in heat; skin stays dry' },
      { d: 'p', s: 'Profuse and strong-smelling, even in mild heat' },
      { d: 'k', s: 'Moderate and mild, mostly in humidity' }] },
    { t: 'Movement', o: [
      { d: 'v', s: 'Fast, restless, light on the feet' },
      { d: 'p', s: 'Brisk and purposeful, competitive in a crowd' },
      { d: 'k', s: 'Calm, slow, steady, hard to hurry' }] },
    { t: 'Memory', o: [
      { d: 'v', s: 'Learns fast, forgets fast, remembers the shape of things' },
      { d: 'p', s: 'Sharp and precise, remembers the exact words' },
      { d: 'k', s: 'Slow to learn, then never forgets' }] }
  ];

  var NOTES = {
    v: {
      weak: 'Sleep thins first, then digestion. Dry skin, cold hands, a mind that will not stop at two in the morning. Constipation and cracking joints follow a run of irregular meals.',
      anchor: 'One warm cooked meal at a fixed hour, oil on the skin before the bath, and feet covered after dark. Screens off by ten; the body reads a late night as a threat for the next two days.',
      food: 'Warm, soft, slightly oily: rice with ghee, cooked vegetables, dal, sesame oil, warm milk at night. Not for you: cold water with meals, dry snacks, long gaps between eating, late coffee.',
      tell: 'When was the last time you ate, slept and moved at the same hour for two weeks? Bring that answer, not a symptom list.'
    },
    p: {
      weak: 'Heat shows first: acidity, loose stools, a rash or a flush across the chest. Irritability builds through the day and sleep breaks after midnight. Skin reacts to a string of hot, sour, salty meals.',
      anchor: 'Cool and mildly sweet food, meals at fixed hours, and the hottest part of the day spent indoors. One unhurried meal without a screen does more for pitta than any pill.',
      food: 'Ghee, coconut, rice, cucumber, coriander, pomegranate, sweet fruit, room-temperature water. Not for you: chilli on everything, vinegar, tomatoes at night, fried snacks, alcohol on an empty stomach.',
      tell: 'Notice whether the complaint is worse after heat, after conflict, or after a late night — pitta usually answers one of the three.'
    },
    k: {
      weak: 'Heaviness first: slow mornings, a cold that settles in the chest, congestion, weight that joins quietly. Digestion is slow and a heavy supper sits until noon. Energy arrives late and leaves late.',
      anchor: 'Up before six thirty, dry massage with a rough cloth, and the main meal at midday. Supper by seven and lighter than lunch. Day sleep is not a rest for kapha; it is a deposit.',
      food: 'Warm, light and dry: millet, barley, ginger, black pepper, honey, steamed greens, lentil soups. Not for you: curd at night, cold milk, fried food, sweets after a heavy meal, deep sleep through the morning.',
      tell: 'Bring the hours you keep, not only the symptoms. Kapha complaints almost always sit on a slow morning and a late supper.'
    }
  };

  var DUO = {
    v: 'Vata', p: 'Pitta', k: 'Kapha'
  };

  var toolEl = document.getElementById('prakritiTool');
  if (toolEl) {
    var qText = document.getElementById('qText');
    var qCount = document.getElementById('qCount');
    var optList = document.getElementById('optList');
    var nextBtn = document.getElementById('nextBtn');
    var backBtn = document.getElementById('backBtn');
    var qHint = document.getElementById('qHint');
    var progress = document.getElementById('toolProgress');
    var bar = document.getElementById('toolBar');
    var quizArea = document.getElementById('quizArea');
    var resultEl = document.getElementById('result');
    var legV = document.getElementById('legVata');
    var legP = document.getElementById('legPitta');
    var legK = document.getElementById('legKapha');

    var answers = new Array(QUESTIONS.length).fill(null);
    var index = 0;

    function counts() {
      var c = { v: 0, p: 0, k: 0 };
      answers.forEach(function (a) { if (a) c[a]++; });
      return c;
    }

    function answeredCount() {
      return answers.filter(Boolean).length;
    }

    function refreshLegend() {
      var c = counts();
      var total = Math.max(1, answeredCount());
      var pct = function (n) { return Math.round((n / total) * 100); };
      legV.textContent = (answeredCount() ? pct(c.v) : 0) + '%';
      legP.textContent = (answeredCount() ? pct(c.p) : 0) + '%';
      legK.textContent = (answeredCount() ? pct(c.k) : 0) + '%';
      bar.style.width = Math.round((answeredCount() / QUESTIONS.length) * 100) + '%';
      progress.textContent = 'Answered ' + answeredCount() + ' of ' + QUESTIONS.length;
    }

    function renderQuestion() {
      var q = QUESTIONS[index];
      qCount.textContent = 'Triad ' + (index + 1) + ' of ' + QUESTIONS.length;
      qText.textContent = q.t;
      var chosen = answers[index];
      optList.innerHTML = q.o.map(function (o, i) {
        var id = 'q' + index + 'o' + i;
        return '<li class="opt"><input type="radio" name="q' + index + '" id="' + id + '" value="' + o.d + '"' +
          (chosen === o.d ? ' checked' : '') + '>' +
          '<label for="' + id + '"><span class="key" aria-hidden="true">' + 'ABC'.charAt(i) + '</span><span>' + o.s + '</span></label></li>';
      }).join('');
      optList.querySelectorAll('input').forEach(function (input) {
        input.addEventListener('change', function () {
          answers[index] = input.value;
          nextBtn.disabled = false;
          qHint.textContent = 'Chosen';
          refreshLegend();
          nextBtn.focus();
        });
      });
      backBtn.disabled = index === 0;
      nextBtn.disabled = !chosen;
      nextBtn.textContent = index === QUESTIONS.length - 1 ? 'See reading' : 'Next';
      qHint.textContent = chosen ? 'Chosen' : 'Choose one statement';
      refreshLegend();
    }

    function result() {
      var c = counts();
      var total = Math.max(1, c.v + c.p + c.k);
      var pct = { v: Math.round(c.v / total * 100), p: Math.round(c.p / total * 100), k: Math.round(c.k / total * 100) };
      var order = ['v', 'p', 'k'].sort(function (a, b) { return c[b] - c[a]; });
      var first = order[0], second = order[1];
      var dual = c[first] - c[second] <= 1 && c[second] > 0;

      var name = DOSHAS[first].name + (dual ? '–' + DOSHAS[second].name : '');
      var sub = dual ? 'two tendencies close together' : DOSHAS[first].name.toLowerCase() + ' leading';
      document.getElementById('resName').textContent = name;
      var s = currentSeason();
      document.getElementById('resSeason').textContent = 'Now: ' + s.name + ' · ' + s.dosha + ' season';

      document.getElementById('resBars').innerHTML = ['v', 'p', 'k'].map(function (k) {
        return '<li><span class="b-name">' + DOSHAS[k].name + '</span>' +
          '<span class="b-track"><span class="b-fill" style="background:' + DOSHAS[k].color + ';width:' + pct[k] + '%"></span></span>' +
          '<span class="b-val">' + pct[k] + '%</span></li>';
      }).join('');

      var n = NOTES[first];
      document.getElementById('resWeak').textContent = n.weak;
      var anchor = n.anchor;
      if (dual) anchor += ' ' + NOTES[second].anchor.split('.')[0] + '.';
      document.getElementById('resAnchor').textContent = anchor;
      document.getElementById('resFood').textContent = n.food;
      document.getElementById('resTell').textContent = n.tell;

      quizArea.style.display = 'none';
      resultEl.classList.add('is-on');
      progress.textContent = 'Reading complete';
      bar.style.width = '100%';
      resultEl.querySelector('#restartBtn').focus();
    }

    nextBtn.addEventListener('click', function () {
      if (!answers[index]) return;
      if (index === QUESTIONS.length - 1) { result(); return; }
      index += 1;
      renderQuestion();
      var firstInput = optList.querySelector('input');
      if (firstInput) firstInput.focus();
    });

    backBtn.addEventListener('click', function () {
      if (index === 0) return;
      index -= 1;
      renderQuestion();
    });

    document.getElementById('restartBtn').addEventListener('click', function () {
      answers = new Array(QUESTIONS.length).fill(null);
      index = 0;
      resultEl.classList.remove('is-on');
      quizArea.style.display = '';
      renderQuestion();
      var firstInput = optList.querySelector('input');
      if (firstInput) firstInput.focus();
    });

    renderQuestion();
  }

  /* ---------------- ashtanga diagram (about) ---------------- */
  var spokes = document.querySelectorAll('.spoke');
  if (spokes.length) {
    var LIMBS = [
      { n: 'Kayachikitsa', d: 'Internal medicine. The largest limb, and the one this sala practises: fever, digestion, metabolism, skin, joints and the long complaints that do not fit a single organ.' },
      { n: 'Shalya', d: 'Surgery and the removal of foreign bodies, including the sharp instruments and cautery described in the Sushruta Samhita. Referred out; we do not operate.' },
      { n: 'Shalakya', d: 'Above the collarbone: eyes, ears, nose, throat and mouth. Netra tarpana and nasya are done here under an ophthalmologist\'s clearance.' },
      { n: 'Kaumarabhritya', d: 'Care of the infant, the child and the mother after birth. We take children above two years, with the paediatrician kept informed.' },
      { n: 'Agadatantra', d: 'Toxicology — bites, stings and poisoning. Not practised here; go straight to a hospital.' },
      { n: 'Rasayana', d: 'Rejuvenation and the rebuilding of strength after illness. Given as a course, in the late winter window, never alongside a purge.' },
      { n: 'Vajikarana', d: 'Reproductive health and vitality. Consulted privately, and only with both partners\' consent where a couple is involved.' },
      { n: 'Bhutavidya', d: 'The old term for mental disturbance and its care. Today: sleep, anxiety and grief, worked alongside a psychiatrist rather than instead of one.' }
    ];
    var limbNote = document.getElementById('limbNote');
    function setLimb(i) {
      spokes.forEach(function (sp, j) { sp.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      if (limbNote) {
        limbNote.innerHTML = '<p class="limb-no">Limb ' + (i + 1) + ' of 8</p><h3>' + LIMBS[i].n + '</h3><p>' + LIMBS[i].d + '</p>';
      }
    }
    spokes.forEach(function (sp, i) {
      sp.addEventListener('click', function () { setLimb(i); });
      sp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLimb(i); }
      });
    });
    setLimb(0);
  }

  /* ---------------- contact form ---------------- */
  var form = document.getElementById('contactForm');
  if (form) {
    var status = document.getElementById('formStatus');
    var setErr = function (id, on) {
      var field = document.getElementById(id).closest('.field');
      if (field) field.classList.toggle('has-err', on);
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('f-name');
      var email = document.getElementById('f-email');
      var phone = document.getElementById('f-phone');
      var reason = document.getElementById('f-reason');
      var consent = document.getElementById('f-consent');
      var bad = [];

      var okName = name.value.trim().length >= 2;
      var okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
      var okPhone = /^[0-9+\s()-]{7,18}$/.test(phone.value.trim());
      var okReason = reason.value !== '';
      var okConsent = consent.checked;

      setErr('f-name', !okName); if (!okName) bad.push('name');
      setErr('f-email', !okEmail); if (!okEmail) bad.push('email');
      setErr('f-phone', !okPhone); if (!okPhone) bad.push('phone');
      setErr('f-reason', !okReason); if (!okReason) bad.push('reason');
      setErr('f-consent', !okConsent); if (!okConsent) bad.push('consent');

      if (bad.length) {
        status.textContent = 'Please check the highlighted fields.';
        status.className = 'form-status bad';
        var first = form.querySelector('.has-err input, .has-err select');
        if (first) first.focus();
        return;
      }
      status.textContent = 'Thank you, ' + name.value.trim().split(' ')[0] + '. The desk will call within one working day to fix a time.';
      status.className = 'form-status ok';
      form.reset();
      form.querySelectorAll('.has-err').forEach(function (f) { f.classList.remove('has-err'); });
    });
    form.addEventListener('input', function (e) {
      var field = e.target.closest('.field');
      if (field) field.classList.remove('has-err');
    });
  }
})();
