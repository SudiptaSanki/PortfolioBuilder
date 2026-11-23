/* Midautumn Yolk — vanilla JS. Mobile nav, the Gift Box Planner
   (which reads its numbers from the printed tables on the page),
   and the contact form's in-page confirmation. */
(function () {
  'use strict';

  /* View-transition abort guard: an aborted CSS view transition surfaces
     as an unhandled rejection; swallow only that exact case. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- mobile nav ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var mnav = document.getElementById('mnav');
  if (menuBtn && mnav) {
    function closeMenu() {
      mnav.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
    menuBtn.addEventListener('click', function () {
      var open = mnav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        requestAnimationFrame(function () {
          var first = mnav.querySelector('a');
          if (first) first.focus();
        });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mnav.classList.contains('open')) {
        closeMenu();
        menuBtn.focus();
      }
    });
    mnav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
  }

  /* ---------- gift box planner ---------- */
  var priceTable = document.getElementById('priceTable');
  var boxTable = document.getElementById('boxTable');
  if (priceTable && boxTable) {
    var cakes = [];
    priceTable.querySelectorAll('tbody tr').forEach(function (tr) {
      cakes.push({
        id: tr.getAttribute('data-id'),
        name: tr.getAttribute('data-name'),
        yolks: parseInt(tr.getAttribute('data-yolks'), 10),
        weight: parseInt(tr.getAttribute('data-weight'), 10),
        price: parseInt(tr.getAttribute('data-price'), 10),
        qty: 0
      });
    });
    var boxes = [];
    boxTable.querySelectorAll('tbody tr').forEach(function (tr) {
      boxes.push({
        size: parseInt(tr.getAttribute('data-size'), 10),
        price: parseInt(tr.getAttribute('data-price'), 10),
        tare: parseInt(tr.getAttribute('data-tare'), 10)
      });
    });
    var boxSize = 4;

    var controls = document.getElementById('cakeControls');
    cakes.forEach(function (cake) {
      var row = document.createElement('div');
      row.className = 'cake-row';
      row.innerHTML =
        '<div class="cake-name"><strong></strong><span></span></div>' +
        '<div class="stepper">' +
        '<button type="button" aria-label="One fewer">−</button>' +
        '<span class="qty" aria-live="polite">0</span>' +
        '<button type="button" aria-label="One more">+</button>' +
        '</div>';
      row.querySelector('strong').textContent = cake.name;
      row.querySelector('span').textContent =
        'RM ' + cake.price + ' · ' + (cake.yolks === 0 ? 'no yolk' : cake.yolks + (cake.yolks === 1 ? ' yolk' : ' yolks')) + ' · ' + cake.weight + ' g';
      var qtyEl = row.querySelector('.qty');
      var btns = row.querySelectorAll('button');
      btns[0].addEventListener('click', function () {
        if (cake.qty > 0) { cake.qty -= 1; qtyEl.textContent = cake.qty; compute(); }
      });
      btns[1].addEventListener('click', function () {
        if (cake.qty < 60) { cake.qty += 1; qtyEl.textContent = cake.qty; compute(); }
      });
      cake.qtyEl = qtyEl;
      controls.appendChild(row);
    });

    var seg = document.getElementById('boxSeg');
    boxes.forEach(function (box) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = 'Box of ' + box.size;
      b.setAttribute('aria-pressed', box.size === boxSize ? 'true' : 'false');
      b.addEventListener('click', function () {
        boxSize = box.size;
        seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        compute();
      });
      seg.appendChild(b);
    });

    var out = {};
    ['outPieces', 'outYolks', 'outBakeDays', 'outCakeWeight', 'outBoxes',
     'outTotalWeight', 'outCakes', 'outBoxCost', 'outTotal'].forEach(function (id) {
      out[id] = document.getElementById(id);
    });
    var verdict = document.getElementById('verdict');
    var dateInput = document.getElementById('collectDate');
    dateInput.addEventListener('change', compute);

    function fmtDateLong(iso) {
      var p = iso.split('-');
      var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
      return new Intl.DateTimeFormat('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
      }).format(d);
    }
    function minusDays(iso, n) {
      var p = iso.split('-');
      var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]) - n * 86400000);
      var mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      var dd = String(d.getUTCDate()).padStart(2, '0');
      return d.getUTCFullYear() + '-' + mm + '-' + dd;
    }
    function setVerdict(kind, title, body) {
      verdict.className = 'verdict' + (kind ? ' ' + kind : '');
      verdict.innerHTML = '';
      var s = document.createElement('strong');
      s.textContent = title;
      verdict.appendChild(s);
      verdict.appendChild(document.createTextNode(body));
    }

    function compute() {
      var pieces = 0, yolks = 0, cakeWeight = 0, cakesCost = 0;
      cakes.forEach(function (c) {
        pieces += c.qty;
        yolks += c.qty * c.yolks;
        cakeWeight += c.qty * c.weight;
        cakesCost += c.qty * c.price;
      });
      var box = boxes.filter(function (b) { return b.size === boxSize; })[0];
      var nBoxes = pieces === 0 ? 0 : Math.ceil(pieces / box.size);
      var boxCost = nBoxes * box.price;
      var totalWeight = cakeWeight + nBoxes * box.tare;
      var bakeDays = Math.ceil(pieces / 60);

      out.outPieces.textContent = pieces;
      out.outYolks.textContent = yolks;
      out.outBakeDays.textContent = bakeDays;
      out.outCakeWeight.textContent = cakeWeight.toLocaleString('en-MY') + ' g';
      out.outBoxes.textContent = nBoxes;
      out.outTotalWeight.textContent = totalWeight.toLocaleString('en-MY') + ' g';
      out.outCakes.textContent = 'RM ' + cakesCost.toLocaleString('en-MY');
      out.outBoxCost.textContent = 'RM ' + boxCost.toLocaleString('en-MY');
      out.outTotal.textContent = 'RM ' + (cakesCost + boxCost).toLocaleString('en-MY');

      var d = dateInput.value;
      if (pieces === 0) {
        setVerdict('', 'Your box is empty.',
          'Add a cake or two — the tables on the left are the whole menu. There is nothing else hiding, and nothing is baked until the book opens on 1 August 2027.');
      } else if (pieces > 240) {
        setVerdict('warn', 'That is a factory-sized order.',
          'Two hundred and forty cakes is four full bake days — the most I will promise one customer in a season. The numbers above are honest, but write to me directly and we will plan the bake days together before anything goes in the book.');
      } else if (d && d < '2027-08-05') {
        setVerdict('bad', 'Too early — the cakes are not out of the oven yet.',
          'The first bake is Monday 2 August 2027, and every cake rests three days before it can be boxed. The earliest collection is Thursday 5 August 2027.');
      } else if (d && d > '2027-09-14') {
        setVerdict('bad', 'Too late — the festival will have passed.',
          'The last bake is Saturday 11 September 2027 and the last collection is Tuesday 14 September, the eve of the festival. I do not bake mooncakes after Mid-Autumn. Choose the 2028 list on the contact page and your name goes first in next year\u2019s book.');
      } else if (d) {
        setVerdict('ok', 'That date works.',
          'Your cakes will be baked by ' + fmtDateLong(minusDays(d, 3)) + ' at the latest, so they get their full three days\u2019 rest before you collect. Send the box to me from the contact page and I will write it in the book.');
      } else {
        setVerdict('', 'Now pick a collection date.',
          'The season runs from Thursday 5 August to Tuesday 14 September 2027. A cake needs three days\u2019 rest after baking, and the festival itself — Wednesday 15 September — is a hard wall.');
      }
    }
    compute();
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById('orderForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName');
      var email = document.getElementById('fEmail');
      if (!name.value.trim()) { name.focus(); return; }
      if (!email.value.trim() || email.value.indexOf('@') < 1) { email.focus(); return; }
      var interest = document.getElementById('fInterest').value;
      var dateVal = document.getElementById('fDate').value;
      var ref = 'MY-2027-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('confirmRef').textContent = ref;
      var text = 'Thank you, ' + name.value.trim() + '. Your note about \u201C' + interest + '\u201D is written in the book under reference ' + ref + '.';
      if (dateVal) {
        var p = dateVal.split('-');
        var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
        text += ' Collection date noted: ' + new Intl.DateTimeFormat('en-GB', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
        }).format(d) + '.';
      }
      document.getElementById('confirmText').textContent = text;
      form.hidden = true;
      var box = document.getElementById('confirmBox');
      box.hidden = false;
      box.setAttribute('tabindex', '-1');
      box.focus();
    });
  }
})();
