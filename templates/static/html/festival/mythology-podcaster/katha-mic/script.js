/* Katha Mic — site behaviour. No audio is played anywhere on this site. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  /* ------------------------------------------------------------- nav --- */
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('primary-nav');
  if (menuBtn && nav) {
    var closeNav = function () {
      document.body.classList.remove('nav-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open menu');
    };
    menuBtn.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        closeNav();
        menuBtn.focus();
      }
    });
  }

  /* ------------------------------------------------------------ year --- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------ hero wave --- */
  var heroWave = document.getElementById('heroWave');
  if (heroWave) {
    var heights = [22, 38, 54, 30, 66, 84, 48, 72, 36, 58, 92, 64, 44, 76, 50, 88, 40, 62, 96, 54,
      34, 70, 46, 80, 58, 42, 68, 90, 52, 36, 74, 60, 86, 48, 30, 64, 78, 44, 56, 82, 38, 66,
      92, 50, 72, 34, 60, 86, 46, 28, 74, 58, 40, 68, 88, 52, 32, 62, 80, 44];
    var frag = document.createDocumentFragment();
    heights.forEach(function (h, i) {
      var bar = document.createElement('span');
      bar.style.height = h + '%';
      bar.style.animationDelay = ((i % 12) * 0.13).toFixed(2) + 's';
      frag.appendChild(bar);
    });
    heroWave.appendChild(frag);
  }

  /* ------------------------------------------------------ rundown desk --- */
  var M = {
    tejimola: {
      title: 'The gourd vine that spoke',
      source: 'Tejimola · Burhi Aair Sadhu (Lakshminath Bezbaroa, 1910)',
      acts: [
        ['Cold open', 'A grandmother in Nalbari describes the gourd vine in her back garden, then stops herself.'],
        ['The household', 'Tejimola, her stepmother, and the work a girl is given when nobody counts her hours.'],
        ['The gourd', 'The buried body, the vine, the fruit cut open on the riverbank.'],
        ['The turn', 'The bird that will not be shooed away, and the song only one person understands.'],
        ['The gourd returns', 'Recognition, punishment, and what the tale refuses to resolve.'],
        ['Closing question', 'Who is allowed to be remembered in this family, and by whom?']
      ],
      tape: 4, sources: 6
    },
    behula: {
      title: "Behula's boat",
      source: 'Manasa legend · Chand Sadagar cycle, Assam and Bengal',
      acts: [
        ['Cold open', 'Water at night: a boatman recites the opening couplet before he will speak.'],
        ['A merchant says no', 'Chand Sadagar refuses the goddess Manasa, and the price of that refusal.'],
        ['The wedding', 'Behula and Lakhindar, the bridal chamber, the snake in the flower.'],
        ['The turn', 'The raft, the river, the cremation ground and the argument with the gods.'],
        ['What the goddess wants', 'Manasa is not a villain here. She is a neglected power asking for a shrine.'],
        ['Closing question', 'Is devotion love, obligation, or a negotiation with fear?']
      ],
      tape: 7, sources: 8
    },
    kamakhya: {
      title: 'The Kechaikhati of Kamakhya hill',
      source: 'Field recording · Kamakhya, Guwahati, Ambubachi 2025',
      acts: [
        ['Cold open', 'Night tape: footsteps on stone, a bell, a voice that asks not to be named.'],
        ['The hill', 'Who lives on Kamakhya hill, and which stories are told only inside the temple.'],
        ['The keeper', 'A priest explains the difference between the story and the warning.'],
        ['The turn', 'What the Kechaikhati is said to eat, and why the telling is hedged.'],
        ['The morning after', 'Ambubachi ends. The hill reopens. The recording is listened to together.'],
        ['Closing question', 'What does a listener owe a story that was never meant for them?']
      ],
      tape: 9, sources: 5
    },
    lauhitya: {
      title: 'The river that came from a horse',
      source: 'Lauhitya / Brahmaputra origin tales, Assam',
      acts: [
        ['Cold open', 'The sound of the Brahmaputra at Pandu, recorded at low water.'],
        ['A river with too many names', 'Brahmaputra, Lauhitya, Tsangpo, Yarlung: one waterway, four tellings.'],
        ['The horse', 'The origin story of the horse sacrifice and the water that broke loose.'],
        ['The turn', 'How a myth of origin handles a river that floods every year.'],
        ['Living with it', 'Char dwellers on the sandbars describe moving their houses.'],
        ['Closing question', 'Does a river belong to the story or to the people on its banks?']
      ],
      tape: 6, sources: 7
    },
    samudra: {
      title: 'Churning, and what came after',
      source: 'Samudra Manthan · Mahabharata, Adi Parva',
      acts: [
        ['Cold open', 'A room of children retelling the churning in their own words.'],
        ['The bargain', 'Gods, asuras, and a mountain used as a churning rod.'],
        ['The rope and the poison', 'Vasuki, Mandara, and the poison Shiva holds in his throat.'],
        ['The turn', 'What comes up before the nectar: the horse, the gem, the tree, the elephant.'],
        ['The last cup', 'Moha, the asura who sits among the gods, and the tale of the eclipse.'],
        ['Closing question', 'Why does every retelling leave out a different part?']
      ],
      tape: 5, sources: 9
    }
  };

  var FORMATS = {
    solo: { label: 'Solo narration', tape: 0.6, kit: '1 mic + backup', note: 'Solo means you carry the whole room. Cut the interview questions from the outline and keep one line of tape as proof the teller exists.' },
    interview: { label: 'Interview with a keeper', tape: 1.3, kit: '2 mics + 4-track', note: 'Interview format needs a second consent form, a named translator in the credits, and forty minutes of unedited room tone.' },
    field: { label: 'Field-led, narrated', tape: 1.8, kit: '2 mics + windshields', note: 'Field-led episodes live or die on the walk-in. Record ten minutes before you press record on the conversation.' }
  };

  var LISTENERS = {
    curious: { label: 'Curious newcomer', sources: 0, line: 'Gloss every term in the first thirty seconds, then trust the story.' },
    diaspora: { label: 'Assamese diaspora', sources: 1, line: 'Do not explain the festival calendar. Say which village, which year, whose voice.' },
    student: { label: 'Folklore student', sources: 3, line: 'Name the collection, the teller and the variant, even when it slows the opening.' }
  };

  var ACT_WEIGHTS = [0.07, 0.13, 0.24, 0.16, 0.24, 0.16];

  function fmtTime(totalMinutes) {
    var h = Math.floor(totalMinutes / 60);
    var m = totalMinutes % 60;
    return (h > 0 ? h + ':' + String(m).padStart(2, '0') : '0:' + String(m).padStart(2, '0'));
  }

  function buildRundown(values) {
    var myth = M[values.myth] || M.tejimola;
    var format = FORMATS[values.format] || FORMATS.solo;
    var listener = LISTENERS[values.listener] || LISTENERS.curious;
    var runtime = values.runtime;

    var minutes = ACT_WEIGHTS.map(function (w) { return Math.max(1, Math.round(runtime * w)); });
    var diff = runtime - minutes.reduce(function (a, b) { return a + b; }, 0);
    minutes[minutes.length - 1] += diff;
    if (minutes[minutes.length - 1] < 1) {
      minutes[minutes.length - 1] = 1;
      minutes[minutes.length - 2] -= 1;
    }

    var start = 0;
    var acts = myth.acts.map(function (act, i) {
      var entry = {
        start: fmtTime(start),
        title: act[0],
        desc: act[1],
        min: minutes[i] + ' min'
      };
      start += minutes[i];
      return entry;
    });

    var tape = Math.max(1, Math.round(myth.tape * format.tape));
    var sources = myth.sources + listener.sources;
    var words = Math.round((runtime * 130) / 10) * 10;

    var note = '<strong>' + format.label + '.</strong> ' + format.note + ' <strong>' + listener.label + '.</strong> ' + listener.line;

    return {
      title: myth.title,
      source: myth.source,
      total: runtime,
      acts: acts,
      words: words.toLocaleString('en-US'),
      tape: tape + ' h',
      sources: String(sources),
      kit: format.kit,
      note: note
    };
  }

  function wavePath(seed, total) {
    var rand = function () {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    var bars = [];
    var count = 72;
    var step = 640 / count;
    for (var i = 0; i < count; i++) {
      var act = Math.floor((i / count) * ACT_WEIGHTS.length);
      var energy = [0.32, 0.46, 0.78, 0.58, 0.86, 0.4][act] || 0.5;
      var h = 8 + energy * (26 + rand() * 58);
      var x = (i * step).toFixed(1);
      var y = (52 - h / 2).toFixed(1);
      bars.push('<rect x="' + x + '" y="' + y + '" width="' + (step - 2.2).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="1" fill="#C6A15B" opacity="' + (0.34 + rand() * 0.44).toFixed(2) + '"/>');
    }
    /* act divider lines */
    var acc = 0;
    var rules = '';
    ACT_WEIGHTS.forEach(function (w, i) {
      if (i === 0) { acc += w; return; }
      acc += w;
      var x = (acc * 640).toFixed(1);
      rules += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="104" stroke="#F2EBDD" stroke-opacity=".18" stroke-dasharray="2 3"/>';
    });
    return '<g>' + bars.join('') + '</g>' + rules +
      '<line x1="0" y1="52" x2="640" y2="52" stroke="#F2EBDD" stroke-opacity=".14"/>' +
      '<circle cx="' + Math.min(636, 640 * 0.34).toFixed(0) + '" cy="52" r="3.4" fill="#BE452C"/>';
  }

  var form = document.getElementById('rundownForm');
  if (form) {
    var rdTitle = document.getElementById('rdTitle');
    var rdTotal = document.getElementById('rdTotal');
    var rdActs = document.getElementById('rdActs');
    var rdWave = document.getElementById('rdWave');
    var rdAxis = document.getElementById('rdAxis');
    var rdWords = document.getElementById('rdWords');
    var rdTape = document.getElementById('rdTape');
    var rdSources = document.getElementById('rdSources');
    var rdKit = document.getElementById('rdKit');
    var rdNote = document.getElementById('rdNote');
    var runtimeInput = document.getElementById('runtime');
    var runtimeOut = document.getElementById('runtimeOut');

    var read = function () {
      return {
        myth: document.getElementById('myth').value,
        format: document.getElementById('format').value,
        runtime: parseInt(runtimeInput.value, 10),
        listener: document.getElementById('listener').value
      };
    };

    var render = function () {
      var values = read();
      runtimeOut.textContent = values.runtime + ' min';
      var data = buildRundown(values);

      rdTitle.textContent = data.title;
      rdTotal.textContent = String(data.total);
      rdWords.textContent = data.words;
      rdTape.textContent = data.tape;
      rdSources.textContent = data.sources;
      rdKit.textContent = data.kit;
      rdNote.innerHTML = data.note;

      rdActs.innerHTML = data.acts.map(function (a) {
        return '<li><span class="act-time">' + a.start + '</span><div class="act-body"><strong>' +
          a.title + '</strong><p>' + a.desc + '</p></div><span class="act-min">' + a.min + '</span></li>';
      }).join('');

      var seed = values.runtime * 37 + values.myth.length * 101 + values.format.length * 13 + values.listener.length * 7;
      rdWave.innerHTML = wavePath(seed, values.total);
      rdAxis.innerHTML = '<span>0:00</span><span>' + fmtTime(Math.round(values.runtime / 2)) +
        '</span><span>' + fmtTime(values.runtime) + '</span>';
      rdWave.setAttribute('aria-label', 'Waveform sketch of a ' + values.runtime + ' minute episode in ' +
        data.acts.length + ' acts');
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      render();
      var live = document.querySelector('.rundown');
      if (live) {
        live.classList.remove('pulse');
        void live.offsetWidth;
        live.classList.add('pulse');
      }
    });

    ['myth', 'format', 'listener'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', render);
    });
    runtimeInput.addEventListener('input', render);

    var reset = document.getElementById('resetDesk');
    if (reset) reset.addEventListener('click', function () {
      form.reset();
      runtimeInput.value = '32';
      render();
    });

    render();
  }

  /* --------------------------------------------------------- reveals --- */
  var revealables = document.querySelectorAll('.reveal');
  if (revealables.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealables.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      revealables.forEach(function (el) { io.observe(el); });
    }
  }

  /* ------------------------------------------------------ contact form --- */
  var contact = document.getElementById('contactForm');
  if (contact) {
    var success = document.getElementById('formSuccess');
    var fields = {
      name: { el: document.getElementById('cfName'), test: function (v) { return v.trim().length >= 2; }, msg: 'Please give a name I can write back to.' },
      email: { el: document.getElementById('cfEmail'), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'That email address does not look complete.' },
      topic: { el: document.getElementById('cfTopic'), test: function (v) { return v !== ''; }, msg: 'Choose what the message is about.' },
      message: { el: document.getElementById('cfMessage'), test: function (v) { return v.trim().length >= 20; }, msg: 'A few sentences, twenty characters or more, so I can answer well.' }
    };

    var setState = function (key, ok) {
      var field = fields[key];
      if (!field || !field.el) return;
      var wrap = field.el.closest('.form-field');
      if (wrap) wrap.classList.toggle('invalid', !ok);
      field.el.setAttribute('aria-invalid', ok ? 'false' : 'true');
    };

    Object.keys(fields).forEach(function (key) {
      var field = fields[key];
      if (!field.el) return;
      field.el.addEventListener('input', function () {
        if (field.el.closest('.form-field').classList.contains('invalid')) {
          setState(key, field.test(field.el.value));
        }
      });
      field.el.addEventListener('change', function () {
        setState(key, field.test(field.el.value));
      });
    });

    contact.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(fields).forEach(function (key) {
        var field = fields[key];
        if (!field.el) return;
        var ok = field.test(field.el.value);
        setState(key, ok);
        if (!ok && !firstBad) firstBad = field.el;
      });
      if (firstBad) {
        firstBad.focus();
        if (success) success.hidden = true;
        return;
      }
      if (success) {
        success.hidden = false;
        var name = document.getElementById('cfName');
        var slot = document.getElementById('successName');
        slot.textContent = name ? name.value.trim().split(' ')[0] : 'friend';
        success.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
      contact.reset();
      Object.keys(fields).forEach(function (key) {
        var wrap = fields[key].el && fields[key].el.closest('.form-field');
        if (wrap) wrap.classList.remove('invalid');
        if (fields[key].el) fields[key].el.removeAttribute('aria-invalid');
      });
    });
  }

  /* -------------------------------------------------- episode filters --- */
  var filterButtons = document.querySelectorAll('.filter-btn');
  if (filterButtons.length) {
    var rows = document.querySelectorAll('.ep-row');
    var countEl = document.getElementById('filterCount');
    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter');
        filterButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        var shown = 0;
        rows.forEach(function (row) {
          var match = filter === 'all' || row.getAttribute('data-format') === filter;
          row.classList.toggle('is-hidden', !match);
          if (match) shown += 1;
        });
        if (countEl) countEl.textContent = shown + (shown === 1 ? ' episode' : ' episodes');
      });
    });
  }

  /* ----------------------------------------------- small page anchors --- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });
})();
