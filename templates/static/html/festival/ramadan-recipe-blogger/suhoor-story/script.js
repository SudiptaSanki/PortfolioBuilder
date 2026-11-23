/* Suhoor Story — the masthead, the reverse timeline, and the letter form. */

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- nav ---------- */
  const head = document.querySelector('.masthead');
  const toggle = document.querySelector('.nav-toggle');
  if (head && toggle) {
    toggle.addEventListener('click', () => {
      const open = head.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    head.querySelectorAll('.masthead-nav a').forEach((a) => {
      a.addEventListener('click', () => {
        head.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ---------- the suhoor planner ---------- */

  const DISHES = {
    paratha: { label: 'Malai paratha', verb: 'Start', min: 35, note: 'Roll, cook on a low flame, stack under a cloth.', ahead: 'Make the dough at 21:00 and rest it in the fridge; cold dough rolls faster.', aheadMin: 10 },
    bhurji: { label: 'Anda bhurji', verb: 'Make', min: 12, note: 'The last thing you cook. Take it off while it is still glossy.', ahead: null },
    chai: { label: 'Masala chai', verb: 'Make', min: 8, note: 'Boil once more just before the adhan and leave it covered.', ahead: null },
    khurma: { label: 'Sheer khurma', verb: 'Reheat', min: 6, note: 'Add a splash of milk and stir so it does not catch.', ahead: 'Cook the full batch at 21:00, about 50 minutes; it is better the next day.' },
    keema: { label: 'Keema matar', verb: 'Reheat', min: 8, note: 'Gently, with two spoons of water, lid on.', ahead: 'Cook it at 21:00 for 40 minutes. It is better on the second day anyway.' },
    sattu: { label: 'Sattu sharbat', verb: 'Make', min: 5, note: 'Salt, lemon, black salt, cold water. Stir hard.', ahead: null },
    fruit: { label: 'Fruit chaat', verb: 'Cut', min: 10, note: 'Cut everything fresh; salt and lemon at the end.', ahead: null },
    dahi: { label: 'Dahi phulki', verb: 'Assemble', min: 15, note: 'Whisk the yoghurt, fold in the phulki, add tamarind.', ahead: 'Soak and fry the phulki at 21:00 and keep it covered.' },
  };

  const form = document.getElementById('planForm');
  const timeEl = document.getElementById('suhoorTime');
  const list = document.getElementById('planList');
  const note = document.getElementById('planNote');
  const summary = document.getElementById('planSummary');
  const foot = document.getElementById('planFoot');

  function toMinutes(v) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(v || '');
    if (!m) return null;
    return (Number(m[1]) * 60 + Number(m[2])) % 1440;
  }
  function toClock(mins) {
    const m = ((mins % 1440) + 1440) % 1440;
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }

  function build() {
    if (!list || !timeEl) return;
    const end = toMinutes(timeEl.value);
    const picked = [...document.querySelectorAll('input[name="dish"]:checked')].map((i) => i.value);
    const night = [];
    const morning = [];

    if (end === null) {
      if (note) { note.className = 'plan-status warn'; note.textContent = 'Give me a time to work backwards from.'; }
      return;
    }
    if (!picked.length) {
      if (note) { note.className = 'plan-status warn'; note.textContent = 'Choose at least one dish and I will build the morning around it.'; }
      list.innerHTML = '';
      return;
    }

    const eatBy = end;               // food on the table
    let cursor = eatBy - 4;          // four minutes to sit down and eat

    const all = picked.map((k) => ({ key: k, ...DISHES[k] }));
    const aheadJobs = all.filter((d) => !!d.ahead);
    const freshJobs = all.slice().sort((a, b) => a.min - b.min);

    aheadJobs.forEach((d) => {
      night.push({ at: 21 * 60, what: d.label + ' — start it the night before', note: d.ahead + (d.aheadMin ? ' · ' + d.aheadMin + ' min' : '') });
    });

    // shortest jobs last, so the tea is still hot when the adhan goes
    freshJobs.forEach((d) => {
      const start = cursor - d.min;
      morning.push({ at: start, what: d.verb + ' ' + d.label.toLowerCase(), note: d.note + ' · ' + d.min + ' min' });
      cursor = start - 2;
    });

    const wake = Math.min(...morning.map((m) => m.at)) - 8;

    morning.push({ at: eatBy - 2, what: 'Eat', note: 'Sit down. Do not eat standing at the counter.' });
    morning.push({ at: eatBy, what: 'Stop eating and drinking', note: 'Adhan. Water first, then rinse the pan tomorrow.' });

    morning.sort((a, b) => a.at - b.at);

    list.innerHTML = '';
    night.forEach((row) => {
      const li = document.createElement('li');
      li.className = 'night';
      li.innerHTML = '<span class="plan-time-cell">' + toClock(row.at) + '</span><span class="plan-what">' + row.what + '<em>' + row.note + ' · previous night</em></span>';
      list.appendChild(li);
    });
    morning.forEach((row) => {
      const li = document.createElement('li');
      li.innerHTML = '<span class="plan-time-cell">' + toClock(row.at) + '</span><span class="plan-what">' + row.what + '<em>' + row.note + '</em></span>';
      list.appendChild(li);
    });

    const wakeClock = toClock(wake);
    const eatClock = toClock(eatBy);
    if (summary) {
      summary.textContent = 'Wake at ' + wakeClock + '. Food on the table by ' + toClock(eatBy - 4) + '. Eat by ' + eatClock + '. ' +
        (aheadJobs.length ? aheadJobs.length + ' thing' + (aheadJobs.length > 1 ? 's are' : ' is') + ' done the night before.' : 'Everything is cooked in the morning.');
    }
    if (note) {
      const tight = wake < 3 * 60 + 30 && wake > 60;
      note.className = 'plan-status' + (tight ? ' warn' : '');
      note.textContent = tight
        ? 'That starts at ' + wakeClock + ', which is earlier than the meal is worth. Drop one long dish or move something to the night before.'
        : 'Doable. ' + (end > 5 * 60 ? 'Your suhoor is late; the morning has room.' : 'Keep to the times and you will be back in bed by ' + toClock(eatBy + 20) + '.');
    }
    if (foot) {
      foot.textContent = 'Times are counted backwards from ' + toClock(end) + '. ' + picked.length + ' dish' + (picked.length > 1 ? 'es' : '') + ' chosen. Heat, washing and the ten minutes you will lose looking for the lid are already allowed for.';
    }
  }

  if (form) {
    form.addEventListener('submit', (e) => { e.preventDefault(); build(); });
    form.querySelectorAll('input[name="dish"]').forEach((i) => i.addEventListener('change', build));
  }
  if (timeEl) timeEl.addEventListener('input', build);
  if (list && list.children.length === 0) build();

  /* ---------- letter form ---------- */
  const letter = document.getElementById('letterForm');
  if (letter) {
    const status = document.getElementById('letterStatus');
    letter.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = new FormData(letter);
      const email = String(d.get('email') || '').trim();
      const name = String(d.get('name') || '').trim();
      const topic = String(d.get('topic') || '').trim();
      const msg = String(d.get('message') || '').trim();
      const bad = [];
      if (name.length < 2) bad.push('your name');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) bad.push('a working email');
      if (msg.length < 10) bad.push('a line about what you are asking');
      if (bad.length) {
        status.className = 'letter-status err';
        status.textContent = 'Please add ' + bad.join(', ') + '.';
        return;
      }
      status.className = 'letter-status ok';
      status.textContent = 'Thank you, ' + name.split(' ')[0] + '. ' +
        (topic === 'letter' ? 'You are on the Friday list; the next letter goes out before the twenty-first night.'
          : topic === 'recipe' ? 'I answer recipe questions myself, usually within a few days, and sometimes with a photograph of the pan.'
          : 'I read everything and answer most of it, though not quickly in the last ten nights.');
      letter.reset();
    });
  }
})();
