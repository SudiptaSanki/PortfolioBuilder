/* Drape Duchess — Rukmini Iyer
   Silent: no audio. The drape studio draws with plain SVG. */
(function () {
  'use strict';

  /* ---------- nav ---------- */
  var menu = document.querySelector('.menu');
  var nav = document.querySelector('.nav');
  if (menu && nav) {
    menu.addEventListener('click', function () {
      var open = menu.getAttribute('aria-expanded') === 'true';
      menu.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && window.innerWidth <= 760) {
        menu.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      }
    });
  }

  /* ---------- reveal ---------- */
  var revealEls = [].slice.call(document.querySelectorAll('.reveal'));
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* ---------- drape studio ---------- */
  var skirt = document.getElementById('saree-skirt');
  if (skirt) {
    var FABRIC = {
      kanjeevaram: { name: 'Kanjeevaram silk', main: '#7d1f33', pallu: '#8d2740', border: '#b08a4f', note: 'Silk holds a pleat without argument. Keep the pleats shallow and let the border do the work.' },
      banarasi: { name: 'Banarasi silk', main: '#6b2b33', pallu: '#7a3340', border: '#c9a35c', note: 'Banarasi is lighter than it looks. Pin the pallu at the shoulder, never at the waist, or the brocade will pull.' },
      chiffon: { name: 'Chiffon', main: '#b8827a', pallu: '#c08f88', border: '#d6b57a', note: 'Chiffon needs a tighter petticoat and a firmer blouse. Without them the pleats collapse by the second hour.' },
      organza: { name: 'Organza', main: '#d3a89e', pallu: '#dcb6ac', border: '#b08a4f', note: 'Organza is crisp and photographs beautifully. It also creases where you sit, so keep the pleat fan narrow.' },
      cotton: { name: 'Handloom cotton', main: '#39524a', pallu: '#44604f', border: '#b08a4f', note: 'Cotton is the kindest fabric to drape and the hardest to keep crisp. Starch the border, not the body.' }
    };

    var DRAPES = {
      nivi: {
        name: 'Nivi',
        pleats: '7, front centre',
        pallu: 'Left shoulder, falling back',
        pins: 3,
        skirt: 'M152 338h116l40 220H112z',
        borderTop: 'M152 338h116l6 22H146z',
        borderHem: 'M118 526h184l14 32H104z',
        palluPath: 'M180 250c42-6 72 10 86 36l-16 26c-24-24-54-32-86-26l-20 6 4-38z',
        fallPath: 'M282 286l18 36c-12 34-16 92-12 148h-42c-2-62 8-130 26-176z',
        pin: 'M212 314l16 6-4 14-16-6z',
        pleatsSvg: 'M164 364c-8 52-12 108-10 164M182 362c-4 54-4 110 0 166M200 362c0 54 4 110 10 166M218 362c4 54 8 110 14 166',
        note: 'The classic. Seven pleats, each about four fingers wide, tucked at the centre front and pinned only where the fabric insists.'
      },
      bengali: {
        name: 'Bengali',
        pleats: '5, front centre',
        pallu: 'Right shoulder, border turned out',
        pins: 2,
        skirt: 'M152 338h116l42 222H110z',
        borderTop: 'M152 338h116l8 24H144z',
        borderHem: 'M114 514h192l16 40H98z',
        palluPath: 'M236 258c-44-8-84 12-102 42l16 26c26-26 58-38 92-32l22 6-8-40z',
        fallPath: 'M136 322l-16 40c10 34 14 90 10 146h44c2-60-10-126-26-168z',
        pin: 'M192 308l-14 6 4 12 16-4z',
        pleatsSvg: 'M170 366c-6 50-8 106-6 162M186 364c-2 54-2 110 2 164M202 364c2 54 6 110 10 164',
        note: 'No pleat fan at the hip, a wide border carried across the chest, and the pallu thrown over the right shoulder so the border reads from the front. Two pins, both at the shoulder.'
      },
      gujarati: {
        name: 'Seedha pallu',
        pleats: '6, right hip',
        pallu: 'Right shoulder, falling straight in front',
        pins: 4,
        skirt: 'M152 338h116l40 220H112z',
        borderTop: 'M152 338h116l6 22H146z',
        borderHem: 'M118 526h184l14 32H104z',
        palluPath: 'M228 254c38 10 60 34 66 68l-30 10c-6-26-20-44-42-50z',
        fallPath: 'M262 316l26 8-8 200h-62c8-78 20-148 44-208z',
        pin: 'M214 312l16 4-2 14-16-4z',
        pleatsSvg: 'M186 366c8 48 14 104 16 158M202 364c10 50 16 106 18 160M218 364c10 50 16 106 18 160',
        note: 'The pallu comes over the right shoulder and falls straight down the front, which is why the blouse has to be exact. Six pleats sit at the right hip instead of the centre.'
      },
      coorgi: {
        name: 'Coorgi',
        pleats: '8, at the back',
        pallu: 'Right shoulder, pinned behind',
        pins: 5,
        skirt: 'M154 338h112l38 220H116z',
        borderTop: 'M154 338h112l6 22H148z',
        borderHem: 'M120 520h180l14 34H106z',
        palluPath: 'M234 262c34 10 54 32 58 62l-28 8c-4-22-16-38-38-44z',
        fallPath: 'M256 326l32 6c-8 64-8 128 0 196h-50c4-72 8-138 18-202z',
        pin: 'M216 316l16 6-4 14-16-6z',
        pleatsSvg: 'M122 368l-8 178M138 368l-4 178M150 368l-2 178',
        note: 'The pleats go at the back, so the front falls clean and flat. Pinned at the right shoulder and held with a waist band rather than a tuck. The most comfortable drape on this page, and the least forgiving of a loose blouse.'
      }
    };

    var OCCASION = {
      wedding: { blouse: 'Elbow sleeve, high back', jewel: 'Temple gold, maang tikka', pins: 1, suffix: 'For a wedding, keep the jewellery heavy and the blouse modest; the drape is doing the work.' },
      sangeet: { blouse: 'Sleeveless, low back', jewel: 'Polki, statement earrings', pins: 2, suffix: 'For a sangeet, pin the pallu twice at the shoulder and once at the waist. You will dance; plan for it.' },
      reception: { blouse: 'Cap sleeve, sweetheart neck', jewel: 'Diamonds, single strand', pins: 1, suffix: 'For a reception, open the pallu like a shawl so the border shows in photographs from the side.' },
      festival: { blouse: 'Half sleeve, round neck', jewel: 'Kundan, small jhumka', pins: 0, suffix: 'For a pooja, keep the pleats low and the pallu secure. You will be sitting on the floor and standing up again.' }
    };

    var state = { drape: 'nivi', fabric: 'kanjeevaram', occasion: 'wedding' };
    var els = {
      skirt: skirt,
      borderTop: document.getElementById('saree-border'),
      pallu: document.getElementById('saree-pallu'),
      pleats: document.getElementById('saree-pleats'),
      pin: document.getElementById('saree-pin'),
      caption: document.getElementById('drape-caption'),
      name: document.getElementById('drape-name'),
      pleatOut: document.getElementById('drape-pleats'),
      palluOut: document.getElementById('drape-pallu'),
      blouse: document.getElementById('drape-blouse'),
      jewel: document.getElementById('drape-jewel'),
      pins: document.getElementById('drape-pins'),
      note: document.getElementById('drape-note'),
      fabricOut: document.getElementById('d-fabric-out')
    };

    function render() {
      var d = DRAPES[state.drape];
      var f = FABRIC[state.fabric];
      var o = OCCASION[state.occasion];

      els.skirt.setAttribute('d', d.skirt);
      els.skirt.setAttribute('fill', f.main);
      /* the border is drawn as two bands: neck edge and hem */
      els.borderTop.setAttribute('d', d.borderTop + ' ' + d.borderHem);
      els.borderTop.setAttribute('fill', f.border);
      els.pallu.setAttribute('d', d.palluPath + ' ' + d.fallPath);
      els.pallu.setAttribute('fill', f.pallu);
      els.pleats.innerHTML = '';
      var pg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pg.setAttribute('d', d.pleatsSvg);
      pg.setAttribute('stroke', '#241318');
      pg.setAttribute('stroke-opacity', '.3');
      pg.setAttribute('fill', 'none');
      els.pleats.appendChild(pg);
      els.pin.setAttribute('d', d.pin);
      els.pin.setAttribute('fill', f.border);
      els.caption.textContent = d.name.toUpperCase() + ' · ' + f.name.toUpperCase();

      els.name.textContent = d.name + ' · ' + f.name;
      els.pleatOut.textContent = d.pleats;
      els.palluOut.textContent = d.pallu;
      els.blouse.textContent = o.blouse;
      els.jewel.textContent = o.jewel;
      els.pins.textContent = String(d.pins + o.pins);
      els.note.textContent = d.note + ' ' + o.suffix;
      els.fabricOut.textContent = f.name;
      /* the extra sentence from the fabric */
      var fabricNote = f.note;
      els.note.textContent = d.note + ' ' + o.suffix + ' ' + fabricNote;
    }

    var drapeBtns = [].slice.call(document.querySelectorAll('.drape-opt'));
    drapeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        drapeBtns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        state.drape = btn.getAttribute('data-drape');
        render();
      });
    });
    var fabricSel = document.getElementById('d-fabric');
    var occasionSel = document.getElementById('d-occasion');
    if (fabricSel) fabricSel.addEventListener('change', function () { state.fabric = fabricSel.value; render(); });
    if (occasionSel) occasionSel.addEventListener('change', function () { state.occasion = occasionSel.value; render(); });

    render();
  }

  /* ---------- lookbook filter ---------- */
  var chips = [].slice.call(document.querySelectorAll('.chip[data-occasion]'));
  if (chips.length) {
    var books = [].slice.call(document.querySelectorAll('.book'));
    var empty = document.querySelector('.book-empty');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        var f = chip.getAttribute('data-occasion');
        var shown = 0;
        books.forEach(function (b) {
          var match = f === 'all' || b.getAttribute('data-occasion') === f;
          b.hidden = !match;
          if (match) shown++;
        });
        if (empty) empty.hidden = shown !== 0;
      });
    });
  }

  /* ---------- fitting form ---------- */
  var form = document.getElementById('fitting-form');
  if (form) {
    var sent = document.getElementById('b-sent');
    var fields = {
      name: { el: document.getElementById('b-name'), msg: 'Please leave a name.' },
      email: { el: document.getElementById('b-email'), msg: 'An email that reaches you.' },
      date: { el: document.getElementById('b-date'), msg: 'The date of the function, or the fitting you want.' },
      occasion: { el: document.getElementById('b-occasion'), msg: 'Choose the occasion.' },
      city: { el: document.getElementById('b-city'), msg: 'Where the fitting would happen.' }
    };
    function err(k, m) {
      var e = document.getElementById('err-b-' + k);
      if (e) e.textContent = m || '';
      if (fields[k].el) fields[k].el.setAttribute('aria-invalid', m ? 'true' : 'false');
    }
    function check() {
      var ok = true;
      if (!fields.name.el.value.trim()) { err('name', fields.name.msg); ok = false; } else err('name');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email.el.value.trim())) { err('email', fields.email.msg); ok = false; } else err('email');
      if (!fields.date.el.value) { err('date', fields.date.msg); ok = false; } else err('date');
      if (!fields.occasion.el.value) { err('occasion', fields.occasion.msg); ok = false; } else err('occasion');
      if (!fields.city.el.value.trim()) { err('city', fields.city.msg); ok = false; } else err('city');
      return ok;
    }
    Object.keys(fields).forEach(function (k) {
      if (!fields[k].el) return;
      var h = function () { if (fields[k].el.getAttribute('aria-invalid') === 'true') check(); };
      fields[k].el.addEventListener('input', h);
      fields[k].el.addEventListener('change', h);
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!check()) {
        var bad = form.querySelector('[aria-invalid="true"]');
        if (bad) bad.focus();
        return;
      }
      var nm = fields.name.el.value.trim().split(' ')[0];
      var note = document.getElementById('b-sent-note');
      if (note) {
        note.textContent = 'Thank you, ' + nm + '. I answer fittings on Monday and Wednesday mornings. Bring the saree, the blouse and the shoes, and we will take it from there.';
      }
      form.hidden = true;
      if (sent) { sent.hidden = false; sent.focus(); }
    });
  }
})();
