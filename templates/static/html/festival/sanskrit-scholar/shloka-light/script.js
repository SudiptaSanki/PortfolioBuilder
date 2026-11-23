/* ==========================================================================
   Shloka Light — interaction
   The chandas scanner reads Devanagari, weighs each syllable, groups the
   gaṇas, and names the metre. It is a silent instrument: no audio anywhere.
   ========================================================================== */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------------ nav */
  var toggle = document.querySelector('.mast__toggle');
  var nav = document.getElementById('mast-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* --------------------------------------------------------------- reveal */
  var rvs = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  if (rvs.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
      rvs.forEach(function (el) { io.observe(el); });
    } else {
      rvs.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* ------------------------------------------------------ chandas engine */
  var LONG_VOWELS = 'आईऊॠॡएऐओऔ';
  var SHORT_VOWELS = 'अइउऋऌ';
  var LONG_MATRAS = 'ाीूॄेैोौॣ';
  var MATRAS = 'ािीुूृॄॢॣेैोौ';
  var VIRAMA = '\u094D';
  var ANUSVARA = '\u0902';
  var VISARGA = '\u0903';

  function clean(text) {
    return text
      .replace(/[।॥|]/g, ' ')
      .replace(/[0-9०-९]/g, ' ')
      .replace(/[\u200c\u200d\ufeff]/g, '')
      .replace(/[^\u0900-\u097F\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isConsonant(ch) {
    var c = ch.charCodeAt(0);
    return (c >= 0x0915 && c <= 0x0939) || (c >= 0x0958 && c <= 0x095F) || ch === '\u0979' || ch === '\u097A';
  }
  function isIndependentVowel(ch) {
    var c = ch.charCodeAt(0);
    return c >= 0x0904 && c <= 0x0914;
  }
  function isMatra(ch) { return MATRAS.indexOf(ch) !== -1; }

  // Split a cleaned verse into syllables with their measured weight.
  function syllabify(text) {
    var s = clean(text);
    var nuclei = [];
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (isIndependentVowel(ch)) {
        nuclei.push({ index: i, kind: 'vowel', long: LONG_VOWELS.indexOf(ch) !== -1 });
      } else if (isConsonant(ch)) {
        var next = s[i + 1];
        if (next === VIRAMA) continue;          // part of a cluster, no vowel
        if (next && isMatra(next)) continue;     // the matra is the nucleus
        nuclei.push({ index: i, kind: 'inherent', long: false });
      } else if (isMatra(ch)) {
        nuclei.push({ index: i, kind: 'matra', long: LONG_MATRAS.indexOf(ch) !== -1 });
      }
    }

    var out = [];
    for (var n = 0; n < nuclei.length; n++) {
      var nucleus = nuclei[n];
      var start = n === 0 ? 0 : nuclei[n - 1].index + 1;
      // include a matra that belongs to the nucleus
      var end = nucleus.index + 1;
      var after = end;
      var nextStart = n + 1 < nuclei.length ? nuclei[n + 1].index : s.length;
      var tail = s.slice(after, nextStart);

      var weight = nucleus.long ? 'G' : 'L';
      if (/[\u0902\u0903]/.test(tail)) {
        weight = 'G';
      } else if (tail.length && isConsonant(tail[0]) && tail[1] === VIRAMA) {
        weight = 'G';
      } else if (tail.length && isConsonant(tail[0]) && !isMatra(tail[1] || '') && tail[1] !== VIRAMA) {
        // a single consonant opening the next syllable leaves this one light
        weight = weight;
      }
      // syllable text: onset + nucleus, plus a trailing anusvara/visarga
      var textEnd = end;
      while (textEnd < s.length && (s[textEnd] === ANUSVARA || s[textEnd] === VISARGA || s[textEnd] === '\u0901')) textEnd++;
      out.push({
        text: s.slice(start, textEnd).trim(),
        weight: weight,
        long: nucleus.long
      });
    }
    return out;
  }

  var GANAS = [
    ['GGG', 'ma'], ['LGG', 'ya'], ['GLG', 'ra'], ['LLG', 'sa'],
    ['GGL', 'ta'], ['LGL', 'ja'], ['GLL', 'bha'], ['LLL', 'na']
  ];
  function ganasOf(weights) {
    var out = [];
    for (var i = 0; i + 3 <= weights.length; i += 3) {
      var tri = weights.slice(i, i + 3);
      var found = '';
      for (var g = 0; g < GANAS.length; g++) if (GANAS[g][0] === tri) found = GANAS[g][1];
      out.push(found || '?');
    }
    var rest = weights.slice(-(weights.length % 3 || 0));
    if (weights.length % 3 === 1) out.push(rest === 'L' ? 'la' : 'ga');
    if (weights.length % 3 === 2) out.push(rest.split('').map(function (w) { return w === 'L' ? 'la' : 'ga'; }).join(' '));
    return out;
  }

  var METRES = [
    { key: 'indravajra', name: 'Indravajrā', deva: 'इन्द्रवज्रा', per: 11, pattern: 'GGLGGLLGLGG', formula: 'ta ta ja ga ga', sense: 'the stately 11-syllable line of the Triṣṭubh class, used for dignified speech and counsel.' },
    { key: 'upendravajra', name: 'Upendravajrā', deva: 'उपेन्द्रवज्रा', per: 11, pattern: 'LGLGGLLGLGG', formula: 'ja ta ja ga ga', sense: 'Indravajrā with a light opening, which makes the same line sound a little less certain.' },
    { key: 'vamshastha', name: 'Vaṃśastha', deva: 'वंशस्थ', per: 12, pattern: 'LGLGGLLGLGLG', formula: 'ja ta ja ra', sense: 'the common 12-syllable line of narrative and dialogue.' },
    { key: 'vasantatilaka', name: 'Vasantatilakā', deva: 'वसन्ततिलका', per: 14, pattern: 'GGLGLLLGLLGLGG', formula: 'ta bha ja ja ga ga', sense: '“the ornament of spring”: a run of three light syllables in the middle before the heavy close.' },
    { key: 'malini', name: 'Mālinī', deva: 'मालिनी', per: 15, pattern: 'LLLLLLGGGLGGLGG', formula: 'na na ma ya ya', sense: 'the garland metre, six light syllables opening into a broad, lyrical close.' },
    { key: 'sikharini', name: 'Śikhariṇī', deva: 'शिखरिणी', per: 17, pattern: 'LGGGGGLLLLLGGLLLG', formula: 'ya ma na sa bha la ga', sense: 'the crest metre, with a long climb and a heavy summit.' },
    { key: 'mandakranta', name: 'Mandākrāntā', deva: 'मन्दाक्रान्ता', per: 17, pattern: 'GGGGLLLLLGGLGGLGG', formula: 'ma bha na ta ta ga ga', sense: 'the slow-moving metre of Kālidāsa’s Meghadūta, built for longing and distance.' },
    { key: 'shardula', name: 'Śārdūlavikrīḍita', deva: 'शार्दूलविक्रीडित', per: 19, pattern: 'GGGLLGLGLLLGGGLGGLG', formula: 'ma sa ja sa ta ta ga', sense: '“the tiger’s play”: the grand 19-syllable line of praise and epic description.' },
    { key: 'sragdhara', name: 'Sragdharā', deva: 'स्रग्धरा', per: 21, pattern: 'GGGGLGGLLLLLLGGLGGLGG', formula: 'ma ra bha na ya ya ya', sense: 'the garland-bearer, the longest of the metres a student meets in the first year.' }
  ];

  function patternMatches(weights, pattern) {
    if (weights.length !== pattern.length) return false;
    // the final syllable of a pāda is anceps
    for (var i = 0; i < pattern.length - 1; i++) {
      if (weights[i] !== pattern[i]) return false;
    }
    return true;
  }

  function splitPadas(syllables) {
    var n = syllables.length;
    var size = 0;
    if (n === 24) size = 8;
    else if (n % 4 === 0 && n / 4 >= 6) size = n / 4;
    else if (n % 3 === 0 && n / 3 === 8) size = 8;
    if (!size) return [syllables];
    var padas = [];
    for (var i = 0; i < n; i += size) padas.push(syllables.slice(i, i + size));
    return padas;
  }

  function identify(padas) {
    var weights = padas.map(function (p) { return p.map(function (s) { return s.weight; }).join(''); });
    var counts = weights.map(function (w) { return w.length; });
    var uniform = counts.every(function (c) { return c === counts[0]; });

    if (uniform && padas.length === 4) {
      // upajāti first: a mixture of the two 11-syllable cousins
      var allIndra = weights.every(function (w) { return patternMatches(w, 'GGLGGLLGLGG'); });
      var allUpendra = weights.every(function (w) { return patternMatches(w, 'LGLGGLLGLGG'); });
      var eachCousin = weights.every(function (w) { return patternMatches(w, 'GGLGGLLGLGG') || patternMatches(w, 'LGLGGLLGLGG'); });
      if (eachCousin && !allIndra && !allUpendra) {
        return {
          name: 'Upajāti', deva: 'उपजाति', per: counts[0],
          note: 'A verse that mixes Indravajrā and Upendravajrā pādas. Both are 11 syllables; the first syllable of each pāda decides which cousin it is. This is the commonest 11-syllable metre in classical poetry.'
        };
      }
      for (var m = 0; m < METRES.length; m++) {
        var mm = METRES[m];
        if (mm.per === counts[0] && weights.every(function (w) { return patternMatches(w, mm.pattern); })) {
          return { name: mm.name, deva: mm.deva, per: mm.per, formula: mm.formula, note: mm.sense };
        }
      }
      if (counts[0] === 8) {
        var cadenceOk = weights.every(function (w, idx) {
          var odd = idx % 2 === 0;
          var fifth = w[4], sixth = w[5], seventh = w[6];
          return fifth === 'L' && sixth === 'G' && (odd ? seventh === 'G' : seventh === 'L');
        });
        return {
          name: 'Anuṣṭubh', deva: 'अनुष्टुभ्', per: 8,
          note: cadenceOk
            ? 'The śloka, in its pathyā cadence: the fifth syllable light, the sixth heavy, and the seventh heavy in odd pādas, light in even pādas. This is the metre of the epics and the Bhagavadgītā.'
            : 'Eight syllables to the pāda, which puts it in the anuṣṭubh class, but the cadence is one of the permitted variants rather than the plain pathyā line.'
        };
      }
    }

    if (uniform && padas.length === 3 && counts[0] === 8) {
      return { name: 'Gāyatrī', deva: 'गायत्री', per: 8, note: 'Three pādas of eight syllables: the Vedic metre of the Gāyatrī mantra, older than the classical system and counted a little differently.' };
    }

    // a single pāda quoted on its own
    if (padas.length === 1) {
      for (var k = 0; k < METRES.length; k++) {
        if (patternMatches(weights[0], METRES[k].pattern)) {
          return {
            name: METRES[k].name, deva: METRES[k].deva, per: METRES[k].per, formula: METRES[k].formula,
            note: 'One pāda of ' + METRES[k].per + ' syllables matches ' + METRES[k].name + '. A full verse repeats the pattern four times.'
          };
        }
      }
    }

    return null;
  }

  function buildResult(syllables) {
    var padas = splitPadas(syllables);
    var identified = identify(padas);
    var total = syllables.length;
    var counts = padas.map(function (p) { return p.length; });
    var box = document.getElementById('scan-result');
    if (!box) return;
    while (box.firstChild) box.removeChild(box.firstChild);

    function add(tag, cls, text) {
      var node = document.createElement(tag);
      if (cls) node.className = cls;
      if (text !== undefined) node.textContent = text;
      box.appendChild(node);
      return node;
    }

    add('p', 'result__label', 'Result');

    if (!syllables.length) {
      add('p', 'result__empty', 'There is nothing in Devanagari to scan yet. Paste a verse, or choose an example above.');
      return;
    }

    if (identified) {
      var nameEl = add('p', 'result__name');
      nameEl.appendChild(document.createTextNode(identified.name));
      nameEl.appendChild(document.createTextNode(' '));
      var deva = document.createElement('span');
      deva.className = 'deva';
      deva.lang = 'sa';
      deva.textContent = identified.deva;
      nameEl.appendChild(deva);
      add('p', 'result__sub', total + ' syllables · ' + padas.length + (padas.length === 1 ? ' pāda' : ' pādas') +
        (counts.every(function (c) { return c === counts[0]; }) ? ' of ' + counts[0] : '') +
        ' · final syllable anceps');
    } else {
      add('p', 'result__name', 'Not in this desk’s table');
      add('p', 'result__sub', total + ' syllables · ' + padas.length + (padas.length === 1 ? ' pāda' : ' pādas') +
        ' · ' + counts.join(' + '));
    }

    // the weight strip
    var weightsBox = document.createElement('div');
    weightsBox.className = 'weights';
    padas.forEach(function (pada, pi) {
      var row = document.createElement('div');
      row.className = 'pada';
      pada.forEach(function (syl, si) {
        var span = document.createElement('span');
        span.className = 'syl ' + (syl.weight === 'G' ? 'g' : 'l') + (si === pada.length - 1 ? ' anceps' : '');
        var text = document.createElement('i');
        text.textContent = syl.text;
        var mark = document.createElement('b');
        mark.textContent = syl.weight === 'G' ? '–' : '⏑';
        span.appendChild(text);
        span.appendChild(mark);
        row.appendChild(span);
      });
      var tag = document.createElement('span');
      tag.className = 'pada__tag';
      tag.textContent = 'pāda ' + (pi + 1);
      row.appendChild(tag);
      weightsBox.appendChild(row);
    });
    box.appendChild(weightsBox);

    // gaṇas
    var ganasBox = document.createElement('div');
    ganasBox.className = 'ganas';
    padas.forEach(function (pada, pi) {
      var label = document.createElement('span');
      label.textContent = 'pāda ' + (pi + 1) + ': ';
      ganasBox.appendChild(label);
      var strong = document.createElement('b');
      strong.textContent = ganasOf(pada.map(function (s) { return s.weight; }).join('')).join(' · ');
      ganasBox.appendChild(strong);
    });
    box.appendChild(ganasBox);

    var note = add('p', 'result__note');
    if (identified) {
      if (identified.formula) {
        var f = document.createElement('strong');
        f.textContent = identified.formula + '. ';
        note.appendChild(f);
      }
      note.appendChild(document.createTextNode(identified.note));
    } else {
      var nearest = METRES.slice().sort(function (a, b) { return Math.abs(a.per - counts[0]) - Math.abs(b.per - counts[0]); })[0];
      note.appendChild(document.createTextNode('The weights are scanned and shown above, but the pattern does not match the nine metres this desk knows. '));
      if (nearest) {
        var n2 = document.createElement('strong');
        n2.textContent = 'Closest by length: ' + nearest.name + ' (' + nearest.per + ' syllables per pāda). ';
        note.appendChild(n2);
      }
      note.appendChild(document.createTextNode('Check for a missing syllable, a sandhi that has been split, or a licence taken by the poet.'));
    }
  }

  /* ------------------------------------------------------------- examples */
  var EXAMPLES = {
    gita: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥',
    gayatri: 'तत्सवितुर्वरेणियं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्',
    megha: 'कश्चित्कान्ताविरहगुरुणा स्वाधिकारात्प्रमत्तः\nशापेनास्तंगमितमहिमा वर्षभोग्येण भर्तुः ।\nयक्षश्चक्रे जनकतनयास्नानपुण्योदकेषु\nस्निग्धच्छायातरुषु वसतिं रामगिर्याश्रमेषु ॥',
    vasanta: 'उक्ता वसन्ततिलका तभजा जगौ गः'
  };

  var input = document.getElementById('verse-input');
  var scanBtn = document.getElementById('scan-btn');

  function scan() {
    if (!input) return;
    buildResult(syllabify(input.value));
  }

  if (input && scanBtn) {
    scanBtn.addEventListener('click', scan);
    input.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); scan(); }
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-example]'), function (chip) {
      chip.addEventListener('click', function () {
        var key = chip.getAttribute('data-example');
        Array.prototype.forEach.call(document.querySelectorAll('[data-example]'), function (c) {
          c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
        });
        input.value = EXAMPLES[key] || '';
        scan();
      });
    });
    // first reading, so the desk is not empty when a visitor arrives
    scan();
  }

  /* --------------------------------------------------------- contact form */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var success = document.getElementById('sent');
    var detail = document.getElementById('sent-detail');
    var ref = document.getElementById('sent-ref');
    var live = document.getElementById('form-status');

    var checks = [
      { id: 's-name', test: function (v) { return v.trim().length >= 2; }, msg: 'Please give a name I can answer.' },
      { id: 's-email', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'The email address looks incomplete.' },
      { id: 's-type', test: function (v) { return Boolean(v); }, msg: 'Choose the kind of enquiry.' },
      { id: 's-message', test: function (v) { return v.trim().length >= 12; }, msg: 'A sentence or two about the text or the question.' }
    ];

    function wrapOf(el) { return el.closest('.field') || el.closest('.check'); }
    function setErr(el, msg) {
      var w = wrapOf(el);
      if (!w) return;
      w.classList.toggle('has-error', Boolean(msg));
      var e = w.querySelector('.err');
      if (e) e.textContent = msg || '';
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }

    checks.forEach(function (c) {
      var el = document.getElementById(c.id);
      if (!el) return;
      el.addEventListener('input', function () { if (wrapOf(el) && wrapOf(el).classList.contains('has-error')) setErr(el, ''); });
      el.addEventListener('change', function () { setErr(el, ''); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      var vals = {};
      checks.forEach(function (c) {
        var el = document.getElementById(c.id);
        if (!el) return;
        vals[c.id] = el.value;
        var ok = c.test(el.value);
        setErr(el, ok ? '' : c.msg);
        if (!ok && !bad) bad = el;
      });
      var agree = document.getElementById('s-agree');
      var agreeOk = agree && agree.checked;
      if (agree) {
        var w = agree.closest('.check');
        if (w) w.classList.toggle('has-error', !agreeOk);
        if (!agreeOk && !bad) bad = agree;
      }
      if (bad) {
        bad.focus();
        if (live) live.textContent = 'The enquiry was not sent. Check the marked fields.';
        return;
      }
      var sel = document.getElementById('s-type');
      var type = sel && sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : 'enquiry';
      var first = vals['s-name'].trim().split(' ')[0];
      if (detail) {
        detail.textContent = 'Thank you, ' + first + '. I have your note about ' + type.toLowerCase() + '. I read letters on Tuesdays and Fridays, and I answer difficult questions slowly. If you have sent a photograph of a folio, I will look at it before replying.';
      }
      if (ref) ref.textContent = 'Reference SL-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
      form.hidden = true;
      if (success) { success.hidden = false; success.focus(); }
      if (live) live.textContent = 'Enquiry recorded on this page. No message has left the browser.';
    });
  }
})();
