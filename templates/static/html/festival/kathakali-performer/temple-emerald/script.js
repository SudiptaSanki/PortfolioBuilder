/* Temple Emerald — Kathakali performer
   Nav, reveal, and the aharya studio: six make-up types and a green-room clock. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- masthead ---------- */
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- reveal ---------- */
  var revealNodes = document.querySelectorAll('.reveal');
  if (revealNodes.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      revealNodes.forEach(function (n) { n.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
      revealNodes.forEach(function (n) { io.observe(n); });
    }
  }

  /* ---------- aharya studio ---------- */
  var face = document.getElementById('studioFace');
  var form = document.getElementById('studioForm');
  if (!face || !form) return;

  var TYPES = {
    pacha: {
      label: 'Pacha · the noble green',
      title: 'Pacha',
      desc: 'Green face, full white chutti, red lips, no beard. The colour says the man is in the right, and the play will not test it.',
      mix: 'Green pigment over the whole face, chutti paste ridge, lamp black for the brows',
      chutti: '3 hr 30 min',
      chuttiMin: 210,
      plays: 'Nalacharitam, Kalyanasougandhikam, Bakavadham',
      walk: 'Slow, level, weight on the heel'
    },
    kathi: {
      label: 'Kathi · the proud villain',
      title: 'Kathi',
      desc: 'Green base under a white chutti, a red knife-mark on each cheek and a white moustache. The face of a man who is certain, which is what makes him dangerous.',
      mix: 'Green base, white moustache and beard ridge, red cheek knife, lamp black brows',
      chutti: '4 hr 00 min',
      chuttiMin: 240,
      plays: 'Duryodhanavadham, Keechakavadham, Ravanodbhavam',
      walk: 'Wide stance, chest first, a held pause before every turn'
    },
    chuvanna: {
      label: 'Chuvanna thadi · the fierce demon',
      title: 'Chuvanna thadi',
      desc: 'Red ochre laid over the whole face and a red beard that doubles the width of the head. The chutti is trimmed short so the colour does the work.',
      mix: 'Red ochre over face and neck, red beard, trimmed white chutti, black brows',
      chutti: '4 hr 45 min',
      chuttiMin: 285,
      plays: 'Bakavadham (Baka), Kirmiravadham (Kirmira)',
      walk: 'Knees bent, arms wide, a stamp on every entry'
    },
    karutha: {
      label: 'Karutha thadi · the forest hunter',
      title: 'Karutha thadi',
      desc: 'Lamp black base, black beard, thin white chutti border. Hunters and forest dwellers: Kirata, and the guards who mistake a hero for a deer.',
      mix: 'Lamp black base, black beard, white chutti border, red eye rims',
      chutti: '4 hr 15 min',
      chuttiMin: 255,
      plays: 'Kirmiravadham (Kirata), Karthaveeryarjunavijayam',
      walk: 'Low and prowling, weight always forward'
    },
    kari: {
      label: 'Kari · the ogress',
      title: 'Kari',
      desc: 'Black over the face and arms, red mouth, two teeth and no chutti at all. Kari roles are short and violent; the make-up is the whole character.',
      mix: 'Lamp black face and arms, red mouth, two teeth, no chutti',
      chutti: '2 hr 50 min',
      chuttiMin: 170,
      plays: 'Poothanamoksham, and the ogress scenes in Bakavadham',
      walk: 'Fast and sidelong, a lurch on the turn'
    },
    minukku: {
      label: 'Minukku · the radiant',
      title: 'Minukku',
      desc: 'A sandal-toned base, a thin chutti, no beard. Minukku carries the women, the sages and the messengers — the roles that watch the hero rather than fight him.',
      mix: 'Sandal and turmeric base, thin chutti, red lips, no beard',
      chutti: '2 hr 15 min',
      chuttiMin: 135,
      plays: 'Nalacharitam (Damayanti), Kalyanasougandhikam (Panchali)',
      walk: 'Small steps, straight spine, eyes lowered'
    }
  };

  var titleEl = document.getElementById('roTitle');
  var descEl = document.getElementById('roDesc');
  var mixEl = document.getElementById('roMix');
  var chuttiEl = document.getElementById('roChutti');
  var playsEl = document.getElementById('roPlays');
  var walkEl = document.getElementById('roWalk');
  var typeEl = document.getElementById('studioType');
  var scheduleEl = document.getElementById('schedule');
  var curtainEl = document.getElementById('curtain');
  var roleEl = document.getElementById('role');

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function clock(total) {
    var m = ((Math.round(total) % 1440) + 1440) % 1440;
    return pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  }

  function baseMinutes() {
    var v = (curtainEl && curtainEl.value) || '21:00';
    var parts = v.split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  }

  function currentType() {
    var checked = form.querySelector('input[name="type"]:checked');
    return (checked && TYPES[checked.value]) ? checked.value : 'pacha';
  }

  function renderSchedule(type) {
    if (!scheduleEl) return;
    var t = TYPES[type];
    var curtain = baseMinutes();
    var chuttiStart = curtain - t.chuttiMin - 30;
    var greenRoom = curtain - t.chuttiMin - 75;
    var eyes = curtain - 30;
    var costume = curtain - 18;
    var role = (roleEl && roleEl.value.trim()) || 'the role';
    var rows = [
      [clock(greenRoom), 'Trunks open. Base colour goes on; the beard and crown are laid out in order.'],
      [clock(chuttiStart), 'Chutti begins. Rice paste and lime, ear to ear, built in three passes.'],
      [clock(eyes), 'Chutti set. Eyes reddened with chundappu; the mirror goes away.'],
      [clock(costume), 'Costume and crown. ' + role.charAt(0).toUpperCase() + role.slice(1) + ' waits behind the curtain.'],
      [clock(curtain), 'Curtain. The chenda plays the third variation and the entry begins.']
    ];
    var frag = document.createElement('div');
    frag.innerHTML = '<h3>Green-room clock</h3><ol>' + rows.map(function (r) {
      return '<li><span>' + r[0] + '</span><span>' + r[1] + '</span></li>';
    }).join('') + '</ol>';
    scheduleEl.innerHTML = frag.innerHTML;
  }

  function render(type) {
    var t = TYPES[type];
    face.setAttribute('data-type', type);
    if (titleEl) titleEl.textContent = t.title;
    if (descEl) descEl.textContent = t.desc;
    if (mixEl) mixEl.textContent = t.mix;
    if (chuttiEl) chuttiEl.textContent = t.chutti + ', applied in the green room';
    if (playsEl) playsEl.textContent = t.plays;
    if (walkEl) walkEl.textContent = t.walk;
    if (typeEl) typeEl.textContent = t.label;
    renderSchedule(type);
  }

  form.addEventListener('change', function (e) {
    if (e.target && e.target.name === 'type') render(e.target.value);
    if (e.target && e.target.id === 'curtain') renderSchedule(currentType());
  });
  if (roleEl) {
    roleEl.addEventListener('input', function () { renderSchedule(currentType()); });
  }
  if (curtainEl) {
    curtainEl.addEventListener('input', function () { renderSchedule(currentType()); });
  }

  render(currentType());
})();

/* ============================================================
   Repertoire filter
   ============================================================ */
(function () {
  'use strict';
  var chips = document.querySelectorAll('.filters .chip');
  var rows = document.querySelectorAll('.archive .arc-row');
  var countEl = document.getElementById('archiveCount');
  if (!chips.length || !rows.length) return;

  function apply(filter) {
    var shown = 0;
    rows.forEach(function (row) {
      var match = filter === 'all' || row.getAttribute('data-type') === filter;
      row.classList.toggle('is-hidden', !match);
      if (match) shown++;
    });
    chips.forEach(function (c) {
      var on = c.getAttribute('data-filter') === filter;
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (countEl) countEl.textContent = shown + (shown === 1 ? ' night shown' : ' nights shown');
  }

  chips.forEach(function (c) {
    c.setAttribute('aria-pressed', c.classList.contains('is-on') ? 'true' : 'false');
    c.addEventListener('click', function () { apply(c.getAttribute('data-filter')); });
  });
})();

/* ============================================================
   Enquiry form
   ============================================================ */
(function () {
  'use strict';
  var form = document.getElementById('bookForm');
  if (!form) return;
  var status = document.getElementById('formStatus');

  function setError(name, message) {
    var field = form.elements[name];
    var slot = form.querySelector('.err[data-for="' + name + '"]');
    if (field) field.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (slot) slot.textContent = message || '';
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var errors = 0;

    var name = form.elements.name.value.trim();
    if (name.length < 2) { setError('name', 'Please give a name we can reply to.'); errors++; } else setError('name', '');

    var email = form.elements.email.value.trim();
    if (!validEmail(email)) { setError('email', 'A working email address is needed for the reply.'); errors++; } else setError('email', '');

    var date = form.elements.date.value;
    if (!date) { setError('date', 'Which night are you asking about?'); errors++; }
    else if (new Date(date + 'T00:00:00') < new Date(new Date().toDateString())) { setError('date', 'That date has passed. Send a future night.'); errors++; }
    else setError('date', '');

    var venue = form.elements.venue.value.trim();
    if (venue.length < 3) { setError('venue', 'The town is enough for a first reply.'); errors++; } else setError('venue', '');

    if (errors) {
      if (status) { status.textContent = 'One or two fields still need an answer.'; status.className = 'form-status'; }
      var firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return;
    }

    var occasion = form.elements.occasion.value;
    var pretty = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    if (status) {
      status.className = 'form-status ok';
      status.textContent = 'Noted, ' + name + '. The enquiry for ' + occasion.toLowerCase() + ' at ' + venue + ' on ' + pretty + ' has been logged. A reply goes to ' + email + ' within two working days.';
    }
    form.reset();
    ['name', 'email', 'date', 'venue'].forEach(function (n) { setError(n, ''); });
  });
})();
