/* Mei Tan — zodiac parade.
   The sixty-year cycle, twelve line glyphs, and a poster that redraws for the chosen year. Silent. */

(function () {
  'use strict';

  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      toggle.setAttribute('aria-expanded', nav.classList.toggle('is-open') ? 'true' : 'false');
    });
  }

  /* ---------- the twelve ---------- */
  var ANIMALS = [
    { name: 'Rat', branch: '子', char: '鼠', trine: 'Dragon, Monkey', friend: 'Ox',
      p: ['M26 64 C26 48 38 40 52 40 C68 40 78 50 78 64 C78 78 66 86 52 86 C38 86 26 78 26 64Z',
          'M62 40 C66 30 76 30 78 38 C80 46 72 50 66 46', 'M26 72 C14 72 10 58 18 50'],
      c: [[44, 56, 1.8]] },
    { name: 'Ox', branch: '丑', char: '牛', trine: 'Snake, Rooster', friend: 'Rat',
      p: ['M30 38 C24 24 34 14 44 22', 'M70 38 C76 24 66 14 56 22',
          'M34 34 C34 24 42 18 50 18 C58 18 66 24 66 34 L66 54 C66 68 58 76 50 76 C42 76 34 68 34 54 Z',
          'M42 66 h16'],
      c: [[43, 42, 1.7], [57, 42, 1.7], [46, 70, 1.2], [54, 70, 1.2]] },
    { name: 'Tiger', branch: '寅', char: '虎', trine: 'Horse, Dog', friend: 'Pig',
      p: ['M50 26 C66 26 78 38 78 54 C78 70 66 82 50 82 C34 82 22 70 22 54 C22 38 34 26 50 26Z',
          'M30 32 L24 16 L40 22', 'M70 32 L76 16 L60 22',
          'M50 22 v11', 'M33 45 l11 4', 'M67 45 l-11 4', 'M32 61 l11 -3', 'M68 61 l-11 -3'],
      c: [[43, 52, 1.9], [57, 52, 1.9]] },
    { name: 'Rabbit', branch: '卯', char: '兔', trine: 'Goat, Pig', friend: 'Dog',
      p: ['M42 36 C36 20 40 8 46 10 C52 12 48 26 48 36',
          'M58 36 C64 20 60 8 54 10 C48 12 52 26 52 36',
          'M50 34 C62 34 70 44 70 54 C70 66 61 74 50 74 C39 74 30 66 30 54 C30 44 38 34 50 34Z',
          'M34 66 C30 78 36 88 50 88 C64 88 70 78 66 66'],
      c: [[44, 52, 1.7], [56, 52, 1.7], [50, 60, 1.3]] },
    { name: 'Dragon', branch: '辰', char: '龍', trine: 'Rat, Monkey', friend: 'Rooster',
      p: ['M22 76 C34 76 34 58 48 58 C62 58 62 40 76 40',
          'M76 40 l10 -9 l-3 11 l9 5 l-12 2',
          'M86 34 c6 4 6 10 1 13', 'M86 46 c-6 4 -7 9 -2 12',
          'M38 66 v12', 'M56 48 v12', 'M66 46 v10'],
      c: [[80, 40, 1.7]] },
    { name: 'Snake', branch: '巳', char: '蛇', trine: 'Ox, Rooster', friend: 'Monkey',
      p: ['M52 82 C32 82 26 64 42 56 C58 48 68 56 68 42 C68 28 52 24 40 32',
          'M40 32 c-8 -6 -5 -16 4 -16 c8 0 10 9 4 13'],
      c: [[44, 26, 1.5]] },
    { name: 'Horse', branch: '午', char: '馬', trine: 'Tiger, Dog', friend: 'Goat',
      p: ['M26 58 C26 51 36 45 48 45 C60 45 70 51 70 58 C70 65 60 69 48 69 C36 69 26 65 26 58Z',
          'M64 51 C66 42 70 34 76 30 L90 26 L88 36 L78 38',
          'M80 26 l-2 -6 l6 4',
          'M34 67 L32 88', 'M44 68 v20', 'M58 68 v20', 'M66 67 L68 88',
          'M26 54 C18 52 12 58 14 68'],
      c: [[82, 32, 1.7]] },
    { name: 'Goat', branch: '未', char: '羊', trine: 'Rabbit, Pig', friend: 'Horse',
      p: ['M40 32 C34 18 22 18 21 27 C20 35 29 38 35 33',
          'M60 32 C66 18 78 18 79 27 C80 35 71 38 65 33',
          'M40 34 C34 44 35 58 44 64 L56 64 C65 58 66 44 60 34 Z',
          'M50 64 v12'],
      c: [[43, 46, 1.6], [57, 46, 1.6]] },
    { name: 'Monkey', branch: '申', char: '猴', trine: 'Rat, Dragon', friend: 'Snake',
      p: ['M50 26 C64 26 74 36 74 48 C74 60 64 68 50 68 C36 68 26 60 26 48 C26 36 36 26 50 26Z',
          'M26 48 c-8 0 -8 12 0 12', 'M74 48 c8 0 8 12 0 12',
          'M40 54 c0 8 20 8 20 0', 'M40 68 v18', 'M60 68 v18',
          'M60 86 c14 0 16 -12 6 -16'],
      c: [[43, 44, 1.7], [57, 44, 1.7]] },
    { name: 'Rooster', branch: '酉', char: '雞', trine: 'Ox, Snake', friend: 'Dragon',
      p: ['M34 62 C34 46 46 38 58 40 C70 42 74 54 66 62 L64 76 L36 76Z',
          'M52 36 v-12 l6 6 l4 -8 l3 14', 'M66 48 l9 3 l-9 4',
          'M66 58 C80 48 86 62 76 74', 'M44 76 v10', 'M58 76 v10'],
      c: [[58, 50, 1.6]] },
    { name: 'Dog', branch: '戌', char: '狗', trine: 'Tiger, Horse', friend: 'Rabbit',
      p: ['M50 26 C64 26 74 38 74 52 C74 66 63 76 50 76 C37 76 26 66 26 52 C26 38 36 26 50 26Z',
          'M30 34 C20 42 22 60 32 64', 'M70 34 C80 42 78 60 68 64',
          'M42 60 h16', 'M50 60 v8'],
      c: [[43, 46, 1.7], [57, 46, 1.7], [50, 66, 1.4]] },
    { name: 'Pig', branch: '亥', char: '豬', trine: 'Rabbit, Goat', friend: 'Tiger',
      p: ['M24 58 C24 44 36 36 50 36 C64 36 76 44 76 58 C76 72 64 80 50 80 C36 80 24 72 24 58Z',
          'M42 56 h16 v12 h-16z', 'M32 40 L28 28 L42 34', 'M68 40 L72 28 L58 34',
          'M76 52 c10 -4 10 8 2 9'],
      c: [[40, 46, 1.5], [60, 46, 1.5], [46, 62, 1.2], [54, 62, 1.2]] }
  ];

  var STEMS = ['Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'];
  var STEM_CHARS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var ELEMENTS = ['Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth', 'Metal', 'Metal', 'Water', 'Water'];
  var TRINE_GROUP = ['Rat, Dragon, Monkey', 'Ox, Snake, Rooster', 'Tiger, Horse, Dog', 'Rabbit, Goat, Pig'];

  function mod(n, m) { return ((n % m) + m) % m; }

  function forYear(year) {
    var idx = mod(year - 4, 60);
    var stem = idx % 10;
    var branch = idx % 12;
    return {
      year: year,
      stem: stem,
      branch: branch,
      animal: ANIMALS[branch],
      element: ELEMENTS[stem],
      polarity: stem % 2 === 0 ? 'Yang' : 'Yin',
      cycle: idx + 1,
      stemChar: STEM_CHARS[stem],
      stemName: STEMS[stem]
    };
  }

  function glyphSvg(animal) {
    var paths = animal.p.map(function (d) { return '<path d="' + d + '"/>'; }).join('');
    var dots = animal.c.map(function (c) { return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="currentColor" stroke="none"/>'; }).join('');
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<g fill="none" stroke="#1B5FA8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" transform="translate(1.2 -0.9)" opacity=".85">' + paths + '</g>' +
      '<g fill="none" stroke="#E23B2E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" transform="translate(-0.9 1.2)">' + paths + '</g>' +
      '<g color="#17161A" fill="none" stroke="#17161A" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">' + paths + dots + '</g>' +
      '</svg>';
  }

  /* ---------- parade line ---------- */
  var line = document.getElementById('paradeLine');
  if (line) {
    ANIMALS.forEach(function (a) {
      var cell = document.createElement('div');
      cell.className = 'animal';
      cell.innerHTML = '<span class="a-branch">' + a.branch + '</span>' + glyphSvg(a) + '<span class="a-name">' + a.name + '</span>';
      line.appendChild(cell);
    });
  }

  /* ---------- interpreter ---------- */
  var yearInput = document.getElementById('year');
  if (yearInput) {
    var range = document.getElementById('yearRange');
    var glyphSlot = document.getElementById('glyphSlot');
    var clampYear = function (v) { return Math.max(1924, Math.min(2043, v || 1924)); };

    function recentYears(year) {
      return [year - 36, year - 12, year, year + 12, year + 36]
        .filter(function (y) { return y >= 1900 && y <= 2100; })
        .join(' · ');
    }

    function update(year) {
      year = clampYear(parseInt(year, 10));
      var z = forYear(year);
      yearInput.value = year;
      range.value = year;
      var animal = z.animal;

      document.getElementById('rTitle').textContent = z.element + ' ' + animal.name;
      document.getElementById('rSub').textContent = z.stemChar + animal.branch + ' · stem ' + z.stem + ', branch ' + z.branch +
        ' · cycle no. ' + z.cycle + ' of 60';
      document.getElementById('fAnimal').textContent = animal.name + ' (' + animal.char + ')';
      document.getElementById('fElement').textContent = z.element + ' · ' + z.stemChar + ' ' + z.stemName;
      document.getElementById('fPolarity').textContent = z.polarity;
      document.getElementById('fBranch').textContent = animal.branch;
      document.getElementById('fYears').textContent = recentYears(year);
      document.getElementById('fTrine').textContent = animal.trine;
      document.getElementById('pYear').textContent = year;
      document.getElementById('pName').textContent = (z.element + ' ' + animal.name).toUpperCase();
      document.getElementById('pFoot').textContent = z.stemChar + animal.branch + ' · cycle no. ' + z.cycle;
      glyphSlot.innerHTML = glyphSvg(animal);
      document.getElementById('posterNote').textContent = animal.name + ' is the ' + (z.branch + 1) + 'th animal, and ' + year +
        ' is year ' + z.cycle + ' of the cycle: ' + z.stemName + ' ' + animal.branch + ', ' + z.polarity.toLowerCase() + ' ' + z.element.toLowerCase() +
        '. The trine is ' + animal.trine + '; the secret friend is ' + animal.friend + '.';
    }

    yearInput.addEventListener('change', function () { update(this.value); });
    yearInput.addEventListener('input', function () {
      var v = parseInt(this.value, 10);
      if (!isNaN(v) && v >= 1924 && v <= 2043) update(v);
    });
    range.addEventListener('input', function () { update(this.value); });
    document.getElementById('yearDown').addEventListener('click', function () { update(parseInt(yearInput.value, 10) - 1); });
    document.getElementById('yearUp').addEventListener('click', function () { update(parseInt(yearInput.value, 10) + 1); });
    update(1990);
  }

  /* ---------- commission form ---------- */
  var form = document.getElementById('commissionForm');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var ok = true;
      form.querySelectorAll('[data-required]').forEach(function (input) {
        var wrap = input.closest('.field');
        var v = (input.value || '').trim();
        var bad = !v;
        if (!bad && input.type === 'email') bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
        wrap.classList.toggle('bad', bad);
        if (bad) ok = false;
      });
      var okBox = document.getElementById('okBox');
      var badSum = document.getElementById('badSum');
      if (okBox) okBox.classList.toggle('show', ok);
      if (badSum) badSum.classList.toggle('show', !ok);
      if (ok && okBox) { okBox.scrollIntoView({ block: 'center', behavior: 'smooth' }); form.reset(); }
    });
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      el.addEventListener('input', function () {
        var w = el.closest('.field');
        if (w) w.classList.remove('bad');
      });
    });
  }
})();
