/* Kenji Vargas — dreidel carver
   Nav, the try-out bench and the commission form. The top is CSS 3D; the spin is a timed
   transform, so nothing here makes a sound and nothing loads but the fonts. */

(function () {
  'use strict';

  /* ---------- nav ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- enquiry form ---------- */
  const form = document.getElementById('commissionForm');
  if (form) {
    const status = document.getElementById('formStatus');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const want = String(data.get('want') || '').trim();
      const message = String(data.get('message') || '').trim();
      if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || message.length < 12) {
        status.className = 'form-status err';
        status.textContent = 'I need your name, an email that works, and a sentence about what you want turned. A photograph of a broken piece helps.';
        return;
      }
      status.className = 'form-status ok';
      status.textContent = 'Thanks, ' + name.split(' ')[0] + '. Your note about ' + (want || 'a dreidel') + ' is in the bench book. I answer on Sunday evenings and Wednesday mornings, between coats of oil.';
      form.reset();
    });
  }

  /* ---------- the try-out bench ---------- */
  const benchTop = document.getElementById('benchTop');
  if (!benchTop) return;

  const WOODS = {
    maple: { label: 'Hard maple', price: 86, density: 705, spin: 11.2 },
    walnut: { label: 'Black walnut', price: 104, density: 640, spin: 10.6 },
    mesquite: { label: 'Texas mesquite', price: 118, density: 880, spin: 9.8 },
    olive: { label: 'Olive', price: 132, density: 990, spin: 10.1 }
  };
  const LETTERS = ['נ', 'ג', 'ה', 'פ'];
  const RULES = [
    { kicker: 'The top settles', text: 'Nun. Nisht — nothing. You pass the top and the pot stays where it is.' },
    { kicker: 'The top settles', text: 'Gimel. Gants — you take the whole pot.' },
    { kicker: 'The top settles', text: 'Hey. Halb — you take half the pot, rounded up.' },
    { kicker: 'The top settles', text: 'Pe. Put in — you add one coin or one candy to the pot.' }
  ];
  const PO_TEXT = 'Pe. Po — here. The sevivon\u2019s fourth letter means here, not put in, and the pot is usually matchsticks.';

  let wood = 'maple';
  let size = 72;
  let letterSet = 'diaspora';
  let rotation = -26;
  let spinning = false;
  let lastSpot = 11.2;

  const priceOut = document.getElementById('priceOut');
  const buildNote = document.getElementById('buildNote');
  const sizeInput = document.getElementById('size');
  const sizeOut = document.getElementById('sizeOut');
  const specWood = document.getElementById('specWood');
  const specWeight = document.getElementById('specWeight');
  const specSpin = document.getElementById('specSpin');
  const resultKicker = document.getElementById('resultKicker');
  const resultLetter = document.getElementById('resultLetter');
  const resultRule = document.getElementById('resultRule');
  const resultMeta = document.getElementById('resultMeta');
  const spinBtn = document.getElementById('spinBtn');
  const resetBtn = document.getElementById('resetSpin');

  const nf = new Intl.NumberFormat('en-US');

  function specs() {
    const w = WOODS[wood];
    const weight = Math.round(64 * Math.pow(size / 72, 3) * (w.density / 705));
    const price = Math.round((w.price * Math.pow(size / 72, 1.55)) / 2) * 2;
    const spin = (w.spin * (0.82 + 0.18 * Math.sqrt(72 / size))).toFixed(1);
    return { weight, price, spin };
  }

  function paint() {
    const w = WOODS[wood];
    const s = specs();
    benchTop.dataset.wood = wood;
    benchTop.style.setProperty('--w', (size * 2.05).toFixed(0) + 'px');
    priceOut.textContent = '$' + nf.format(s.price);
    sizeOut.textContent = size + ' mm';
    specWood.textContent = w.label;
    specWeight.textContent = s.weight + ' g';
    specSpin.textContent = s.spin + ' s';
    buildNote.textContent = w.label + ', ' + size + ' mm. Rough-turned green, dried six weeks, finish-turned, weighted with a brass pin and oiled three times.';
    lastSpot = Number(s.spin);
  }

  function setLetterSet() {
    /* the letters are the same on both; only pe changes meaning */
    const pe = document.querySelector('#benchTop .f4 span');
    if (pe) pe.textContent = LETTERS[3];
    letterSet = document.querySelector('input[name="set"]:checked').value;
    if (!spinning) {
      resultMeta.textContent = letterSet === 'sevivon'
        ? 'Israeli sevivon: nun, gimel, hey, pe — pe for po, here. Same top, same letters, one different rule.'
        : 'Set a wood and a size, then spin. The top runs for about four seconds — long enough to see the letters go round.';
    }
  }

  document.querySelectorAll('input[name="wood"]').forEach((r) => {
    r.addEventListener('change', () => {
      if (!r.checked) return;
      wood = r.value;
      paint();
      if (!spinning) {
        resultKicker.textContent = 'On the bench';
        resultMeta.textContent = WOODS[wood].label + ' on the mandrel. Rough diameter ' + (size + 8) + ' mm; the finished body will be ' + size + ' mm across the letters.';
      }
    });
  });

  sizeInput.addEventListener('input', () => {
    size = Number(sizeInput.value);
    paint();
  });

  document.querySelectorAll('input[name="set"]').forEach((r) => {
    r.addEventListener('change', () => { if (r.checked) setLetterSet(); });
  });

  function spin() {
    if (spinning) return;
    spinning = true;
    spinBtn.disabled = true;
    spinBtn.textContent = 'Turning…';
    resultKicker.textContent = 'Turning';
    resultRule.textContent = 'Let it run. A good top leans a little before it settles.';
    resultMeta.textContent = 'Bench test: ' + WOODS[wood].label.toLowerCase() + ', ' + size + ' mm, brass pin.';

    const face = Math.floor(Math.random() * 4);
    const jitter = (Math.random() * 10) - 5;
    const turns = 4 + Math.floor(Math.random() * 3);
    const target = rotation + turns * 360 - (face * 90) + jitter;
    rotation = target;

    benchTop.style.transition = 'transform 3.8s cubic-bezier(.12, .68, .05, 1)';
    benchTop.style.transform = 'rotateX(-7deg) rotateY(' + target + 'deg)';
    benchTop.classList.add('is-spinning');

    window.setTimeout(() => {
      benchTop.classList.remove('is-spinning');
      spinning = false;
      spinBtn.disabled = false;
      spinBtn.textContent = 'Spin again';
      const r = RULES[face];
      resultKicker.textContent = r.kicker;
      resultLetter.textContent = LETTERS[face];
      resultRule.textContent = face === 3 && letterSet === 'sevivon' ? PO_TEXT : r.text;
      resultMeta.textContent = 'Landed in ' + lastSpot + ' s of spin on ' + WOODS[wood].label.toLowerCase() + ', ' + size + ' mm. ' +
        (face === 1 ? 'Gimel is the face players want; it is also the one I cut deepest, so it holds its edge.' :
          face === 0 ? 'Nun is not a loss. It is the top telling you to wait your turn.' :
            face === 2 ? 'Half the pot, and the game goes on — which is the point of the game.' :
              'Pe keeps the pot alive for the next player. Someone has to feed it.');
    }, 3900);
  }

  spinBtn.addEventListener('click', spin);

  resetBtn.addEventListener('click', () => {
    if (spinning) return;
    wood = 'maple';
    size = 72;
    sizeInput.value = '72';
    document.querySelector('input[name="wood"][value="maple"]').checked = true;
    document.querySelector('input[name="set"][value="diaspora"]').checked = true;
    setLetterSet();
    paint();
    rotation = -26;
    benchTop.style.transition = 'transform .5s ease';
    benchTop.style.transform = 'rotateX(-7deg) rotateY(-26deg)';
    spinBtn.textContent = 'Spin the lathe';
    resultKicker.textContent = 'Ready on the bench';
    resultLetter.textContent = 'ג';
    resultRule.textContent = 'Gimel. Gants — take the whole pot.';
    resultMeta.textContent = 'Set a wood and a size, then spin. The top runs for about four seconds — long enough to see the letters go round.';
  });

  paint();
  setLetterSet();
})();
