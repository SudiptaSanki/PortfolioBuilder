/* Wind and Water — Su-Lin Teo, feng shui plan readings.
   No sound anywhere (need-test: a plan-reading practice is silent).
   The planner's rules and fees mirror the tables printed on index.html;
   the fee extras are read from the printed fee table's data attributes. */
(function () {
  'use strict';

  /* View-transition aborts (rapid navigation) surface as unhandled
     InvalidStateError rejections in some browsers; swallow only those. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- Mobile nav: plan-sheet panel ---------- */
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('navPanel');
  var scrim = document.getElementById('scrim');
  var closeBtn = document.getElementById('panelClose');
  function openNav() {
    document.body.classList.add('nav-open');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () { if (closeBtn) closeBtn.focus({ preventScroll: true }); });
  }
  function closeNav(restoreFocus) {
    document.body.classList.remove('nav-open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (restoreFocus && btn) btn.focus({ preventScroll: true });
  }
  if (btn && panel) {
    btn.addEventListener('click', openNav);
    if (closeBtn) closeBtn.addEventListener('click', function () { closeNav(true); });
    if (scrim) scrim.addEventListener('click', function () { closeNav(true); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) closeNav(true);
    });
    panel.querySelectorAll('nav a').forEach(function (a) {
      a.addEventListener('click', function () { closeNav(false); });
    });
  }

  /* ---------- Bagua Reading Planner (index.html) ---------- */
  var form = document.getElementById('plannerForm');
  if (form) {
    var AREAS = {
      wealth: 'Wealth', fame: 'Fame', relat: 'Relationships',
      family: 'Family', centre: 'Centre', creat: 'Children & creativity',
      know: 'Knowledge', career: 'Career', help: 'Helpful people'
    };
    /* The printed rules, mirrored: good / against per room. Anything
       else is workable — furniture before walls. */
    var RULES = {
      kitchen: { label: 'Kitchen', good: ['family', 'wealth', 'fame'], against: ['career', 'centre'],
        agree: 'Fire in a feeding area — the printed rules are content.' },
      bedroom: { label: 'Main bedroom', good: ['relat', 'know', 'help'], against: ['fame', 'centre'],
        agree: 'A quiet corner. The bed wants a wall, and no mirror facing it.' },
      desk: { label: 'Desk / study', good: ['know', 'career', 'wealth'], against: ['centre'],
        agree: 'Books and work in a learning area — nothing to move.' },
      till: { label: 'Till / register', good: ['wealth', 'fame', 'help'], against: ['centre', 'career'],
        agree: 'The till where the plan keeps its accounts. Watch the queue\u2019s route instead.' },
      toilet: { label: 'Toilet', good: ['career', 'know'], against: ['wealth', 'fame', 'centre'],
        agree: 'Water in a quiet corner — door shut, and it asks nothing more.' },
      kids: { label: "Children's room", good: ['creat', 'family', 'know'], against: ['relat', 'centre'],
        agree: 'A room that agrees with its corner. Leave it be.' }
    };
    var WHY = {
      'kitchen|career': 'Water\u2019s corner: stove and sink argue all day. If the stove cannot move, turn it, so the cook is not back-to-door.',
      'kitchen|centre': 'A kitchen in the centre puts fire and grease in the tai chi. If the kitchen is fixed there, keep its door shut and its floor clear — the centre itself stays open.',
      'bedroom|fame': 'Fame is the bright far wall; a bedroom wants dark. Heavy curtains, and the bed off the lit wall.',
      'bedroom|centre': 'A bed in the centre has no wall to rest against. Move the sleeping to a corner room if the plan allows.',
      'desk|centre': 'A chair marooned mid-room, no wall behind it. Move the desk to a wall before anything else is discussed.',
      'till|centre': 'A till island blocks the floor it stands on — the bakery reading on the Readings page began exactly here.',
      'till|career': 'The till in the doorway\u2019s path means the queue crosses the door. Move the till; run the queue along a wall.',
      'toilet|wealth': 'A drain in the corner the shop keeps. Door shut, lid down, and the wealth corner\u2019s real work done elsewhere on the plan.',
      'toilet|fame': 'Water on the fire wall. Keep the door shut; put the shop\u2019s name and its light on a drier stretch of the same wall.',
      'toilet|centre': 'A toilet in the tai chi drains the middle of the plan. Door shut, always; nothing stored around it.',
      'kids|relat': 'That corner is the couple\u2019s. If the rooms cannot swap, keep the parents\u2019 room the quieter and darker of the two.',
      'kids|centre': 'Children in the centre means toys in the tai chi. A box by the door and a clear middle, every evening.'
    };
    var TYPE_SHORT = {
      flat120: 'a flat up to 120 m\u00B2',
      flat250: 'a flat or house, 121\u2013250 m\u00B2',
      shop200: 'a shop or office up to 200 m\u00B2'
    };

    var typeSel = document.getElementById('p-type');
    var doorSel = document.getElementById('p-door');
    var visitBox = document.getElementById('p-visit');
    var expressBox = document.getElementById('p-express');
    var minusBtn = document.getElementById('p-minus');
    var plusBtn = document.getElementById('p-plus');
    var extraOut = document.getElementById('p-extra-out');
    var doorNote = document.getElementById('n-door');
    var beamNote = document.getElementById('n-beam');
    var structuralBox = document.getElementById('n-structural');
    var verdictsEl = document.getElementById('p-verdicts');
    var notesEl = document.getElementById('p-notes');
    var summaryEl = document.getElementById('p-summary');
    var feeWrap = document.getElementById('p-fee');
    var feeBody = document.getElementById('fee-body');
    var totalEl = document.getElementById('p-total');
    var refusalEl = document.getElementById('p-refusal');
    var extra = 0;

    function tableAmount(id, fallback) {
      var el = document.getElementById(id);
      var v = el ? parseInt(el.getAttribute('data-amount'), 10) : NaN;
      return isNaN(v) ? fallback : v;
    }
    function money(n) { return 'S$' + n.toLocaleString('en-SG'); }

    function compute() {
      /* --- verdicts --- */
      var counts = { agree: 0, work: 0, against: 0 };
      var items = [];
      document.querySelectorAll('.room-sel').forEach(function (sel) {
        var rule = RULES[sel.getAttribute('data-room')];
        var area = sel.value;
        var kind, text;
        if (rule.good.indexOf(area) !== -1) {
          kind = 'agree'; counts.agree++;
          text = rule.agree;
        } else if (rule.against.indexOf(area) !== -1) {
          kind = 'against'; counts.against++;
          text = WHY[sel.getAttribute('data-room') + '|' + area] || 'Works against the printed rules.';
        } else {
          kind = 'work'; counts.work++;
          text = 'Workable — I would look at the furniture before the walls.';
        }
        var tag = kind === 'agree' ? 'Agrees' : (kind === 'against' ? 'Works against' : 'Workable');
        var tagClass = kind === 'work' ? 'workable' : kind;
        items.push('<li><span class="tag ' + tagClass + '">' + tag + '</span> <span><b>' +
          rule.label + '</b> in ' + AREAS[area] + ' — ' + text + '</span></li>');
      });
      verdictsEl.innerHTML = items.join('');
      document.getElementById('c-agree').textContent = counts.agree;
      document.getElementById('c-work').textContent = counts.work;
      document.getElementById('c-against').textContent = counts.against;

      /* --- form notes --- */
      var notes = [];
      if (doorNote.checked) notes.push('<div class="note-line"><b>The door question.</b> A door opening straight onto stairs, a lift lobby or a downhill corridor gets a screen, a heavy threshold mat, or a console just inside — furniture placed to slow the rush. Never a hanging trinket.</div>');
      if (beamNote.checked) notes.push('<div class="note-line"><b>The beam.</b> I sell no beam cures, because there are none I believe in. Move the bed or the desk out from under it. If it truly cannot move, a canopy or a false ceiling is a builder\u2019s conversation, priced by the builder.</div>');
      notesEl.innerHTML = notes.join('');

      /* --- summary --- */
      summaryEl.textContent = 'For ' + TYPE_SHORT[typeSel.value] + ' \u00B7 door facing ' + doorSel.value;

      /* --- fees, read from the printed table --- */
      var opt = typeSel.options[typeSel.selectedIndex];
      var base = parseInt(opt.getAttribute('data-fee'), 10);
      var stepAmt = tableAmount('fee-extra', 120);
      var visitAmt = tableAmount('fee-visit', 180);
      var expressAmt = tableAmount('fee-express', 150);
      var lines = [{ label: opt.textContent.trim(), amt: base }];
      if (extra > 0) lines.push({ label: 'Extra area \u2014 ' + extra + ' \u00D7 100 m\u00B2 blocks', amt: extra * stepAmt });
      if (visitBox.checked) lines.push({ label: 'Site visit \u2014 half day, Singapore', amt: visitAmt });
      if (expressBox.checked) lines.push({ label: 'Festival-season express \u2014 report in 5 working days', amt: expressAmt });
      var total = lines.reduce(function (s, l) { return s + l.amt; }, 0);
      feeBody.innerHTML = lines.map(function (l) {
        return '<tr><td>' + l.label + '</td><td class="amt">' + money(l.amt) + '</td></tr>';
      }).join('');
      totalEl.textContent = money(total);
      extraOut.textContent = extra;
      minusBtn.disabled = extra <= 0;
      plusBtn.disabled = extra >= 6;

      /* --- the honest refusal --- */
      var structural = structuralBox.checked;
      refusalEl.hidden = !structural;
      feeWrap.style.display = structural ? 'none' : '';
    }

    form.addEventListener('change', compute);
    minusBtn.addEventListener('click', function () { if (extra > 0) { extra--; compute(); } });
    plusBtn.addEventListener('click', function () { if (extra < 6) { extra++; compute(); } });
    compute();
  }

  /* ---------- Contact form (contact.html) ---------- */
  var cForm = document.getElementById('contactForm');
  if (cForm) {
    var errEl = document.getElementById('c-error');
    var confirmEl = document.getElementById('c-confirm');
    cForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('c-name').value.trim();
      var email = document.getElementById('c-email').value.trim();
      var msg = document.getElementById('c-msg').value.trim();
      var ok = name.length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && msg.length > 3;
      if (!ok) { errEl.hidden = false; return; }
      errEl.hidden = true;
      var ref = 'WW-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('c-ref').textContent = ref;
      cForm.hidden = true;
      confirmEl.hidden = false;
      confirmEl.focus({ preventScroll: false });
    });
  }
})();
